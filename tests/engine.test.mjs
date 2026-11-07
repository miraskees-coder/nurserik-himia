// Автотесты движка задач: node --test tests/engine.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

// Движок — обычный браузерный скрипт; выполняем его так же, как браузер.
const code = readFileSync(new URL("../src/trainer/engine.js", import.meta.url), "utf8");
const E = vm.runInNewContext(code + ";\nNCEngine;", {});
const KZ = /[әғқңөұүһіӘҒҚҢӨҰҮҺІ]/;
const CYR = /[Ѐ-ӿ]/;
const SEEDS = Array.from({ length: 1500 }, (_, i) => i * 7919 + 13);
const LANGS = ["kk", "ru", "en"];

// Независимый пересчёт эталона по параметрам (без кода шаблона).
function reference(id, p) {
  const R = 8.314;
  switch (id) {
    case "avg_rate": return Math.abs(p.C2 - p.C1) / p.t;
    case "vh_ratio": return p.g ** ((p.t2 - p.t1) / 10);
    case "vh_gamma": return p.ratio ** (10 / p.d);
    case "vh_time": return p.tau / p.g ** ((p.t2 - p.t1) / 10);
    case "arr_ratio": return Math.exp((p.Ea * 1000) / R * (1 / (p.t1 + 273.15) - 1 / (p.t2 + 273.15)));
    case "arr_ea": return (R * Math.log(p.ratio)) / (1 / p.T1 - 1 / p.T2) / 1000;
    case "half_life": return p.ask === "th" ? Math.log(2) / p.k : 100 * Math.exp(-p.k * p.t);
    default: return null;
  }
}

test("каждый шаблон даёт корректные варианты и эталон совпадает с независимым расчётом", () => {
  for (const t of E.templates) {
    for (const seed of SEEDS) {
      const g = E.generate(t.id, seed);
      const a = t.answer(g.params);
      assert.ok(Number.isFinite(a.value) && a.value > 0, `${t.id}/${seed}: ответ ${a.value}`);
      const ref = reference(t.id, g.params);
      if (ref !== null) assert.ok(Math.abs(ref - a.value) / a.value < 1e-9, `${t.id}/${seed}: ${ref} ≠ ${a.value}`);
    }
  }
});

test("генерация воспроизводима по seed и даёт разнообразные варианты", () => {
  for (const t of E.templates) {
    const a = E.generate(t.id, 42), b = E.generate(t.id, 42);
    assert.deepEqual(a.params, b.params);
    assert.equal(a.ai.type, b.ai.type);
    const distinct = new Set(SEEDS.slice(0, 300).map((s) => JSON.stringify(E.generate(t.id, s).params)));
    assert.ok(distinct.size >= 8, `${t.id}: всего ${distinct.size} разных вариантов`);
  }
});

test("верный ответ принимается в любом языке, с запятой и точкой, в эквивалентных единицах", () => {
  for (const t of E.templates) {
    for (const seed of SEEDS.slice(0, 400)) {
      const g = E.generate(t.id, seed), a = t.answer(g.params);
      for (const lang of LANGS) {
        const s = E.G(a.value, lang, 4).replace(/[ ]/g, "");
        if (lang === "en" && s.includes(",")) continue; // разделитель тысяч в английском
        assert.equal(E.check(t.id, g.params, s, a.unit).status, "ok", `${t.id}/${seed}/${lang}: «${s}»`);
      }
      for (const u of E.unitsOf(t, g.params)) {
        const U = E.UNITS[u], B = E.UNITS[a.unit];
        if (U.dim !== B.dim) {
          assert.equal(E.check(t.id, g.params, String(a.value), u).status, "unit", `${t.id}: единица ${u}`);
        } else {
          const v = (a.value * U.f) / B.f;
          assert.equal(E.check(t.id, g.params, v.toPrecision(6), u).status, "ok", `${t.id}: эквивалент в ${u}`);
        }
      }
    }
  }
});

test("типичные ошибки распознаются, а не засчитываются как верные", () => {
  let seen = 0;
  for (const t of E.templates) {
    for (const seed of SEEDS.slice(0, 400)) {
      const g = E.generate(t.id, seed), a = t.answer(g.params);
      for (const m of t.mistakes(g.params)) {
        if (!Number.isFinite(m.value) || m.value <= 0 || m.value > 1e12) continue;
        if (Math.abs(m.value - a.value) / a.value <= t.tol) continue;
        const r = E.check(t.id, g.params, m.value.toPrecision(6), a.unit);
        assert.notEqual(r.status, "ok", `${t.id}/${seed}: ошибка ${m.id} засчитана`);
        seen++;
      }
      assert.equal(E.check(t.id, g.params, "abc", a.unit).status, "nan");
      assert.equal(E.check(t.id, g.params, String(a.value * 1.5), a.unit).status === "ok", false);
    }
  }
  assert.ok(seen > 1000);
});

test("контрольные значения из учебных задач", () => {
  const near = (x, y, tol = 0.006) => Math.abs(x - y) / y < tol;
  const vh = E.byId("vh_ratio");
  assert.equal(vh.answer({ g: 2.5, t1: 20, t2: 50, d: 30 }).value, 15.625);
  const arr = E.byId("arr_ratio");
  assert.ok(near(arr.answer({ Ea: 50, t1: 25, t2: 35 }).value, 1.924));
  const ea = E.byId("arr_ea");
  assert.ok(near(ea.answer({ ratio: 2, T1: 300, T2: 310 }).value, 53.59));
  const ma = E.byId("mass_action");
  assert.equal(ma.answer({ rx: 0, kind: "p", n: 2, sp: 0 }).value, 8);
  assert.equal(ma.answer({ rx: 0, kind: "c", n: 3, sp: 0 }).value, 9);
  assert.equal(ma.answer({ rx: 3, kind: "p", n: 3, sp: 0 }).value, 3);
  const hl = E.byId("half_life");
  assert.ok(near(hl.answer({ ask: "th", k: 0.0231 }).value, 30));
  assert.ok(near(E.byId("avg_rate").answer({ C1: 0.8, C2: 0.5, t: 60 }).value, 0.005));
});

test("тексты: в русском нет казахских букв, в английском нет кириллицы", () => {
  for (const t of E.templates) {
    for (const seed of SEEDS.slice(0, 120)) {
      const g = E.generate(t.id, seed), p = g.params;
      const parts = (l) => [t.statement(p, l), ...t.givens(p, l).map((x) => x.text), ...t.hints.map((h) => h(p, l)), ...t.solution(p, l), ...g.ai.text(l)];
      for (const s of parts("ru")) assert.ok(!KZ.test(s), `${t.id} RU: ${s}`);
      for (const s of parts("en")) assert.ok(!CYR.test(s), `${t.id} EN: ${s}`);
      for (const s of parts("kk")) assert.ok(s && !s.includes("undefined") && !s.includes("NaN"), `${t.id} KK: ${s}`);
      for (const m of t.mistakes(p)) { assert.ok(!KZ.test(m.msg[1])); assert.ok(!CYR.test(m.msg[2])); }
      for (const c of t.checks) { assert.ok(!KZ.test(c.q[1] + c.why[1])); assert.ok(!CYR.test(c.q[2] + c.why[2])); }
      assert.ok(t.givens(p, "kk").some((x) => !x.relevant), `${t.id}: нет лишнего данного`);
      assert.ok(E.ERRORS[g.ai.type], `${t.id}: тип ошибки ИИ ${g.ai.type}`);
    }
  }
  for (const c of E.CLAIMS) {
    assert.ok(!KZ.test(c.c[1] + c.ref[1]) && !CYR.test(c.c[2] + c.ref[2]));
    assert.ok(E.ERRORS[c.type]);
    assert.equal(c.ok, c.type === "none");
  }
});

test("«решение ИИ» с ошибкой действительно отличается от эталона", () => {
  for (const t of E.templates) {
    for (const seed of SEEDS.slice(0, 300)) {
      const g = E.generate(t.id, seed);
      const sol = t.solution(g.params, "ru").join("|"), ai = g.ai.text("ru").join("|");
      if (g.ai.type === "none") continue;
      assert.notEqual(ai, sol, `${t.id}/${seed}: ошибочное решение совпадает с эталоном`);
    }
  }
});
