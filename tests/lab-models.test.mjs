// Автотесты расчётных моделей виртуальной лаборатории: node --test tests/lab-models.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const read = (f) => readFileSync(new URL("../src/lab/" + f, import.meta.url), "utf8");
// labs.js использует глобальные L и fmt из site.js — подставляем минимальные версии.
const ctx = vm.createContext({ LANG: "ru", L: (k, r, e) => r, fmt: (x, d) => String(+(+x).toFixed(d == null ? 2 : d)) });
vm.runInContext(read("models.js") + ";\nthis.M = NCLabModels;", ctx);
vm.runInContext(read("labs.js") + ";\nthis.LABS = NCLabs;", ctx);
const M = ctx.M, LABS = ctx.LABS;
const near = (a, b, tol = 1e-6) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));

test("тиосульфат: 1000/t пропорционально C при постоянной T", () => {
  const pts = [0.03, 0.06, 0.09, 0.12, 0.15].map((C) => [C, M.thiosulfate({ C, T: 20 }).inv]);
  // Пропорциональность приближённая: к моменту «исчезновения креста» расходуется S*/C тиосульфата
  // (до 7 % при C = 0,03), поэтому отклонение от прямой до ~3 %.
  for (const [C, inv] of pts) assert.ok(Math.abs(inv / C - pts[4][1] / 0.15) / (pts[4][1] / 0.15) < 0.04, `C=${C}`);
  assert.ok(pts.every((p, i) => i === 0 || p[1] > pts[i - 1][1]), "монотонность");
});

test("тиосульфат: температурная зависимость по Аррениусу, γ ≈ 2", () => {
  const t20 = M.thiosulfate({ C: 0.1, T: 20 }).t, t30 = M.thiosulfate({ C: 0.1, T: 30 }).t;
  const expected = Math.exp((50000 / 8.314) * (1 / 293.15 - 1 / 303.15));
  assert.ok(near(t20 / t30, expected, 1e-9));
  assert.ok(t20 / t30 > 1.8 && t20 / t30 < 2.2);
  assert.equal(M.thiosulfate({ C: 0.2, T: 20 }).ok, false, "вне диапазона");
  assert.equal(M.thiosulfate({ C: 0.1, T: 80 }).ok, false, "вне диапазона");
});

test("пероксид: аналитическое решение 1-го порядка и стехиометрия O₂", () => {
  for (const cat of ["none", "mno2", "catalase"]) {
    const r = M.peroxide({ C0: 0.9, cat });
    const Vmax = 0.9 * 0.01 / 2 * 24.05 * 1000;
    assert.ok(near(r.Vmax, Vmax), "Vmax");
    assert.ok(near(r.V(r.half), Vmax / 2, 1e-9) || !isFinite(r.half), "V(t½) = Vmax/2");
    assert.ok(r.V(r.end) <= Vmax + 1e-9);
  }
  const a = M.peroxide({ C0: 0.9, cat: "none" }).V60, b = M.peroxide({ C0: 0.9, cat: "mno2" }).V60, c = M.peroxide({ C0: 0.9, cat: "catalase" }).V60;
  assert.ok(a < 0.01 && b > a && c > b, "катализаторы ускоряют, итоговый объём одинаков");
  assert.equal(M.peroxide({ C0: 0.9, cat: "gold" }).ok, false);
});

test("мрамор: стехиометрия, лимитирующий реагент, сохранение массы", () => {
  const sizes = ["chunk", "grain", "powder"];
  for (const m0 of [0.5, 1, 1.5, 2]) for (const C of [0.5, 1, 1.5, 2]) for (const size of sizes) {
    const r = M.marble({ m0, C, size });
    const nMax = Math.min(m0 / 100.09, (C * 0.05) / 2);
    assert.ok(r.mCO2 <= nMax * 44.01 + 1e-9, "CO₂ не больше теоретического");
    if (r.complete) assert.ok(near(r.mCO2, nMax * 44.01, 1e-4), `полная реакция m0=${m0} C=${C} ${size}`);
    assert.ok(near(r.massStart - r.massEnd, r.mCO2, 1e-9), "открытая колба теряет ровно m(CO₂)");
    const closed = M.marble({ m0, C, size, closed: true });
    assert.equal(closed.massEnd, closed.massStart, "закрытая колба: масса сохраняется");
    let prev = -1;
    for (let t = 0; t <= r.end; t += r.end / 50) { const v = r.lost(t); assert.ok(v >= prev - 1e-12); prev = v; }
  }
  const t = (s) => { const r = M.marble({ m0: 1, C: 1, size: s }); return r.complete ? r.t90 : Infinity; };
  assert.ok(t("powder") < t("grain") && t("grain") < t("chunk"), "чем мельче, тем быстрее");
  assert.equal(M.marble({ m0: 2, C: 0.5, size: "powder" }).limiting, "HCl");
  assert.equal(M.marble({ m0: 0.5, C: 2, size: "powder" }).limiting, "CaCO3");
});

test("набор данных L5 воспроизводим и соответствует 1-му порядку", () => {
  for (let s = 1; s < 200; s++) {
    const a = M.dataset(s), b = M.dataset(s);
    assert.deepEqual(a, b);
    a.rows.forEach(([t, C]) => assert.ok(Math.abs(C - a.C0 * Math.exp(-a.k * t)) <= 0.0005 + 1e-12));
    assert.ok(a.rows.every((r, i) => i === 0 || r[1] < a.rows[i - 1][1]));
  }
});

test("описания лабораторий согласованы и трёхъязычны", () => {
  const KZ = /[әғқңөұүһіӘҒҚҢӨҰҮҺІ]/, CYR = /[Ѐ-ӿ]/;
  const tri = (a, where) => {
    assert.ok(Array.isArray(a) && a.length === 3, where);
    assert.ok(!KZ.test(a[1]), `RU с казахскими буквами: ${where}: ${a[1].slice(0, 60)}`);
    assert.ok(!CYR.test(a[2]), `EN с кириллицей: ${where}: ${a[2].slice(0, 60)}`);
  };
  const ids = new Set();
  for (const l of LABS.list) {
    assert.ok(!ids.has(l.id)); ids.add(l.id);
    ["title", "topic", "goal", "theory", "safety", "conclusionHint", "explain"].forEach((k) => tri(l[k], `${l.id}.${k}`));
    l.equipment.forEach((e, i) => tri(e, `${l.id}.equipment${i}`));
    l.model.notes.forEach((n, i) => tri(n, `${l.id}.model${i}`));
    tri(l.prediction.q, `${l.id}.prediction`);
    assert.ok(l.prediction.correct >= 0 && l.prediction.correct < l.prediction.opts.length);
    const levels = new Set(l.questions.map((q) => q.level));
    assert.ok(levels.has("base") && levels.has("adv") && levels.has("res"), `${l.id}: три уровня вопросов`);
    for (const q of l.questions) {
      tri(q.q, `${l.id}.${q.id}`); tri(q.explain, `${l.id}.${q.id}.explain`);
      if (q.type === "choice") { assert.ok(q.correct >= 0 && q.correct < q.opts.length); q.opts.forEach((o) => tri(o, `${l.id}.${q.id}.opt`)); }
    }
    if (l.kind !== "data") {
      const p = {}; l.controls.forEach((c) => { p[c.id] = c.value; });
      const r = l.simulate(p);
      assert.ok(r.ok, `${l.id}: модель работает на значениях по умолчанию`);
      const row = l.row(p, r); assert.equal(row.length, l.columns().length, `${l.id}: столбцы таблицы`);
      assert.ok(r.end > 0 && isFinite(r.end));
      const st = { runs: [{ p }, { p }], dataSeed: 7 };
      l.questions.filter((q) => q.type === "num").forEach((q) => { const v = q.answer(st, l.simulate); assert.ok(v > 0 && isFinite(v), `${l.id}.${q.id}: эталон`); });
    }
  }
  for (const g of LABS.planned) g.items.forEach((t, i) => tri(t, `planned ${g.grade}.${i}`));
});
