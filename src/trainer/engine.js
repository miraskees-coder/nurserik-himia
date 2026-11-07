/* ================= NURSERIK CHEMISTRY — движок параметризованных задач =================
   Чистый модуль без DOM: генерация (воспроизводимая по seed), эталон, проверка ответа,
   распознавание типичных ошибок, «решение ИИ» для критического анализа.
   Работает в браузере (глобальная NCEngine) и в Node (tests/engine.test.mjs). */
var NCEngine = (function () {
  "use strict";
  var R = 8.314;
  var VERSION = "1.0.0";

  /* ---------- Утилиты ---------- */
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function pick(r, arr) { return arr[Math.floor(r() * arr.length)]; }
  function range(r, lo, hi, step) { var n = Math.round((hi - lo) / step); return +(lo + Math.floor(r() * (n + 1)) * step).toFixed(6); }
  function S(lang, kk, ru, en) { return lang === "ru" ? ru : lang === "en" ? en : kk; }
  function N(x, d, lang) {
    if (typeof x !== "number" || !isFinite(x)) return "—";
    var s = Math.abs(x).toFixed(d == null ? 3 : d);
    if (s.indexOf(".") >= 0) s = s.replace(/0+$/, "").replace(/\.$/, "");
    var p = s.split("."), en = lang === "en";
    if (p[0].length > (en ? 3 : 4)) p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, en ? "," : " ");
    return (x < 0 && s !== "0" ? "−" : "") + p[0] + (p[1] ? (en ? "." : ",") + p[1] : "");
  }
  // Значащие цифры для ответов.
  function G(x, lang, sig) {
    if (!isFinite(x)) return "—";
    var a = Math.abs(x), d = a === 0 ? 0 : Math.max(0, (sig || 3) - 1 - Math.floor(Math.log10(a)));
    return N(+x.toPrecision(sig || 3), Math.min(d, 6), lang);
  }
  function parseNum(v) {
    var s = String(v == null ? "" : v).trim().replace(/[\s ]/g, "").replace(/−/g, "-").replace(",", ".");
    s = s.replace(/[·x×*]10\^?([-−]?\d+)$/i, "e$1");
    if (!/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(s)) return NaN;
    return parseFloat(s);
  }

  /* ---------- Справочники ---------- */
  var UNITS = {
    rate_s:   { t: ["моль/(л·с)", "моль/(л·с)", "mol/(L·s)"], dim: "rate", f: 1 },
    rate_min: { t: ["моль/(л·мин)", "моль/(л·мин)", "mol/(L·min)"], dim: "rate", f: 60 },
    conc:     { t: ["моль/л", "моль/л", "mol/L"], dim: "conc", f: 1 },
    none:     { t: ["бірліксіз (есе)", "безразмерная (раз)", "dimensionless (×)"], dim: "none", f: 1 },
    kJ:       { t: ["кДж/моль", "кДж/моль", "kJ/mol"], dim: "energy", f: 1 },
    J:        { t: ["Дж/моль", "Дж/моль", "J/mol"], dim: "energy", f: 1000 },
    min:      { t: ["мин", "мин", "min"], dim: "time", f: 1 },
    s:        { t: ["с", "с", "s"], dim: "time", f: 60 },
    pct:      { t: ["%", "%", "%"], dim: "pct", f: 1 }
  };
  var METHODS = {
    avg_rate:    ["Орташа жылдамдық анықтамасы: v = ΔC/Δt", "Определение средней скорости: v = ΔC/Δt", "Definition of average rate: v = ΔC/Δt"],
    vant_hoff:   ["Вант-Гофф ережесі: v₂/v₁ = γ^(Δt/10)", "Правило Вант-Гоффа: v₂/v₁ = γ^(Δt/10)", "Van 't Hoff's rule: v₂/v₁ = γ^(Δt/10)"],
    arrhenius:   ["Аррениус теңдеуі: ln(k₂/k₁) = (Eₐ/R)(1/T₁ − 1/T₂)", "Уравнение Аррениуса: ln(k₂/k₁) = (Eₐ/R)(1/T₁ − 1/T₂)", "Arrhenius equation: ln(k₂/k₁) = (Eₐ/R)(1/T₁ − 1/T₂)"],
    mass_action: ["Әрекеттесуші массалар заңы: v = k[A]ᵃ[B]ᵇ", "Закон действующих масс: v = k[A]ᵃ[B]ᵇ", "Law of mass action: v = k[A]ᵃ[B]ᵇ"],
    half_life:   ["1-ретті реакция: t½ = ln2/k, C = C₀·e^(−kt)", "Реакция 1 порядка: t½ = ln2/k, C = C₀·e^(−kt)", "First-order reaction: t½ = ln2/k, C = C₀·e^(−kt)"]
  };
  var UNKNOWNS = {
    rate:     ["Орташа реакция жылдамдығы", "Средняя скорость реакции", "Average reaction rate"],
    ratio:    ["Жылдамдықтың (константаның) неше есе өзгергені", "Во сколько раз изменилась скорость (константа)", "How many times the rate (constant) changes"],
    gamma:    ["Температуралық коэффициент γ", "Температурный коэффициент γ", "Temperature coefficient γ"],
    time:     ["Реакцияның жүру уақыты", "Время протекания реакции", "Reaction time"],
    energy:   ["Активтендіру энергиясы", "Энергия активации", "Activation energy"],
    halflife: ["Жартылай ыдырау периоды", "Период полупревращения", "Half-life"],
    remain:   ["Қалған заттың үлесі", "Доля оставшегося вещества", "Fraction of substance remaining"]
  };
  var ERRORS = {
    none:    ["Қате жоқ", "Ошибки нет", "No error"],
    formula: ["Формула (әдіс) қате таңдалған", "Неправильно выбрана формула (метод)", "Wrong formula (method)"],
    units:   ["Бірліктердегі қате", "Ошибка в единицах измерения", "Error in units"],
    calc:    ["Есептеу қатесі", "Ошибка вычислений", "Calculation error"],
    data:    ["Деректер қате пайдаланылған", "Данные использованы неверно", "Data used incorrectly"],
    chem:    ["Қате химиялық болжам", "Ошибочное химическое предположение", "Wrong chemical assumption"],
    general: ["Негізсіз жалпылау", "Неправомерное обобщение", "Unjustified generalisation"]
  };

  /* ---------- Шаблоны задач ---------- */
  var T = [];

  // A1. Средняя скорость реакции.
  T.push({
    id: "avg_rate", level: "A", method: "avg_rate", unknown: "rate", units: ["rate_s", "rate_min", "conc", "s"], tol: 0.01,
    gen: function (r) {
      var p = { product: r() < 0.35, minutes: r() < 0.4, T: pick(r, [20, 25, 30]) };
      if (p.product) { p.C1 = 0; p.C2 = range(r, 0.2, 1.2, 0.05); }
      else { p.C1 = range(r, 0.6, 2.0, 0.05); p.C2 = +(p.C1 - range(r, 0.1, p.C1 - 0.1, 0.05)).toFixed(2); }
      p.tmin = pick(r, [1, 2, 3, 4, 5]);
      p.t = p.minutes ? p.tmin * 60 : pick(r, [20, 25, 30, 40, 50, 60, 80, 100, 120]);
      return p;
    },
    valid: function (p) { var d = Math.abs(p.C2 - p.C1); return d >= 0.05 && p.C2 >= 0 && d / p.t > 1e-4 && d / p.t < 0.1; },
    answer: function (p) { return { value: Math.abs(p.C2 - p.C1) / p.t, unit: "rate_s" }; },
    convert: function (p) { return p.minutes; },
    statement: function (p, l) {
      var tt = p.minutes ? N(p.tmin, 0, l) + S(l, " мин", " мин", " min") : N(p.t, 0, l) + S(l, " с", " с", " s");
      return p.product
        ? S(l, "A + B → C реакциясы " + p.T + " °C-та жүреді. " + tt + " ішінде C өнімінің концентрациясы 0-ден " + N(p.C2, 2, l) + " моль/л-ге дейін артты. Реакцияның орташа жылдамдығын моль/(л·с) бірлігінде табыңыз.",
              "Реакция A + B → C протекает при " + p.T + " °C. За " + tt + " концентрация продукта C возросла от 0 до " + N(p.C2, 2, l) + " моль/л. Найдите среднюю скорость реакции в моль/(л·с).",
              "The reaction A + B → C takes place at " + p.T + " °C. In " + tt + " the concentration of product C rose from 0 to " + N(p.C2, 2, l) + " mol/L. Find the average rate of the reaction in mol/(L·s).")
        : S(l, "A + B → C реакциясы " + p.T + " °C-та жүреді. " + tt + " ішінде A затының концентрациясы " + N(p.C1, 2, l) + "-ден " + N(p.C2, 2, l) + " моль/л-ге дейін азайды. Реакцияның орташа жылдамдығын моль/(л·с) бірлігінде табыңыз.",
              "Реакция A + B → C протекает при " + p.T + " °C. За " + tt + " концентрация вещества A уменьшилась с " + N(p.C1, 2, l) + " до " + N(p.C2, 2, l) + " моль/л. Найдите среднюю скорость реакции в моль/(л·с).",
              "The reaction A + B → C takes place at " + p.T + " °C. In " + tt + " the concentration of A fell from " + N(p.C1, 2, l) + " to " + N(p.C2, 2, l) + " mol/L. Find the average rate of the reaction in mol/(L·s).");
    },
    givens: function (p, l) {
      return [
        { id: "C1", text: "C₁ = " + N(p.C1, 2, l) + S(l, " моль/л", " моль/л", " mol/L"), relevant: true },
        { id: "C2", text: "C₂ = " + N(p.C2, 2, l) + S(l, " моль/л", " моль/л", " mol/L"), relevant: true },
        { id: "t", text: "Δt = " + (p.minutes ? N(p.tmin, 0, l) + S(l, " мин", " мин", " min") : N(p.t, 0, l) + S(l, " с", " с", " s")), relevant: true },
        { id: "T", text: "t = " + p.T + " °C", relevant: false }
      ];
    },
    hints: [
      function (p, l) { return S(l, "Орташа жылдамдық — концентрация өзгерісінің уақытқа қатынасы. Алдымен ΔC-ны табыңыз.", "Средняя скорость — отношение изменения концентрации ко времени. Сначала найдите ΔC.", "Average rate is the change in concentration divided by time. Find ΔC first."); },
      function (p, l) {
        var dc = N(Math.abs(p.C2 - p.C1), 2, l);
        return p.minutes
          ? S(l, "ΔC = " + dc + " моль/л. Уақыт минутпен берілген, ал жауап секундпен сұралады: 1 мин = 60 с.", "ΔC = " + dc + " моль/л. Время дано в минутах, а ответ нужен в секундах: 1 мин = 60 с.", "ΔC = " + dc + " mol/L. Time is given in minutes but the answer is wanted per second: 1 min = 60 s.")
          : S(l, "ΔC = " + dc + " моль/л, Δt = " + p.t + " с. Енді ΔC-ны Δt-ға бөліңіз.", "ΔC = " + dc + " моль/л, Δt = " + p.t + " с. Теперь разделите ΔC на Δt.", "ΔC = " + dc + " mol/L, Δt = " + p.t + " s. Now divide ΔC by Δt.");
      }
    ],
    solution: function (p, l) {
      var dc = Math.abs(p.C2 - p.C1), v = dc / p.t;
      var s = ["ΔC = |" + N(p.C2, 2, l) + " − " + N(p.C1, 2, l) + "| = " + N(dc, 2, l) + S(l, " моль/л", " моль/л", " mol/L")];
      if (p.minutes) s.push("Δt = " + p.tmin + S(l, " мин = ", " мин = ", " min = ") + p.t + S(l, " с", " с", " s"));
      s.push("v = ΔC/Δt = " + N(dc, 2, l) + " / " + p.t + " = " + G(v, l) + S(l, " моль/(л·с)", " моль/(л·с)", " mol/(L·s)"));
      return s;
    },
    mistakes: function (p) {
      var dc = Math.abs(p.C2 - p.C1), m = [{ id: "formula", value: dc, msg: ["ΔC уақытқа бөлінбеген сияқты.", "Похоже, ΔC не разделили на время.", "It looks like ΔC was not divided by the time."] }];
      if (p.minutes) m.push({ id: "units", value: dc / p.tmin, msg: ["Уақыт секундқа айналдырылмаған сияқты (1 мин = 60 с).", "Похоже, время не переведено в секунды (1 мин = 60 с).", "It looks like the time was not converted to seconds (1 min = 60 s)."] });
      if (p.C1 > 0) m.push({ id: "data", value: p.C1 / p.t, msg: ["Концентрация өзгерісінің орнына бастапқы концентрация алынған сияқты.", "Похоже, вместо изменения концентрации взята начальная концентрация.", "It looks like the initial concentration was used instead of the change."] });
      if (p.C2 > 0 && p.C1 > 0) m.push({ id: "data", value: p.C2 / p.t, msg: ["Концентрация өзгерісінің орнына соңғы концентрация алынған сияқты.", "Похоже, вместо изменения концентрации взята конечная концентрация.", "It looks like the final concentration was used instead of the change."] });
      return m;
    },
    checks: [
      { q: ["Орташа жылдамдық оң сан болуы керек пе?", "Должна ли средняя скорость быть положительной?", "Must the average rate be positive?"], a: true,
        why: ["Иә: жылдамдық анықтама бойынша оң, белгі тек бастапқы зат пен өнімді ажыратады.", "Да: скорость по определению положительна, знак лишь различает реагент и продукт.", "Yes: rate is positive by definition; the sign only distinguishes reactant from product."] },
      { q: ["Δt екі есе ұзақ болса (ΔC сол қалпында), орташа жылдамдық екі есе кіші болар ма еді?", "Если бы Δt было вдвое больше (при том же ΔC), стала бы средняя скорость вдвое меньше?", "If Δt were twice as long (same ΔC), would the average rate be half as big?"], a: true,
        why: ["Иә: v = ΔC/Δt, жылдамдық уақытқа кері пропорционал.", "Да: v = ΔC/Δt, скорость обратно пропорциональна времени.", "Yes: v = ΔC/Δt, so the rate is inversely proportional to time."] }
    ],
    ai: function (p, r) {
      var dc = Math.abs(p.C2 - p.C1), v = dc / p.t;
      // Для продукта (C₁ = 0) C₂/Δt совпадает с верным ответом, поэтому там ошибка «data» невозможна.
      var wrong = ["calc"];
      if (p.minutes) wrong.push("units"); else if (p.C1 > 0) wrong.push("data");
      var type = r() < 0.4 ? "none" : pick(r, wrong);
      var unitS = [" моль/(л·с)", " моль/(л·с)", " mol/(L·s)"];
      return {
        type: type,
        text: function (l) {
          var u = S(l, unitS[0], unitS[1], unitS[2]);
          if (type === "units") return ["ΔC = " + N(dc, 2, l), "v = ΔC/Δt = " + N(dc, 2, l) + " / " + p.tmin + " = " + G(dc / p.tmin, l) + u];
          if (type === "data") return ["v = C₂/Δt = " + N(p.C2 || p.C1, 2, l) + " / " + p.t + " = " + G((p.C2 || p.C1) / p.t, l) + u];
          if (type === "calc") return ["ΔC = " + N(dc, 2, l), "v = " + N(dc, 2, l) + " / " + p.t + " = " + G(v * 10, l) + u];
          return ["ΔC = " + N(dc, 2, l), "Δt = " + p.t + S(l, " с", " с", " s"), "v = " + N(dc, 2, l) + " / " + p.t + " = " + G(v, l) + u];
        }
      };
    }
  });

  // A2. Правило Вант-Гоффа: во сколько раз растёт скорость.
  T.push({
    id: "vh_ratio", level: "A", method: "vant_hoff", unknown: "ratio", units: ["none"], tol: 0.01,
    gen: function (r) { var p = { g: pick(r, [2, 2.5, 3, 3.5, 4]), t1: pick(r, [10, 15, 20, 25, 30]), d: pick(r, [10, 20, 30, 40]), C: pick(r, [0.1, 0.2, 0.5]) }; p.t2 = p.t1 + p.d; return p; },
    valid: function (p) { return Math.pow(p.g, p.d / 10) <= 300; },
    answer: function (p) { return { value: Math.pow(p.g, p.d / 10), unit: "none" }; },
    convert: function () { return false; },
    statement: function (p, l) {
      return S(l, "Реакцияның температуралық коэффициенті γ = " + N(p.g, 1, l) + ". Бастапқы заттың концентрациясы " + N(p.C, 1, l) + " моль/л. Температураны " + p.t1 + "-ден " + p.t2 + " °C-қа дейін көтергенде реакция жылдамдығы неше есе артады?",
        "Температурный коэффициент реакции γ = " + N(p.g, 1, l) + ". Концентрация исходного вещества " + N(p.C, 1, l) + " моль/л. Во сколько раз возрастёт скорость реакции при нагревании от " + p.t1 + " до " + p.t2 + " °C?",
        "The temperature coefficient of a reaction is γ = " + N(p.g, 1, l) + ". The reactant concentration is " + N(p.C, 1, l) + " mol/L. How many times faster does the reaction go when heated from " + p.t1 + " to " + p.t2 + " °C?");
    },
    givens: function (p, l) {
      return [
        { id: "g", text: "γ = " + N(p.g, 1, l), relevant: true },
        { id: "t1", text: "t₁ = " + p.t1 + " °C", relevant: true },
        { id: "t2", text: "t₂ = " + p.t2 + " °C", relevant: true },
        { id: "C", text: "C = " + N(p.C, 1, l) + S(l, " моль/л", " моль/л", " mol/L"), relevant: false }
      ];
    },
    hints: [
      function (p, l) { return S(l, "Вант-Гофф ережесін қолданыңыз. Температура неше градусқа өзгерді?", "Примените правило Вант-Гоффа. На сколько градусов изменилась температура?", "Use Van 't Hoff's rule. By how many degrees did the temperature change?"); },
      function (p, l) { return S(l, "Δt/10 = " + p.d / 10 + ". γ-ны осы дәрежеге шығарыңыз.", "Δt/10 = " + p.d / 10 + ". Возведите γ в эту степень.", "Δt/10 = " + p.d / 10 + ". Raise γ to this power."); }
    ],
    solution: function (p, l) {
      return ["Δt = " + p.t2 + " − " + p.t1 + " = " + p.d + " °C", "v₂/v₁ = γ^(Δt/10) = " + N(p.g, 1, l) + "^" + p.d / 10 + " = " + G(Math.pow(p.g, p.d / 10), l, 4)];
    },
    mistakes: function (p) {
      return [
        { id: "formula", value: p.g * p.d / 10, msg: ["γ дәрежеге шығарылмай, көбейтілген сияқты.", "Похоже, γ умножили, а не возвели в степень.", "It looks like γ was multiplied instead of raised to a power."] },
        { id: "general", value: Math.pow(2, p.d / 10), msg: ["Берілген γ-ның орнына «әрқашан 2» алынған сияқты.", "Похоже, вместо данного γ взято «всегда 2».", "It looks like “always 2” was used instead of the given γ."] }
      ].filter(function (m) { return Math.abs(m.value - Math.pow(p.g, p.d / 10)) > 1e-9; });
    },
    checks: [
      { q: ["Температура көтерілді — қатынас 1-ден үлкен болуы керек пе?", "Температура выросла — должно ли отношение быть больше 1?", "The temperature went up: should the ratio be greater than 1?"], a: true,
        why: ["Иә: қыздырғанда реакциялар әдетте тездейді.", "Да: при нагревании реакции, как правило, ускоряются.", "Yes: reactions usually speed up when heated."] },
      { q: ["Бастапқы концентрация жауапқа әсер ете ме?", "Влияет ли начальная концентрация на ответ?", "Does the initial concentration affect the answer?"], a: false,
        why: ["Жоқ: Вант-Гофф ережесі тек температураға қатысты, концентрация — артық дерек.", "Нет: правило Вант-Гоффа касается только температуры, концентрация — лишнее данное.", "No: Van 't Hoff's rule concerns only temperature; the concentration is surplus data."] }
    ],
    ai: function (p, r) {
      var type = r() < 0.4 ? "none" : pick(r, ["formula", "general"]), x = Math.pow(p.g, p.d / 10);
      return {
        type: type,
        text: function (l) {
          if (type === "formula") return ["v₂/v₁ = γ · Δt/10 = " + N(p.g, 1, l) + " · " + p.d / 10 + " = " + G(p.g * p.d / 10, l, 4)];
          if (type === "general") return [S(l, "Әр 10 °C-та жылдамдық әрқашан 2 есе артады,", "На каждые 10 °C скорость всегда растёт ровно в 2 раза,", "The rate always doubles exactly every 10 °C,"), "v₂/v₁ = 2^" + p.d / 10 + " = " + G(Math.pow(2, p.d / 10), l, 4)];
          return ["Δt = " + p.d + " °C", "v₂/v₁ = " + N(p.g, 1, l) + "^" + p.d / 10 + " = " + G(x, l, 4)];
        }
      };
    }
  });

  // B1. Найти γ по известному изменению скорости.
  T.push({
    id: "vh_gamma", level: "B", method: "vant_hoff", unknown: "gamma", units: ["none"], tol: 0.01,
    gen: function (r) { var p = { g: pick(r, [2, 3, 4]), d: pick(r, [20, 30]), tau: pick(r, [10, 20, 40]) }; p.ratio = Math.pow(p.g, p.d / 10); return p; },
    valid: function () { return true; },
    answer: function (p) { return { value: p.g, unit: "none" }; },
    convert: function () { return false; },
    statement: function (p, l) {
      return S(l, "Температураны " + p.d + " °C-қа көтергенде реакция жылдамдығы " + p.ratio + " есе артты. Бастапқы температурада реакция " + p.tau + " минутта аяқталған. Температуралық коэффициентті табыңыз.",
        "При повышении температуры на " + p.d + " °C скорость реакции возросла в " + p.ratio + " " + (p.ratio % 10 >= 2 && p.ratio % 10 <= 4 && (p.ratio % 100 < 12 || p.ratio % 100 > 14) ? "раза" : "раз") + ". При начальной температуре реакция заканчивалась за " + p.tau + " мин. Найдите температурный коэффициент.",
        "Raising the temperature by " + p.d + " °C made the reaction " + p.ratio + " times faster. At the starting temperature the reaction took " + p.tau + " min. Find the temperature coefficient.");
    },
    givens: function (p, l) {
      return [
        { id: "d", text: "Δt = " + p.d + " °C", relevant: true },
        { id: "ratio", text: "v₂/v₁ = " + p.ratio, relevant: true },
        { id: "tau", text: "τ₁ = " + p.tau + S(l, " мин", " мин", " min"), relevant: false }
      ];
    },
    hints: [
      function (p, l) { return S(l, "Вант-Гофф ережесін γ-ға қатысты шешіңіз: γ^(Δt/10) = v₂/v₁.", "Решите правило Вант-Гоффа относительно γ: γ^(Δt/10) = v₂/v₁.", "Solve Van 't Hoff's rule for γ: γ^(Δt/10) = v₂/v₁."); },
      function (p, l) { return S(l, "γ^" + p.d / 10 + " = " + p.ratio + ". Қандай сан " + p.d / 10 + "-дәрежеде " + p.ratio + " береді?", "γ^" + p.d / 10 + " = " + p.ratio + ". Какое число в степени " + p.d / 10 + " даёт " + p.ratio + "?", "γ^" + p.d / 10 + " = " + p.ratio + ". Which number to the power " + p.d / 10 + " gives " + p.ratio + "?"); }
    ],
    solution: function (p, l) { return ["γ^(" + p.d + "/10) = " + p.ratio, "γ^" + p.d / 10 + " = " + p.ratio + " → γ = " + p.ratio + "^(1/" + p.d / 10 + ") = " + p.g]; },
    mistakes: function (p) { return [{ id: "formula", value: p.ratio / (p.d / 10), msg: ["Дәреженің орнына бөлу қолданылған сияқты.", "Похоже, вместо извлечения корня выполнено деление.", "It looks like you divided instead of taking a root."] }]; },
    checks: [
      { q: ["Алынған γ көптеген реакциялар үшін әдеттегі 2–4 аралығында ма?", "Попадает ли полученный γ в типичный для многих реакций диапазон 2–4?", "Is the γ you got within the usual 2–4 range for many reactions?"], a: true,
        why: ["Иә, бұл шынайылықты тексерудің бір тәсілі.", "Да, это один из способов проверить реалистичность.", "Yes, that is one way to check plausibility."] },
      { q: ["Реакция уақыты τ₁ γ-ны табу үшін керек пе?", "Нужно ли время τ₁, чтобы найти γ?", "Is the time τ₁ needed to find γ?"], a: false,
        why: ["Жоқ: бұл — артық дерек.", "Нет: это лишнее данное.", "No: it is surplus data."] }
    ],
    ai: function (p, r) {
      var type = r() < 0.4 ? "none" : "formula";
      return { type: type, text: function () {
        return type === "formula" ? ["γ = (v₂/v₁)/(Δt/10) = " + p.ratio + " / " + p.d / 10 + " = " + +(p.ratio / (p.d / 10)).toFixed(2)] : ["γ^" + p.d / 10 + " = " + p.ratio, "γ = " + p.g];
      } };
    }
  });

  // B2. Время реакции при другой температуре.
  T.push({
    id: "vh_time", level: "B", method: "vant_hoff", unknown: "time", units: ["min", "s", "none"], tol: 0.01,
    gen: function (r) { var p = { tau: pick(r, [8, 12, 16, 24, 32, 48, 54]), g: pick(r, [2, 3]), d: pick(r, [10, 20, 30]), t1: pick(r, [20, 30, 40, 50]), C: pick(r, [0.2, 0.5, 1]) }; p.t2 = p.t1 + p.d; return p; },
    valid: function (p) { return p.tau / Math.pow(p.g, p.d / 10) >= 0.25; },
    answer: function (p) { return { value: p.tau / Math.pow(p.g, p.d / 10), unit: "min" }; },
    convert: function () { return false; },
    statement: function (p, l) {
      return S(l, p.t1 + " °C-та реакция " + p.tau + " минутта аяқталады, бастапқы зат концентрациясы " + N(p.C, 1, l) + " моль/л. γ = " + p.g + ". " + p.t2 + " °C-та реакция қанша минутта аяқталады?",
        "При " + p.t1 + " °C реакция заканчивается за " + p.tau + " мин, концентрация исходного вещества " + N(p.C, 1, l) + " моль/л. γ = " + p.g + ". За сколько минут закончится реакция при " + p.t2 + " °C?",
        "At " + p.t1 + " °C the reaction is complete in " + p.tau + " min; the reactant concentration is " + N(p.C, 1, l) + " mol/L. γ = " + p.g + ". How many minutes will it take at " + p.t2 + " °C?");
    },
    givens: function (p, l) {
      return [
        { id: "tau", text: "τ₁ = " + p.tau + S(l, " мин", " мин", " min"), relevant: true },
        { id: "t", text: "t₁ = " + p.t1 + " °C, t₂ = " + p.t2 + " °C", relevant: true },
        { id: "g", text: "γ = " + p.g, relevant: true },
        { id: "C", text: "C = " + N(p.C, 1, l) + S(l, " моль/л", " моль/л", " mol/L"), relevant: false }
      ];
    },
    hints: [
      function (p, l) { return S(l, "Алдымен жылдамдық неше есе өзгергенін табыңыз. Уақыт жылдамдыққа қалай байланысты?", "Сначала найдите, во сколько раз изменилась скорость. Как время связано со скоростью?", "First find how many times the rate changed. How is time related to rate?"); },
      function (p, l) { return S(l, "v₂/v₁ = " + p.g + "^" + p.d / 10 + " = " + Math.pow(p.g, p.d / 10) + ". Уақыт жылдамдыққа кері пропорционал: τ₂ = τ₁ / (v₂/v₁).", "v₂/v₁ = " + p.g + "^" + p.d / 10 + " = " + Math.pow(p.g, p.d / 10) + ". Время обратно пропорционально скорости: τ₂ = τ₁ / (v₂/v₁).", "v₂/v₁ = " + p.g + "^" + p.d / 10 + " = " + Math.pow(p.g, p.d / 10) + ". Time is inversely proportional to rate: τ₂ = τ₁ / (v₂/v₁)."); }
    ],
    solution: function (p, l) {
      var k = Math.pow(p.g, p.d / 10);
      return ["v₂/v₁ = " + p.g + "^((" + p.t2 + " − " + p.t1 + ")/10) = " + k, "τ₂ = τ₁ / (v₂/v₁) = " + p.tau + " / " + k + " = " + G(p.tau / k, l) + S(l, " мин", " мин", " min")];
    },
    mistakes: function (p) {
      var k = Math.pow(p.g, p.d / 10);
      return [
        { id: "formula", value: p.tau * k, msg: ["Уақыт азаюдың орнына көбейтілген: τ жылдамдыққа кері пропорционал.", "Время умножено, а должно уменьшиться: τ обратно пропорционально скорости.", "The time was multiplied but should decrease: τ is inversely proportional to rate."] },
        { id: "formula", value: p.tau / (p.g * p.d / 10), msg: ["γ дәрежеге шығарылмаған сияқты.", "Похоже, γ не возведён в степень.", "It looks like γ was not raised to a power."] }
      ].filter(function (m) { return Math.abs(m.value - p.tau / k) > 1e-9; });
    },
    checks: [
      { q: ["Қыздырғанда реакция уақыты қысқаруы керек пе?", "Должно ли время реакции уменьшиться при нагревании?", "Should the reaction time get shorter on heating?"], a: true,
        why: ["Иә: жылдамдық артады, сондықтан уақыт азаяды.", "Да: скорость растёт, значит время уменьшается.", "Yes: the rate rises, so the time falls."] },
      { q: ["τ₂ · (v₂/v₁) бастапқы τ₁-ге тең болуы керек пе (кері тексеріс)?", "Должно ли τ₂ · (v₂/v₁) равняться исходному τ₁ (обратная проверка)?", "Should τ₂ · (v₂/v₁) equal the original τ₁ (reverse check)?"], a: true,
        why: ["Иә, бұл кері есептеу арқылы тексеру.", "Да, это проверка обратным расчётом.", "Yes, that is a check by reverse calculation."] }
    ],
    ai: function (p, r) {
      var type = r() < 0.4 ? "none" : pick(r, ["formula", "units"]), k = Math.pow(p.g, p.d / 10);
      return { type: type, text: function (l) {
        var mn = S(l, " мин", " мин", " min");
        if (type === "formula") return ["v₂/v₁ = " + k, "τ₂ = τ₁ · (v₂/v₁) = " + p.tau + " · " + k + " = " + G(p.tau * k, l) + mn];
        if (type === "units") return ["v₂/v₁ = " + k, "τ₂ = " + p.tau + " · 60 / " + k + " = " + G(p.tau * 60 / k, l) + mn];
        return ["v₂/v₁ = " + k, "τ₂ = " + p.tau + " / " + k + " = " + G(p.tau / k, l) + mn];
      } };
    }
  });

  // B3. Закон действующих масс: изменение давления, объёма или концентрации.
  var RX = [
    { eq: ["2NO + O₂ → 2NO₂", "2NO + O₂ → 2NO₂", "2NO + O₂ → 2NO₂"], sp: [["NO", 2], ["O₂", 1]] },
    { eq: ["H₂ + I₂ → 2HI", "H₂ + I₂ → 2HI", "H₂ + I₂ → 2HI"], sp: [["H₂", 1], ["I₂", 1]] },
    { eq: ["2SO₂ + O₂ → 2SO₃", "2SO₂ + O₂ → 2SO₃", "2SO₂ + O₂ → 2SO₃"], sp: [["SO₂", 2], ["O₂", 1]] },
    { eq: ["C(қ) + O₂(г) → CO₂(г)", "C(тв) + O₂(г) → CO₂(г)", "C(s) + O₂(g) → CO₂(g)"], sp: [["O₂", 1]], solid: true }
  ];
  T.push({
    id: "mass_action", level: "B", method: "mass_action", unknown: "ratio", units: ["none"], tol: 0.01,
    gen: function (r) {
      var p = { rx: Math.floor(r() * RX.length), kind: pick(r, ["p", "V", "c"]), n: pick(r, [2, 3, 4]), T: pick(r, [300, 400, 500]) };
      p.sp = Math.floor(r() * RX[p.rx].sp.length);
      return p;
    },
    valid: function () { return true; },
    answer: function (p) {
      var rx = RX[p.rx];
      if (p.kind === "c") return { value: Math.pow(p.n, rx.sp[p.sp][1]), unit: "none" };
      var e = 0; rx.sp.forEach(function (s) { e += s[1]; });
      return { value: Math.pow(p.n, e), unit: "none" };
    },
    convert: function () { return false; },
    statement: function (p, l) {
      var rx = RX[p.rx], eq = S(l, rx.eq[0], rx.eq[1], rx.eq[2]);
      var ch = p.kind === "p" ? S(l, "қысымды " + p.n + " есе арттырса", "давление увеличить в " + p.n + " раза", "the pressure is increased " + p.n + " times")
        : p.kind === "V" ? S(l, "ыдыстың көлемін " + p.n + " есе азайтса", "объём сосуда уменьшить в " + p.n + " раза", "the vessel volume is reduced " + p.n + " times")
        : S(l, rx.sp[p.sp][0] + " концентрациясын " + p.n + " есе арттырса (басқалары өзгермейді)", "концентрацию " + rx.sp[p.sp][0] + " увеличить в " + p.n + " раза (остальные не меняются)", "the concentration of " + rx.sp[p.sp][0] + " is increased " + p.n + " times (others unchanged)");
      return S(l, "Элементар реакция " + eq + " " + p.T + " К-де жүреді. Егер " + ch + ", реакция жылдамдығы неше есе өзгереді?",
        "Элементарная реакция " + eq + " протекает при " + p.T + " К. Во сколько раз изменится скорость реакции, если " + ch + "?",
        "The elementary reaction " + eq + " runs at " + p.T + " K. By what factor does the rate change if " + ch + "?");
    },
    givens: function (p, l) {
      var rx = RX[p.rx];
      return [
        { id: "eq", text: S(l, "Теңдеу: ", "Уравнение: ", "Equation: ") + S(l, rx.eq[0], rx.eq[1], rx.eq[2]), relevant: true },
        { id: "n", text: S(l, "Өзгеріс: ", "Изменение: ", "Change: ") + (p.kind === "p" ? "p × " + p.n : p.kind === "V" ? "V : " + p.n : "[" + rx.sp[p.sp][0] + "] × " + p.n), relevant: true },
        { id: "T", text: "T = " + p.T + " K", relevant: false }
      ];
    },
    hints: [
      function (p, l) { return S(l, "Массалар заңы бойынша кинетикалық теңдеуді жазыңыз. Қатты заттар оған енбейді.", "Запишите кинетическое уравнение по закону действующих масс. Твёрдые вещества в него не входят.", "Write the rate law using the law of mass action. Solids are left out."); },
      function (p, l) {
        return p.kind === "c"
          ? S(l, "Тек бір заттың концентрациясы өзгереді — оның дәреже көрсеткішін қараңыз.", "Меняется концентрация только одного вещества — посмотрите на его показатель степени.", "Only one concentration changes — look at its exponent.")
          : S(l, "Қысым " + p.n + " есе артса (немесе көлем " + p.n + " есе азайса), әр газдың концентрациясы " + p.n + " есе артады.", "При увеличении давления в " + p.n + " раза (или уменьшении объёма) концентрация каждого газа растёт в " + p.n + " раза.", "If pressure rises " + p.n + "× (or volume falls " + p.n + "×), each gas concentration rises " + p.n + "×.");
      }
    ],
    solution: function (p, l) {
      var rx = RX[p.rx];
      var law = "v = k·" + rx.sp.map(function (s) { return "[" + s[0] + "]" + (s[1] > 1 ? "²" : ""); }).join("·");
      var a = this.answer(p).value;
      var calc = p.kind === "c" ? p.n + (rx.sp[p.sp][1] > 1 ? "²" : "") : rx.sp.map(function (s) { return p.n + (s[1] > 1 ? "²" : ""); }).join(" · ");
      return [law + (rx.solid ? S(l, " (C — қатты зат)", " (C — твёрдое вещество)", " (C is a solid)") : ""), "v₂/v₁ = " + calc + " = " + a];
    },
    mistakes: function (p) {
      var rx = RX[p.rx], right = this.answer(p).value, m = [];
      m.push({ id: "formula", value: p.kind === "c" ? p.n : Math.pow(p.n, rx.sp.length), msg: ["Дәреже көрсеткіштері (коэффициенттер) ескерілмеген сияқты.", "Похоже, не учтены показатели степени (коэффициенты).", "It looks like the exponents (coefficients) were ignored."] });
      if (rx.solid) m.push({ id: "data", value: Math.pow(p.n, 2), msg: ["Қатты зат (көмір) теңдеуге енгізілген сияқты.", "Похоже, твёрдое вещество (уголь) включено в уравнение.", "It looks like the solid (carbon) was included in the rate law."] });
      return m.filter(function (x) { return Math.abs(x.value - right) > 1e-9; });
    },
    checks: [
      { q: ["Қатты заттың концентрациясы кинетикалық теңдеуге кіре ме?", "Входит ли концентрация твёрдого вещества в кинетическое уравнение?", "Does the concentration of a solid appear in the rate law?"], a: false,
        why: ["Жоқ: қатты заттар мен таза сұйықтар теңдеуге жазылмайды.", "Нет: твёрдые вещества и чистые жидкости в уравнение не записывают.", "No: solids and pure liquids are left out of the rate law."] },
      { q: ["Температура жауапты есептеу үшін керек пе (ол өзгермейді)?", "Нужна ли температура для расчёта (она не меняется)?", "Is the temperature needed for the calculation (it does not change)?"], a: false,
        why: ["Жоқ: T тұрақты болса, k өзгермейді — бұл артық дерек.", "Нет: при постоянной T константа k не меняется — это лишнее данное.", "No: at constant T, k does not change, so T is surplus data."] }
    ],
    ai: function (p, r) {
      var self = this, rx = RX[p.rx], type = r() < 0.4 ? "none" : (rx.solid ? pick(r, ["formula", "data"]) : "formula");
      var right = self.answer(p).value;
      var wrong = type === "data" ? Math.pow(p.n, 2) : (p.kind === "c" ? p.n : Math.pow(p.n, rx.sp.length));
      if (type !== "none" && Math.abs(wrong - right) < 1e-9) type = "none";
      return { type: type, text: function (l) {
        return type === "none" ? self.solution(p, l)
          : type === "data" ? ["v = k·[C]·[O₂]", "v₂/v₁ = " + p.n + " · " + p.n + " = " + wrong]
          : [S(l, "Әр зат концентрациясы бірінші дәрежеде алынады:", "Каждая концентрация берётся в первой степени:", "Each concentration is taken to the first power:"), "v₂/v₁ = " + wrong];
      } };
    }
  });

  // C1. Уравнение Аррениуса: во сколько раз растёт константа.
  T.push({
    id: "arr_ratio", level: "C", method: "arrhenius", unknown: "ratio", units: ["none"], tol: 0.02,
    gen: function (r) { var p = { Ea: range(r, 40, 90, 5), t1: pick(r, [20, 25, 27, 30, 35]), d: pick(r, [10, 20]), A: pick(r, [2, 5, 8]) }; p.t2 = p.t1 + p.d; return p; },
    valid: function (p) { var x = this.answer(p).value; return x > 1.2 && x < 50; },
    answer: function (p) { var T1 = p.t1 + 273.15, T2 = p.t2 + 273.15; return { value: Math.exp(p.Ea * 1000 / R * (1 / T1 - 1 / T2)), unit: "none" }; },
    convert: function () { return true; },
    statement: function (p, l) {
      return S(l, "Реакцияның активтендіру энергиясы " + p.Ea + " кДж/моль, экспонента алдындағы көбейткіш A = " + p.A + "·10¹⁰ с⁻¹. Температураны " + p.t1 + "-ден " + p.t2 + " °C-қа дейін көтергенде жылдамдық константасы неше есе артады?",
        "Энергия активации реакции " + p.Ea + " кДж/моль, предэкспоненциальный множитель A = " + p.A + "·10¹⁰ с⁻¹. Во сколько раз возрастёт константа скорости при нагревании от " + p.t1 + " до " + p.t2 + " °C?",
        "A reaction has an activation energy of " + p.Ea + " kJ/mol and a pre-exponential factor A = " + p.A + "·10¹⁰ s⁻¹. By what factor does the rate constant increase when heated from " + p.t1 + " to " + p.t2 + " °C?");
    },
    givens: function (p, l) {
      return [
        { id: "Ea", text: "Eₐ = " + p.Ea + S(l, " кДж/моль", " кДж/моль", " kJ/mol"), relevant: true },
        { id: "t", text: "t₁ = " + p.t1 + " °C, t₂ = " + p.t2 + " °C", relevant: true },
        { id: "A", text: "A = " + p.A + "·10¹⁰ " + S(l, "с⁻¹", "с⁻¹", "s⁻¹"), relevant: false }
      ];
    },
    hints: [
      function (p, l) { return S(l, "Екі температура үшін Аррениус теңдеуін жазып, бір-біріне бөліңіз: A қысқарады. Температураны Кельвинге, Eₐ-ны Дж/моль-ге айналдырыңыз.", "Запишите уравнение Аррениуса для двух температур и разделите одно на другое: A сокращается. Переведите температуру в кельвины, а Eₐ в Дж/моль.", "Write the Arrhenius equation for both temperatures and divide one by the other: A cancels. Convert temperatures to kelvin and Eₐ to J/mol."); },
      function (p, l) { var T1 = p.t1 + 273.15, T2 = p.t2 + 273.15; return S(l, "T₁ = " + N(T1, 2, l) + " К, T₂ = " + N(T2, 2, l) + " К, Eₐ = " + p.Ea * 1000 + " Дж/моль. ln(k₂/k₁) = (Eₐ/R)(1/T₁ − 1/T₂).", "T₁ = " + N(T1, 2, l) + " К, T₂ = " + N(T2, 2, l) + " К, Eₐ = " + p.Ea * 1000 + " Дж/моль. ln(k₂/k₁) = (Eₐ/R)(1/T₁ − 1/T₂).", "T₁ = " + N(T1, 2, l) + " K, T₂ = " + N(T2, 2, l) + " K, Eₐ = " + p.Ea * 1000 + " J/mol. ln(k₂/k₁) = (Eₐ/R)(1/T₁ − 1/T₂)."); }
    ],
    solution: function (p, l) {
      var T1 = p.t1 + 273.15, T2 = p.t2 + 273.15, ln = p.Ea * 1000 / R * (1 / T1 - 1 / T2);
      return ["T₁ = " + N(T1, 2, l) + " K, T₂ = " + N(T2, 2, l) + " K",
        "ln(k₂/k₁) = " + p.Ea * 1000 + " / " + N(R, 3, l) + " · (1/" + N(T1, 2, l) + " − 1/" + N(T2, 2, l) + ") = " + N(ln, 4, l),
        "k₂/k₁ = e^" + N(ln, 4, l) + " ≈ " + G(Math.exp(ln), l)];
    },
    mistakes: function (p) {
      var T1 = p.t1 + 273.15, T2 = p.t2 + 273.15, ln = p.Ea * 1000 / R * (1 / T1 - 1 / T2);
      return [
        { id: "units", value: Math.exp(p.Ea / R * (1 / T1 - 1 / T2)), msg: ["Eₐ Дж/моль-ге айналдырылмаған сияқты (×1000).", "Похоже, Eₐ не переведена в Дж/моль (×1000).", "It looks like Eₐ was not converted to J/mol (×1000)."] },
        { id: "units", value: Math.exp(Math.min(700, p.Ea * 1000 / R * (1 / p.t1 - 1 / p.t2))), msg: ["Температура Кельвинге айналдырылмаған сияқты.", "Похоже, температура не переведена в кельвины.", "It looks like the temperature was not converted to kelvin."] },
        { id: "formula", value: Math.pow(10, ln), msg: ["Натурал логарифмнің орнына ондық логарифм қолданылған сияқты.", "Похоже, вместо натурального логарифма использован десятичный.", "It looks like log₁₀ was used instead of the natural log."] }
      ];
    },
    checks: [
      { q: ["Аррениус теңдеуінде температура Кельвинмен алынды ма?", "Взята ли температура в уравнении Аррениуса в кельвинах?", "Was temperature used in kelvin in the Arrhenius equation?"], a: true,
        why: ["Иә: теңдеуде абсолют температура T = t + 273,15 қолданылады.", "Да: в уравнении используется абсолютная температура T = t + 273,15.", "Yes: the equation uses absolute temperature, T = t + 273.15."] },
      { q: ["A көбейткіші k₂/k₁ қатынасына әсер ете ме?", "Влияет ли множитель A на отношение k₂/k₁?", "Does the factor A affect the ratio k₂/k₁?"], a: false,
        why: ["Жоқ: A екі температурада бірдей деп есептеледі және қысқарады.", "Нет: A считается одинаковым при обеих температурах и сокращается.", "No: A is assumed the same at both temperatures and cancels."] }
    ],
    ai: function (p, r) {
      var self = this, type = r() < 0.4 ? "none" : pick(r, ["units", "calc"]);
      var T1 = p.t1 + 273.15, T2 = p.t2 + 273.15;
      return { type: type, text: function (l) {
        if (type === "units") { var x = Math.exp(Math.min(700, p.Ea * 1000 / R * (1 / p.t1 - 1 / p.t2))); return ["ln(k₂/k₁) = " + p.Ea * 1000 + " / " + N(R, 3, l) + " · (1/" + p.t1 + " − 1/" + p.t2 + ")", "k₂/k₁ ≈ " + (x > 1e6 ? "10^" + Math.round(Math.log10(x)) : G(x, l))]; }
        if (type === "calc") return ["ln(k₂/k₁) = " + p.Ea + " / " + N(R, 3, l) + " · (1/" + N(T1, 2, l) + " − 1/" + N(T2, 2, l) + ")", "k₂/k₁ ≈ " + G(Math.exp(p.Ea / R * (1 / T1 - 1 / T2)), l, 4) + S(l, " — константа іс жүзінде өзгермейді.", " — константа практически не меняется.", " — the constant barely changes.")];
        return self.solution(p, l);
      } };
    }
  });

  // C2. Энергия активации по двум константам.
  T.push({
    id: "arr_ea", level: "C", method: "arrhenius", unknown: "energy", units: ["kJ", "J", "none"], tol: 0.02,
    gen: function (r) { var p = { ratio: pick(r, [2, 3, 4, 5]), T1: pick(r, [290, 295, 300, 310]), d: pick(r, [10, 15, 20]), C: pick(r, [0.1, 0.5]) }; p.T2 = p.T1 + p.d; return p; },
    valid: function () { return true; },
    answer: function (p) { return { value: R * Math.log(p.ratio) / (1 / p.T1 - 1 / p.T2) / 1000, unit: "kJ" }; },
    convert: function () { return true; },
    statement: function (p, l) {
      return S(l, "Бастапқы концентрация " + N(p.C, 1, l) + " моль/л болғанда температураны " + p.T1 + " К-нен " + p.T2 + " К-ге көтергенде жылдамдық константасы " + p.ratio + " есе артты. Активтендіру энергиясын кДж/моль бірлігінде табыңыз.",
        "При начальной концентрации " + N(p.C, 1, l) + " моль/л нагревание от " + p.T1 + " К до " + p.T2 + " К увеличило константу скорости в " + p.ratio + " " + (p.ratio <= 4 ? "раза" : "раз") + ". Найдите энергию активации в кДж/моль.",
        "With an initial concentration of " + N(p.C, 1, l) + " mol/L, heating from " + p.T1 + " K to " + p.T2 + " K increased the rate constant " + p.ratio + " times. Find the activation energy in kJ/mol.");
    },
    givens: function (p, l) {
      return [
        { id: "ratio", text: "k₂/k₁ = " + p.ratio, relevant: true },
        { id: "T", text: "T₁ = " + p.T1 + " K, T₂ = " + p.T2 + " K", relevant: true },
        { id: "C", text: "C₀ = " + N(p.C, 1, l) + S(l, " моль/л", " моль/л", " mol/L"), relevant: false }
      ];
    },
    hints: [
      function (p, l) { return S(l, "Аррениус теңдеуін Eₐ-ға қатысты шешіңіз: Eₐ = R·ln(k₂/k₁) / (1/T₁ − 1/T₂).", "Решите уравнение Аррениуса относительно Eₐ: Eₐ = R·ln(k₂/k₁) / (1/T₁ − 1/T₂).", "Solve the Arrhenius equation for Eₐ: Eₐ = R·ln(k₂/k₁) / (1/T₁ − 1/T₂)."); },
      function (p, l) { return S(l, "ln " + p.ratio + " = " + N(Math.log(p.ratio), 4, l) + "; 1/T₁ − 1/T₂ = " + N((1 / p.T1 - 1 / p.T2) * 1e4, 4, l) + "·10⁻⁴ К⁻¹. Нәтиже Дж/моль-мен шығады — кДж-ға айналдырыңыз.", "ln " + p.ratio + " = " + N(Math.log(p.ratio), 4, l) + "; 1/T₁ − 1/T₂ = " + N((1 / p.T1 - 1 / p.T2) * 1e4, 4, l) + "·10⁻⁴ К⁻¹. Результат получится в Дж/моль — переведите в кДж.", "ln " + p.ratio + " = " + N(Math.log(p.ratio), 4, l) + "; 1/T₁ − 1/T₂ = " + N((1 / p.T1 - 1 / p.T2) * 1e4, 4, l) + "·10⁻⁴ K⁻¹. The result comes out in J/mol — convert to kJ."); }
    ],
    solution: function (p, l) {
      var inv = 1 / p.T1 - 1 / p.T2, E = R * Math.log(p.ratio) / inv;
      return ["1/T₁ − 1/T₂ = 1/" + p.T1 + " − 1/" + p.T2 + " = " + N(inv * 1e4, 4, l) + "·10⁻⁴",
        "Eₐ = " + N(R, 3, l) + " · ln " + p.ratio + " / " + N(inv * 1e4, 4, l) + "·10⁻⁴ = " + G(E, l, 4) + S(l, " Дж/моль", " Дж/моль", " J/mol"),
        "Eₐ ≈ " + G(E / 1000, l) + S(l, " кДж/моль", " кДж/моль", " kJ/mol")];
    },
    mistakes: function (p) {
      var inv = 1 / p.T1 - 1 / p.T2;
      return [
        { id: "formula", value: R * Math.log10(p.ratio) / inv / 1000, msg: ["Натурал логарифмнің орнына ондық логарифм алынған сияқты.", "Похоже, взят десятичный логарифм вместо натурального.", "It looks like log₁₀ was used instead of ln."] },
        { id: "formula", value: R * Math.log(p.ratio) / (p.T2 - p.T1) / 1000, msg: ["1/T₁ − 1/T₂ орнына T₂ − T₁ алынған сияқты.", "Похоже, вместо 1/T₁ − 1/T₂ взято T₂ − T₁.", "It looks like T₂ − T₁ was used instead of 1/T₁ − 1/T₂."] }
      ];
    },
    checks: [
      { q: ["Алынған Eₐ ондаған кДж/моль шамасында ма (көптеген реакциялар үшін әдеттегі)?", "Лежит ли полученная Eₐ в пределах десятков кДж/моль (типично для многих реакций)?", "Is the Eₐ you got in the tens of kJ/mol (typical for many reactions)?"], a: true,
        why: ["Иә, бұл шынайылықты тексеру.", "Да, это проверка реалистичности.", "Yes, that is a plausibility check."] },
      { q: ["Бастапқы концентрация Eₐ-ны есептеуге керек пе?", "Нужна ли начальная концентрация для расчёта Eₐ?", "Is the initial concentration needed to calculate Eₐ?"], a: false,
        why: ["Жоқ: k концентрацияға тәуелсіз, бұл — артық дерек.", "Нет: k не зависит от концентрации, это лишнее данное.", "No: k does not depend on concentration, so this is surplus data."] }
    ],
    ai: function (p, r) {
      var self = this, type = r() < 0.4 ? "none" : pick(r, ["formula", "units"]);
      var inv = 1 / p.T1 - 1 / p.T2, E = R * Math.log(p.ratio) / inv;
      return { type: type, text: function (l) {
        var kj = S(l, " кДж/моль", " кДж/моль", " kJ/mol");
        if (type === "formula") return ["Eₐ = R · lg(k₂/k₁) / (1/T₁ − 1/T₂)", "Eₐ ≈ " + G(R * Math.log10(p.ratio) / inv / 1000, l) + kj];
        if (type === "units") return ["Eₐ = " + N(R, 3, l) + " · ln " + p.ratio + " / " + N(inv * 1e4, 4, l) + "·10⁻⁴", "Eₐ ≈ " + G(E, l, 4) + kj];
        return self.solution(p, l);
      } };
    }
  });

  // C3. Период полупревращения / доля оставшегося вещества (1 порядок).
  T.push({
    id: "half_life", level: "C", method: "half_life", unknown: "halflife", units: ["min", "s", "pct"], tol: 0.02,
    gen: function (r) {
      var p = { th: pick(r, [10, 12, 15, 20, 24, 30, 40]), ask: pick(r, ["th", "rem"]), n: pick(r, [2, 3, 4]), C0: pick(r, [0.4, 0.8, 1.2]) };
      p.k = +(Math.LN2 / p.th).toPrecision(3);
      p.t = p.n * p.th;
      return p;
    },
    valid: function () { return true; },
    unknownOf: function (p) { return p.ask === "th" ? "halflife" : "remain"; },
    answer: function (p) { return p.ask === "th" ? { value: Math.LN2 / p.k, unit: "min" } : { value: 100 * Math.exp(-p.k * p.t), unit: "pct" }; },
    convert: function () { return false; },
    statement: function (p, l) {
      var base = S(l, "1-ретті реакцияның жылдамдық константасы k = " + N(p.k, 4, l) + " мин⁻¹, бастапқы концентрация " + N(p.C0, 1, l) + " моль/л. ", "Константа скорости реакции 1 порядка k = " + N(p.k, 4, l) + " мин⁻¹, начальная концентрация " + N(p.C0, 1, l) + " моль/л. ", "A first-order reaction has k = " + N(p.k, 4, l) + " min⁻¹ and an initial concentration of " + N(p.C0, 1, l) + " mol/L. ");
      return base + (p.ask === "th"
        ? S(l, "Жартылай ыдырау периодын минутпен табыңыз.", "Найдите период полупревращения в минутах.", "Find the half-life in minutes.")
        : S(l, p.t + " минуттан кейін бастапқы заттың неше пайызы қалады?", "Сколько процентов исходного вещества останется через " + p.t + " мин?", "What percentage of the reactant remains after " + p.t + " min?"));
    },
    givens: function (p, l) {
      var g = [{ id: "k", text: "k = " + N(p.k, 4, l) + S(l, " мин⁻¹", " мин⁻¹", " min⁻¹"), relevant: true }];
      if (p.ask === "rem") g.push({ id: "t", text: "t = " + p.t + S(l, " мин", " мин", " min"), relevant: true });
      g.push({ id: "C0", text: "C₀ = " + N(p.C0, 1, l) + S(l, " моль/л", " моль/л", " mol/L"), relevant: false });
      return g;
    },
    hints: [
      function (p, l) { return S(l, "1-ретті реакция үшін t½ = ln2/k, ал C/C₀ = e^(−kt). C₀ мұнда керек пе?", "Для реакции 1 порядка t½ = ln2/k, а C/C₀ = e^(−kt). Нужна ли здесь C₀?", "For a first-order reaction t½ = ln2/k and C/C₀ = e^(−kt). Is C₀ needed here?"); },
      function (p, l) { return p.ask === "th" ? S(l, "ln2 ≈ 0,693. Оны k-ға бөліңіз.", "ln2 ≈ 0,693. Разделите на k.", "ln2 ≈ 0.693. Divide by k.") : S(l, "k·t = " + N(p.k * p.t, 4, l) + ". Немесе: t½ санын табыңыз, сонда қалған үлес (1/2)ⁿ болады.", "k·t = " + N(p.k * p.t, 4, l) + ". Или: найдите число периодов полупревращения, тогда доля равна (1/2)ⁿ.", "k·t = " + N(p.k * p.t, 4, l) + ". Or count the half-lives: the fraction left is (1/2)ⁿ."); }
    ],
    solution: function (p, l) {
      var th = Math.LN2 / p.k;
      if (p.ask === "th") return ["t½ = ln2 / k = " + N(0.6931, 4, l) + " / " + N(p.k, 4, l) + " ≈ " + G(th, l) + S(l, " мин", " мин", " min")];
      return ["C/C₀ = e^(−kt) = e^(−" + N(p.k, 4, l) + "·" + p.t + ") = e^(−" + N(p.k * p.t, 3, l) + ")", "≈ " + G(100 * Math.exp(-p.k * p.t), l) + " %",
        S(l, "Тексеріс: t½ ≈ " + G(th, l) + " мин, t ≈ " + p.n + "·t½, (1/2)^" + p.n + " = " + N(100 / Math.pow(2, p.n), 2, l) + " %", "Проверка: t½ ≈ " + G(th, l) + " мин, t ≈ " + p.n + "·t½, (1/2)^" + p.n + " = " + N(100 / Math.pow(2, p.n), 2, l) + " %", "Check: t½ ≈ " + G(th, l) + " min, t ≈ " + p.n + "·t½, (1/2)^" + p.n + " = " + N(100 / Math.pow(2, p.n), 2, l) + "%")];
    },
    mistakes: function (p) {
      if (p.ask === "th") return [
        { id: "formula", value: p.k / Math.LN2, msg: ["Формула төңкерілген: t½ = ln2/k.", "Формула перевёрнута: t½ = ln2/k.", "The formula is upside down: t½ = ln2/k."] },
        { id: "data", value: p.C0 / (2 * p.k), msg: ["0-ретті реакцияның формуласы (C₀/2k) қолданылған сияқты.", "Похоже, использована формула для реакции 0 порядка (C₀/2k).", "It looks like the zero-order formula (C₀/2k) was used."] }
      ];
      return [
        { id: "formula", value: 100 - 50 * p.n, msg: ["Әр t½ сайын 50 % азаймайды — қалғанның жартысы азаяды.", "За каждый t½ убывает не 50 %, а половина оставшегося.", "Each half-life removes half of what is left, not 50% of the original."] },
        { id: "formula", value: 100 * (1 - Math.exp(-p.k * p.t)), msg: ["Қалған үлестің орнына ыдыраған үлес табылған сияқты.", "Похоже, найдена доля прореагировавшего, а не оставшегося.", "It looks like you found the fraction that reacted, not what remains."] }
      ].filter(function (m) { return m.value > 0; });
    },
    checks: [
      { q: ["1-ретті реакцияда t½ бастапқы концентрацияға тәуелді ме?", "Зависит ли t½ реакции 1 порядка от начальной концентрации?", "Does t½ of a first-order reaction depend on the initial concentration?"], a: false,
        why: ["Жоқ: t½ = ln2/k — C₀ бұл есепте артық дерек.", "Нет: t½ = ln2/k — C₀ в этой задаче лишнее данное.", "No: t½ = ln2/k, so C₀ is surplus data here."] },
      { q: ["n жартылай ыдырау периодынан кейін бастапқы заттың (1/2)ⁿ бөлігі қала ма?", "Остаётся ли через n периодов полупревращения (1/2)ⁿ исходного вещества?", "After n half-lives, does (1/2)ⁿ of the reactant remain?"], a: true,
        why: ["Иә, бұл жауапты тексерудің тәуелсіз тәсілі.", "Да, это независимый способ проверить ответ.", "Yes, that is an independent way to check the answer."] }
    ],
    ai: function (p, r) {
      var self = this, type = r() < 0.4 ? "none" : pick(r, ["data", "formula"]);
      return { type: type, text: function (l) {
        var mn = S(l, " мин", " мин", " min");
        if (p.ask === "th") {
          if (type === "data") return ["t½ = C₀ / (2k) = " + N(p.C0, 1, l) + " / (2·" + N(p.k, 4, l) + ") = " + G(p.C0 / (2 * p.k), l) + mn];
          if (type === "formula") return ["t½ = k / ln2 = " + N(p.k, 4, l) + " / " + N(0.6931, 4, l) + " = " + G(p.k / Math.LN2, l) + mn];
        } else {
          if (type === "data") return [S(l, "C₀ = " + N(p.C0, 1, l) + " моль/л, сондықтан C = C₀ − k·t = ", "C₀ = " + N(p.C0, 1, l) + " моль/л, поэтому C = C₀ − k·t = ", "C₀ = " + N(p.C0, 1, l) + " mol/L, so C = C₀ − k·t = ") + G(p.C0 - p.k * p.t, l), S(l, "Үлес ≈ ", "Доля ≈ ", "Share ≈ ") + G(Math.max(0, 100 * (p.C0 - p.k * p.t) / p.C0), l) + " %"];
          if (type === "formula") return [S(l, "Әр t½ сайын 50 % жоғалады:", "За каждый t½ теряется 50 %:", "50% is lost every half-life:"), "100 − " + p.n + "·50 = " + (100 - 50 * p.n) + " %"];
        }
        return self.solution(p, l);
      } };
    }
  });

  /* ---------- Концептуальные утверждения «ИИ» (AI Answer Verification) ---------- */
  var CLAIMS = [
    { ok: false, type: "general",
      c: ["Температура 10 °C-қа көтерілгенде кез келген реакцияның жылдамдығы әрқашан дәл 2 есе артады.", "При повышении температуры на 10 °C скорость любой реакции всегда увеличивается ровно в 2 раза.", "When the temperature rises by 10 °C, the rate of any reaction always increases exactly twofold."],
      ref: ["Қате жалпылау. Вант-Гофф ережесі — жуық эмпирикалық ереже: γ әдетте 2–4 аралығында және реакцияның Eₐ-сы мен температура аралығына тәуелді. Дәлірек тәуелділікті Аррениус теңдеуі береді.", "Неправомерное обобщение. Правило Вант-Гоффа — приближённое эмпирическое правило: γ обычно лежит в пределах 2–4 и зависит от Eₐ реакции и интервала температур. Точнее зависимость описывает уравнение Аррениуса.", "An unjustified generalisation. Van 't Hoff's rule is an approximate empirical rule: γ is usually 2–4 and depends on the reaction's Eₐ and the temperature range. The Arrhenius equation describes the dependence more accurately."] },
    { ok: false, type: "chem",
      c: ["Катализатор реакцияның ΔH-ын азайтады, сондықтан реакция тездейді.", "Катализатор уменьшает ΔH реакции, поэтому реакция ускоряется.", "A catalyst lowers the ΔH of a reaction, which is why the reaction speeds up."],
      ref: ["Қате химиялық болжам. Катализатор активтендіру энергиясын төмендетеді, ал ΔH бастапқы және соңғы күйге ғана тәуелді, өзгермейді.", "Ошибочное химическое предположение. Катализатор снижает энергию активации, а ΔH зависит только от начального и конечного состояний и не меняется.", "A wrong chemical assumption. A catalyst lowers the activation energy; ΔH depends only on the initial and final states and does not change."] },
    { ok: true, type: "none",
      c: ["Қатты заттың концентрациясы кинетикалық теңдеуге енбейді.", "Концентрация твёрдого вещества не входит в кинетическое уравнение.", "The concentration of a solid does not appear in the rate law."],
      ref: ["Дұрыс. Гетерогенді реакцияда қатты заттың әсері жылдамдық константасы мен бет ауданы арқылы ескеріледі.", "Верно. В гетерогенной реакции влияние твёрдого вещества учитывается через константу скорости и площадь поверхности.", "Correct. In a heterogeneous reaction the solid's effect is captured by the rate constant and the surface area."] },
    { ok: false, type: "chem",
      c: ["1-ретті реакцияда бастапқы концентрация артқан сайын жартылай ыдырау периоды ұзарады.", "В реакции 1 порядка период полупревращения увеличивается с ростом начальной концентрации.", "In a first-order reaction the half-life gets longer as the initial concentration increases."],
      ref: ["Қате. 1-ретті реакцияда t½ = ln2/k және C₀-ға тәуелді емес. C₀-ға тура пропорционал t½ — 0-ретті реакцияның белгісі.", "Неверно. Для реакции 1 порядка t½ = ln2/k и не зависит от C₀. Прямая пропорциональность t½ и C₀ — признак реакции 0 порядка.", "Wrong. For a first-order reaction t½ = ln2/k, independent of C₀. A t½ proportional to C₀ is a sign of a zero-order reaction."] },
    { ok: false, type: "formula",
      c: ["2NO + O₂ → 2NO₂ элементар реакциясында қысымды 2 есе арттырғанда жылдамдық 2 есе артады.", "В элементарной реакции 2NO + O₂ → 2NO₂ при увеличении давления в 2 раза скорость возрастает в 2 раза.", "In the elementary reaction 2NO + O₂ → 2NO₂, doubling the pressure doubles the rate."],
      ref: ["Қате формула. v = k[NO]²[O₂]; екі газдың да концентрациясы 2 есе артады: 2² · 2 = 8 есе.", "Неверная формула. v = k[NO]²[O₂]; концентрации обоих газов растут в 2 раза: 2² · 2 = 8 раз.", "Wrong formula. v = k[NO]²[O₂]; both gas concentrations double: 2² · 2 = 8 times."] },
    { ok: false, type: "units",
      c: ["Аррениус теңдеуіне температураны Цельсий градусымен қоюға болады.", "В уравнение Аррениуса можно подставлять температуру в градусах Цельсия.", "You can put the temperature in degrees Celsius into the Arrhenius equation."],
      ref: ["Бірліктердегі қате. Теңдеуде абсолют температура (К) қолданылады; °C-пен 1/T мағынасыз болады (0 °C-та тіпті шексіздік).", "Ошибка в единицах. В уравнении используется абсолютная температура (К); с °C величина 1/T теряет смысл (при 0 °C — даже бесконечность).", "A units error. The equation uses absolute temperature (K); with °C the quantity 1/T makes no sense (it even becomes infinite at 0 °C)."] },
    { ok: true, type: "none",
      c: ["Активтендіру энергиясы үлкен реакцияның жылдамдығы температураға сезімталырақ.", "Скорость реакции с большей энергией активации сильнее зависит от температуры.", "A reaction with a higher activation energy is more sensitive to temperature."],
      ref: ["Дұрыс. ln(k₂/k₁) Eₐ-ға тура пропорционал, сондықтан бірдей қыздыруда Eₐ үлкен болса, k көбірек өзгереді.", "Верно. ln(k₂/k₁) прямо пропорционален Eₐ, поэтому при одинаковом нагревании k меняется сильнее при большей Eₐ.", "Correct. ln(k₂/k₁) is proportional to Eₐ, so for the same heating k changes more when Eₐ is larger."] },
    { ok: false, type: "general",
      c: ["Ферменттің белсенділігі температура көтерілген сайын шексіз өседі.", "Активность фермента неограниченно растёт с повышением температуры.", "An enzyme's activity keeps rising without limit as the temperature increases."],
      ref: ["Негізсіз жалпылау. Оңтайлы температурадан (адам ферменттері үшін ≈ 37 °C) жоғары ақуыз денатурацияланып, белсенділік күрт төмендейді.", "Неправомерное обобщение. Выше оптимальной температуры (для ферментов человека ≈ 37 °C) белок денатурирует, и активность резко падает.", "An unjustified generalisation. Above the optimum temperature (≈ 37 °C for human enzymes) the protein denatures and activity falls sharply."] },
    { ok: false, type: "data",
      c: ["Бастапқы зат концентрациясы азаятындықтан, реакция жылдамдығы теріс сан болады.", "Поскольку концентрация исходного вещества убывает, скорость реакции — отрицательное число.", "Because the reactant concentration decreases, the reaction rate is a negative number."],
      ref: ["Қате. Жылдамдық анықтама бойынша оң; ΔC/Δt алдындағы «−» таңбасы дәл осы үшін қойылады.", "Неверно. Скорость по определению положительна; знак «−» перед ΔC/Δt ставится именно для этого.", "Wrong. Rate is positive by definition; the “−” in front of ΔC/Δt is there exactly for that reason."] },
    { ok: true, type: "none",
      c: ["Бор ұнтағы бор кесегіне қарағанда HCl-мен тезірек әрекеттеседі, өйткені жанасу беті үлкен.", "Порошок мела реагирует с HCl быстрее, чем кусок мела, потому что больше поверхность контакта.", "Powdered chalk reacts with HCl faster than a lump of chalk because the contact surface is larger."],
      ref: ["Дұрыс. Гетерогенді реакция фазалар шекарасында жүреді, ұсақтағанда бет ауданы артады.", "Верно. Гетерогенная реакция идёт на границе фаз, при измельчении площадь поверхности растёт.", "Correct. A heterogeneous reaction happens at the phase boundary, and grinding increases the surface area."] }
  ];

  /* ---------- API ---------- */
  function byId(id) { for (var i = 0; i < T.length; i++) if (T[i].id === id) return T[i]; return null; }
  function generate(id, seed) {
    var t = byId(id);
    if (!t) throw new Error("Unknown template " + id);
    var r = rng(seed), p, tries = 0;
    do { p = t.gen(r); tries++; } while (!t.valid(p) && tries < 200);
    if (!t.valid(p)) throw new Error("No valid params for " + id);
    var ai = t.ai(p, rng(seed ^ 0x9E3779B9));
    return { template: id, version: VERSION, seed: seed, params: p, level: t.level, ai: ai };
  }
  function unknownOf(t, p) { return t.unknownOf ? t.unknownOf(p) : t.unknown; }
  function unitsOf(t, p) {
    var u = t.answer(p).unit;
    if (u === "none") return ["none"];
    if (u === "pct") return ["pct", "none"];
    return t.units;
  }
  // Проверка числового ответа с единицей.
  function check(id, p, input, unit) {
    var t = byId(id), a = t.answer(p), x = parseNum(input);
    if (isNaN(x)) return { status: "nan" };
    var U = UNITS[unit || a.unit] || UNITS[a.unit];
    var base = UNITS[a.unit];
    if (U.dim !== base.dim) return { status: "unit", x: x };
    var xb = x / U.f * base.f;
    var rel = Math.abs(xb - a.value) / Math.abs(a.value);
    if (rel <= t.tol) return { status: "ok", rel: rel };
    if (xb < 0 && Math.abs(-xb - a.value) / a.value <= t.tol) return { status: "sign" };
    var ms = t.mistakes(p);
    for (var i = 0; i < ms.length; i++) {
      if (isFinite(ms[i].value) && ms[i].value !== 0 && Math.abs(xb - ms[i].value) / Math.abs(ms[i].value) <= t.tol) return { status: "mistake", mistake: ms[i] };
    }
    var f = [1000, 1 / 1000, 60, 1 / 60];
    for (var j = 0; j < f.length; j++) if (Math.abs(xb - a.value * f[j]) / Math.abs(a.value * f[j]) <= t.tol) return { status: "scale" };
    return { status: "wrong", high: xb > a.value };
  }

  return {
    VERSION: VERSION, R: R, UNITS: UNITS, METHODS: METHODS, UNKNOWNS: UNKNOWNS, ERRORS: ERRORS, CLAIMS: CLAIMS,
    templates: T, byId: byId, generate: generate, check: check, unknownOf: unknownOf, unitsOf: unitsOf,
    parseNum: parseNum, rng: rng, S: S, N: N, G: G
  };
})();
