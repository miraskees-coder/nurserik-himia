/* ================= Расчётные модели виртуальной лаборатории =================
   Детерминированные: одни и те же параметры → один и тот же результат.
   Коэффициенты — учебные (подобраны под школьный опыт), что указано на страницах.
   Описание и допущения — docs/CHEMISTRY_MODELS.md, тесты — tests/lab-models.test.mjs. */
var NCLabModels = (function () {
  "use strict";
  var R = 8.314, VM20 = 24.05; // Дж/(моль·К); молярный объём газа при 20 °C и 1 атм, л/моль

  function kArr(k20, Ea, tC) { return k20 * Math.exp(-Ea / R * (1 / (tC + 273.15) - 1 / 293.15)); }

  /* ---------- 1. Na₂S₂O₃ + 2HCl → 2NaCl + S↓ + SO₂↑ + H₂O («исчезающий крест») ----------
     Учебная модель: кислота в избытке, скорость образования серы v = k(T)·[S₂O₃²⁻].
     Крест перестаёт быть виден, когда образовалось S* = 0,002 моль/л серы. */
  var THIO = { Sstar: 0.002, k20: 6.67e-4, Ea: 50000, Cmin: 0.01, Cmax: 0.15, Tmin: 10, Tmax: 60 };
  function thiosulfate(p) {
    var C = +p.C, T = +p.T;
    if (!(C >= THIO.Cmin && C <= THIO.Cmax && T >= THIO.Tmin && T <= THIO.Tmax)) return { ok: false, reason: "range" };
    var k = kArr(THIO.k20, THIO.Ea, T), x = THIO.Sstar / C;
    var t = -Math.log(1 - x) / k;
    return {
      ok: true, k: k, t: t, inv: 1000 / t, v: THIO.Sstar / t, end: t,
      progress: function (tt) { return Math.min(1, C * (1 - Math.exp(-k * tt)) / THIO.Sstar); },
      rate: function (tt) { return k * C * Math.exp(-k * tt); }
    };
  }

  /* ---------- 2. 2H₂O₂ → 2H₂O + O₂↑ (катализ) ----------
     1-й порядок по H₂O₂. 10 мл раствора, 20 °C, 1 атм. Константы — учебные.
     Eₐ — приблизительные литературные значения для энергетического профиля. */
  var H2O2 = {
    Vsol: 0.010, Cmin: 0.3, Cmax: 1.5,
    k: { none: 2e-7, mno2: 0.012, catalase: 0.04 },
    Ea: { none: 75, mno2: 58, catalase: 23 }, dH: -98
  };
  function peroxide(p) {
    var C0 = +p.C0, cat = p.cat;
    if (!(C0 >= H2O2.Cmin && C0 <= H2O2.Cmax) || !(cat in H2O2.k)) return { ok: false, reason: "range" };
    var k = H2O2.k[cat];
    var Vmax = C0 * H2O2.Vsol / 2 * VM20 * 1000; // мл O₂ при полном разложении
    var end = Math.min(600, 6 / k);
    var V = function (tt) { return Vmax * (1 - Math.exp(-k * tt)); };
    var t20 = k > 1e-5 ? -Math.log(1 - 20 / Vmax) / k : Infinity;
    return {
      ok: true, k: k, Vmax: Vmax, end: end, half: Math.LN2 / k, V: V, V60: V(60), t20: 20 < Vmax ? t20 : Infinity,
      progress: function (tt) { return 1 - Math.exp(-k * tt); },
      rate: function (tt) { return Vmax * k * Math.exp(-k * tt); }, // мл/с
      C: function (tt) { return C0 * Math.exp(-k * tt); }
    };
  }

  /* ---------- 3. CaCO₃ + 2HCl → CaCl₂ + H₂O + CO₂↑ (площадь поверхности) ----------
     Гетерогенная реакция: dn/dt = −kS·S·[HCl]; S = S₀·(m/m₀)^(2/3) (частицы равномерно уменьшаются).
     S₀ = 3m₀/(ρr) — поверхность шариков радиуса r. Масса сосуда убывает на массу улетевшего CO₂. */
  var MARBLE = {
    rho: 2.71, M: 100.09, MCO2: 44.01, ks: 2.3e-6, Vacid: 50, tmax: 1800,
    r: { chunk: 0.4, grain: 0.1, powder: 0.005 }, flask: 120
  };
  function marble(p) {
    var m0 = +p.m0, C = +p.C, size = p.size, closed = !!p.closed;
    if (!(m0 >= 0.5 && m0 <= 2 && C >= 0.5 && C <= 2) || !(size in MARBLE.r)) return { ok: false, reason: "range" };
    var V = MARBLE.Vacid / 1000, n0 = m0 / MARBLE.M, h0 = C * V;
    var S0 = 3 * m0 / (MARBLE.rho * MARBLE.r[size]);
    var n = n0, h = h0, t = 0, dt = 0.05, series = [[0, 0]], nextRec = 1;
    function rate(nn, hh) { return nn <= 0 || hh <= 0 ? 0 : MARBLE.ks * S0 * Math.pow(nn / n0, 2 / 3) * (hh / V); }
    while (t < MARBLE.tmax && n > n0 * 1e-6 && h > h0 * 1e-6) {
      // RK4 по количеству CaCO₃; HCl расходуется вдвое быстрее (стехиометрия 1 : 2).
      var k1 = rate(n, h), k2 = rate(n - k1 * dt / 2, h - k1 * dt), k3 = rate(n - k2 * dt / 2, h - k2 * dt), k4 = rate(n - k3 * dt, h - 2 * k3 * dt);
      var dn = Math.min(n, h / 2, (k1 + 2 * k2 + 2 * k3 + k4) / 6 * dt);
      n -= dn; h -= 2 * dn; t += dt;
      if (dt < 1 && t > 20) dt = Math.min(1, dt * 1.02);
      if (t >= nextRec) { series.push([t, (n0 - n) * MARBLE.MCO2]); nextRec = t < 60 ? t + 1 : t + 5; }
    }
    var reacted = n0 - n, mCO2 = reacted * MARBLE.MCO2, final = series[series.length - 1];
    if (final[0] < t) series.push([t, mCO2]);
    var t90 = null;
    for (var i = 0; i < series.length; i++) if (series[i][1] >= 0.9 * mCO2) { t90 = series[i][0]; break; }
    var limiting = n <= n0 * 1e-6 ? "CaCO3" : h <= h0 * 1e-6 ? "HCl" : "none";
    var massStart = MARBLE.flask + m0 + MARBLE.Vacid * 1.02 + 0; // г: колба + мрамор + кислота (ρ ≈ 1,02 г/мл)
    return {
      ok: true, end: t, complete: limiting !== "none", limiting: limiting, mCO2: mCO2, VCO2: reacted * VM20 * 1000, t90: t90, S0: S0,
      massStart: massStart, massEnd: closed ? massStart : massStart - mCO2,
      lost: function (tt) { return interp(series, tt); },
      progress: function (tt) { return mCO2 > 0 ? interp(series, tt) / mCO2 : 0; },
      rate: function (tt) { var a = interp(series, Math.max(0, tt - 1)), b = interp(series, tt + 1); return (b - a) / 2; },
      left: function (tt) { return Math.max(0, m0 - interp(series, tt) / MARBLE.MCO2 * MARBLE.M); }
    };
  }
  function interp(s, t) {
    if (t <= s[0][0]) return s[0][1];
    for (var i = 1; i < s.length; i++) if (t <= s[i][0]) { var a = s[i - 1], b = s[i]; return a[1] + (b[1] - a[1]) * (t - a[0]) / (b[0] - a[0]); }
    return s[s.length - 1][1];
  }

  /* ---------- 4. Данные «концентрация — время» для анализа (L5) ----------
     Расчёт по 1-му порядку, значения округлены до 3 знаков, как в лабораторном журнале. */
  function dataset(seed) {
    var a = seed >>> 0;
    function r() { a = (a * 1664525 + 1013904223) >>> 0; return a / 4294967296; }
    var C0 = +(0.5 + Math.floor(r() * 11) * 0.05).toFixed(2), k = +(0.010 + Math.floor(r() * 5) * 0.005).toFixed(3), step = 20;
    var rows = [];
    for (var i = 0; i <= 5; i++) rows.push([i * step, +(C0 * Math.exp(-k * i * step)).toFixed(3)]);
    return { C0: C0, k: k, rows: rows };
  }

  return { R: R, VM20: VM20, THIO: THIO, H2O2: H2O2, MARBLE: MARBLE, kArr: kArr, thiosulfate: thiosulfate, peroxide: peroxide, marble: marble, dataset: dataset };
})();
