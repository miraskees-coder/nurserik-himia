/* ================= Critical Thinking Lab: интерфейс семи этапов =================
   Зависит от site.js (L, LANG, $, safe, store, onLang) и engine.js (NCEngine). */
safe("trainer", function () {
  var E = NCEngine;
  var KEY_CUR = "nc-ct-current", KEY_HIST = "nc-ct-history";
  var STAGES = [
    ["Талдау", "Анализ", "Analysis"],
    ["Болжам", "Гипотеза", "Hypothesis"],
    ["Негіздеу", "Обоснование", "Justification"],
    ["Шешім", "Решение", "Solution"],
    ["Тексеру", "Проверка", "Check"],
    ["Сыни талдау", "Критический анализ", "Critical analysis"],
    ["Рефлексия", "Рефлексия", "Reflection"]
  ];
  var JUSTIFY = {
    avg_rate: ["Екі уақыт сәтіндегі концентрация берілген, орташа жылдамдық сұралады — бұл анықтаманың өзі.", "Даны концентрации в два момента времени и спрашивается средняя скорость — это само определение.", "Concentrations at two moments are given and the average rate is asked for — that is the definition itself."],
    vant_hoff: ["Температура өзгерісі және γ (немесе жылдамдық өзгерісі) берілген, Eₐ жоқ — Вант-Гофф ережесі дәл осындай жағдайға арналған.", "Даны изменение температуры и γ (или изменение скорости), Eₐ нет — правило Вант-Гоффа рассчитано именно на этот случай.", "A temperature change and γ (or a rate change) are given with no Eₐ — Van 't Hoff's rule is meant for exactly this case."],
    arrhenius: ["Eₐ немесе екі температурадағы константалар қатынасы берілген — абсолют температурамен дәл есептеу үшін Аррениус теңдеуі керек.", "Дана Eₐ или отношение констант при двух температурах — для точного расчёта с абсолютной температурой нужно уравнение Аррениуса.", "Eₐ or the ratio of constants at two temperatures is given — an exact calculation with absolute temperature needs the Arrhenius equation."],
    mass_action: ["Концентрация не қысым өзгереді, температура тұрақты — жылдамдық кинетикалық теңдеу бойынша өзгереді.", "Меняются концентрация или давление при постоянной температуре — скорость меняется по кинетическому уравнению.", "Concentration or pressure changes at constant temperature — the rate changes according to the rate law."],
    half_life: ["1-ретті реакцияның k-сы берілген — t½ мен қалған үлес осы реакцияның экспоненциалдық заңынан шығады.", "Дана k реакции 1 порядка — t½ и оставшаяся доля следуют из экспоненциального закона этой реакции.", "k of a first-order reaction is given — t½ and the remaining fraction follow from its exponential law."]
  };
  var cur = null;

  function T3(a) { return L(a[0], a[1], a[2]); }
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function load(key, def) { try { var v = JSON.parse(store(key) || "null"); return v == null ? def : v; } catch (e) { return def; } }
  function save() { store(KEY_CUR, JSON.stringify(cur)); }
  function rid() { return Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36); }
  function shuffled(arr, seed) {
    var r = E.rng(seed), a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  /* ---------- Создание задачи ---------- */
  function newProblem() {
    var lvl = $("ctLevel").value;
    var pool = E.templates.filter(function (t) { return !lvl || t.level === lvl; });
    var prev = cur && cur.template;
    var t = pool[Math.floor(Math.random() * pool.length)];
    if (pool.length > 1 && t.id === prev) t = pool[(pool.indexOf(t) + 1) % pool.length];
    var seed = (Math.random() * 4294967296) >>> 0;
    var g = E.generate(t.id, seed);
    var unk = E.unknownOf(t, g.params);
    var others = shuffled(Object.keys(E.UNKNOWNS).filter(function (k) { return k !== unk; }), seed).slice(0, 3);
    cur = {
      id: rid(), template: t.id, seed: seed, version: E.VERSION, level: t.level, stage: 0, started: new Date().toISOString(),
      unknownOpts: shuffled(others.concat([unk]), seed + 1),
      methodOpts: shuffled(Object.keys(E.METHODS), seed + 2),
      a: { sel: {}, unknown: null, convert: null, checked: false, first: null },
      m: { first: null, choice: null, just: "", checked: false, changes: 0 },
      s: { work: "", value: "", unit: E.unitsOf(t, g.params)[0], attempts: [], hints: 0, shown: false, done: false, correct: false, hintsAtCorrect: null },
      c: { ans: {}, checked: false, ok: null },
      k: { verdict: null, type: "", expl: "", checked: false, verdictOk: null, typeOk: null },
      r: { q1: "", q2: "", q3: "", q4: "" },
      finished: null, auto: null
    };
    save();
    render();
  }
  function ctx() {
    var t = E.byId(cur.template), g = E.generate(cur.template, cur.seed);
    return { t: t, p: g.params, ai: g.ai, unk: E.unknownOf(t, g.params) };
  }

  /* ---------- Отрисовка ---------- */
  function renderSteps() {
    $("ctSteps").innerHTML = STAGES.map(function (s, i) {
      var cls = !cur ? "" : (cur.finished || i < cur.stage) ? "done" : i === cur.stage ? "now" : "";
      return '<li class="' + cls + '"' + (cls === "now" ? ' aria-current="step"' : "") + "><b>" + (i + 1) + "</b>" + esc(T3(s)) + "</li>";
    }).join("");
  }
  function render() {
    renderSteps();
    if (!cur) {
      $("ctProblem").innerHTML = '<p class="muted">' + L("Деңгейді таңдап, «Жаңа есеп» батырмасын басыңыз.", "Выберите уровень и нажмите «Новая задача».", "Choose a level and press “New problem”.") + "</p>";
      $("ctStage").hidden = true;
      return;
    }
    var c = ctx();
    $("ctProblem").innerHTML = '<div class="meta"><span class="chip">' + L("Деңгей ", "Уровень ", "Level ") + cur.level + '</span><span class="chip">' + L("Нұсқа №", "Вариант №", "Version #") + cur.seed.toString(36).toUpperCase() + "</span></div>" +
      '<p class="st">' + esc(c.t.statement(c.p, LANG)) + "</p>";
    $("ctStage").hidden = false;
    var fn = cur.finished ? renderSummary : [stAnalysis, stHypothesis, stJustify, stSolve, stCheck, stCritical, stReflect][cur.stage];
    $("ctStage").innerHTML = fn(c);
    bindStage(c);
  }
  function head(i, lead) {
    return "<h2>" + (i + 1) + ". " + esc(T3(STAGES[i])) + '</h2><p class="lead">' + lead + "</p>";
  }
  function nextBtn(label) {
    return '<div class="row"><button class="btn btn-primary" type="button" data-act="next">' + (label || L("Келесі кезең →", "Следующий этап →", "Next stage →")) + "</button></div>";
  }

  // 1. Анализ условия.
  function stAnalysis(c) {
    var A = cur.a, gv = c.t.givens(c.p, LANG), h = head(0, L("Шартта не берілген, нені табу керек, қандай дерек артық? Шешу үшін керек деректерді белгілеңіз.", "Что дано, что нужно найти, какие данные лишние? Отметьте данные, которые нужны для решения.", "What is given, what must be found, which data are surplus? Tick the data needed to solve it."));
    h += '<p class="q">' + L("Шешуге қажетті деректер:", "Данные, нужные для решения:", "Data needed for the solution:") + '</p><div class="opts">';
    gv.forEach(function (g) {
      var cls = A.checked ? ((!!A.sel[g.id]) === g.relevant ? " right" : " wrong") : "";
      h += '<label class="opt' + cls + '"><input type="checkbox" data-given="' + g.id + '"' + (A.sel[g.id] ? " checked" : "") + (A.checked ? " disabled" : "") + "><span>" + esc(g.text) +
        (A.checked && !g.relevant ? ' — <i class="muted">' + L("артық дерек", "лишнее данное", "surplus data") + "</i>" : "") + "</span></label>";
    });
    h += '</div><p class="q">' + L("Нені табу керек?", "Что нужно найти?", "What must be found?") + '</p><div class="opts">';
    cur.unknownOpts.forEach(function (k) {
      var cls = A.checked ? (k === c.unk ? " right" : k === A.unknown ? " wrong" : "") : "";
      h += '<label class="opt' + cls + '"><input type="radio" name="unk" value="' + k + '"' + (A.unknown === k ? " checked" : "") + (A.checked ? " disabled" : "") + "><span>" + esc(T3(E.UNKNOWNS[k])) + "</span></label>";
    });
    var conv = c.t.convert(c.p);
    h += '</div><p class="q">' + L("Бірліктерді айналдыру керек пе (мысалы, мин → с, °C → К, кДж → Дж)?", "Нужно ли переводить единицы (например, мин → с, °C → К, кДж → Дж)?", "Do any units need converting (e.g. min → s, °C → K, kJ → J)?") + '</p><div class="yn">';
    [[true, L("Иә", "Да", "Yes")], [false, L("Жоқ", "Нет", "No")]].forEach(function (o) {
      var cls = A.checked ? (o[0] === conv ? " right" : A.convert === o[0] ? " wrong" : "") : "";
      h += '<label class="opt' + cls + '"><input type="radio" name="conv" value="' + o[0] + '"' + (A.convert === o[0] ? " checked" : "") + (A.checked ? " disabled" : "") + "><span>" + o[1] + "</span></label>";
    });
    h += "</div>";
    if (!A.checked) h += '<div class="row"><button class="btn btn-primary" type="button" data-act="checkA">' + L("Тексеру", "Проверить", "Check") + "</button></div>";
    else {
      var f = A.first;
      h += '<div class="fb ' + (f.unknown && f.givens && f.distractor && f.convert ? "ok" : "bad") + '"><p>' +
        mark(f.unknown) + L(" Ізделетін шама", " Искомая величина", " Unknown quantity") + " · " + mark(f.givens) + L(" Қажетті деректер", " Нужные данные", " Needed data") + " · " +
        mark(f.distractor) + L(" Артық дерек", " Лишнее данное", " Surplus data") + " · " + mark(f.convert) + L(" Бірліктер", " Единицы", " Units") + "</p>" +
        (conv ? "<p>" + L("Бұл есепте бірліктерді айналдыру керек.", "В этой задаче нужен перевод единиц.", "This problem needs a unit conversion.") + "</p>" : "") + "</div>" + nextBtn();
    }
    return h;
  }
  // 2. Гипотеза: выбор метода.
  function stHypothesis() {
    var h = head(1, L("Есепті қандай әдіспен шешуге болады деп ойлайсыз? Таңдауыңыз келесі кезеңде негізделеді.", "Каким методом, по-вашему, можно решить задачу? Выбор вы обоснуете на следующем этапе.", "Which method do you think solves this problem? You will justify the choice in the next stage."));
    h += '<div class="opts">';
    cur.methodOpts.forEach(function (k) {
      h += '<label class="opt"><input type="radio" name="meth" value="' + k + '"' + (cur.m.choice === k ? " checked" : "") + "><span>" + esc(T3(E.METHODS[k])) + "</span></label>";
    });
    return h + "</div>" + nextBtn();
  }
  // 3. Обоснование метода.
  function stJustify(c) {
    var M = cur.m, h = head(2, L("Неге дәл осы әдіс? Шарттағы қандай белгі оны таңдауға мәжбүрледі? Оны қолдану шарттары орындала ма?", "Почему именно этот метод? Какой признак условия на него указывает? Выполняются ли условия его применимости?", "Why this method? What in the problem points to it? Are its conditions of use met?"));
    h += '<p class="q">' + L("Сіздің таңдауыңыз: ", "Ваш выбор: ", "Your choice: ") + esc(T3(E.METHODS[M.choice])) + "</p>";
    h += '<textarea id="ctJust" aria-label="' + esc(L("Әдісті негіздеу", "Обоснование метода", "Justification of the method")) + '"' + (M.checked ? " readonly" : "") + ">" + esc(M.just) + "</textarea>";
    if (!M.checked) return h + '<div class="row"><button class="btn btn-primary" type="button" data-act="checkM">' + L("Тексеру", "Проверить", "Check") + '</button><span class="muted small" id="ctJustHint"></span></div>';
    var ok = M.choice === c.t.method;
    h += '<div class="fb ' + (ok ? "ok" : "bad") + '"><p>' + (ok ? '<span class="mark-ok">✓</span> ' + L("Әдіс сәйкес келеді.", "Метод подходит.", "The method fits.") : '<span class="mark-bad">✗</span> ' + L("Бұл әдіс бұл есепке сәйкес келмейді.", "Этот метод не подходит к задаче.", "This method does not fit the problem.")) + "</p>";
    if (ok) h += "<p><b>" + L("Салыстырыңыз:", "Сравните:", "Compare:") + "</b> " + esc(T3(JUSTIFY[c.t.method])) + "</p>";
    else h += "<p>" + L("Шартты қайта оқып, басқа әдісті таңдаңыз.", "Перечитайте условие и выберите другой метод.", "Reread the problem and choose another method.") + "</p>";
    h += "</div>";
    return h + (ok ? nextBtn() : '<div class="row"><button class="btn" type="button" data-act="changeM">' + L("← Әдісті өзгерту", "← Изменить метод", "← Change method") + "</button></div>");
  }
  // 4. Самостоятельное решение.
  function stSolve(c) {
    var Sv = cur.s, units = E.unitsOf(c.t, c.p), h = head(3, L("Қадамдап шешіңіз. Алдымен өзіңіз тырысыңыз: кеңес біртіндеп ашылады, толық шешім — ең соңында.", "Решите по шагам. Сначала попробуйте сами: подсказки открываются постепенно, полное решение — в последнюю очередь.", "Solve it step by step. Try on your own first: hints open gradually, and the full solution comes last."));
    h += '<p class="q">' + L("Шешу қадамдары (мұғалімге сақталады):", "Ход решения (сохраняется для учителя):", "Your working (saved for the teacher):") + "</p>";
    h += '<textarea id="ctWork" aria-label="' + esc(L("Шешу қадамдары", "Ход решения", "Working")) + '">' + esc(Sv.work) + "</textarea>";
    h += '<div class="row"><label class="field-inline">' + L("Жауап", "Ответ", "Answer") + '<input class="inp" id="ctAns" type="text" inputmode="decimal" autocomplete="off" value="' + esc(Sv.value) + '"' + (Sv.done ? " readonly" : "") + "></label>";
    if (units.length > 1 || units[0] !== "none") {
      h += '<label class="field-inline">' + L("Бірлік", "Единица", "Unit") + '<select id="ctUnit"' + (Sv.done ? " disabled" : "") + ">" + units.map(function (u) {
        return '<option value="' + u + '"' + (Sv.unit === u ? " selected" : "") + ">" + esc(T3(E.UNITS[u].t)) + "</option>";
      }).join("") + "</select></label>";
    }
    if (!Sv.done) {
      h += '<button class="btn btn-primary" type="button" data-act="checkS">' + L("Тексеру", "Проверить", "Check") + "</button>";
      h += '<button class="btn" type="button" data-act="hint">' + (Sv.hints < 2 ? L("Кеңес", "Подсказка", "Hint") + " " + (Sv.hints + 1) + "/2" : L("Толық шешімді көрсету", "Показать полное решение", "Show full solution")) + "</button>";
    }
    h += "</div>";
    for (var i = 0; i < Sv.hints; i++) h += '<div class="fb"><p><b>' + L("Кеңес ", "Подсказка ", "Hint ") + (i + 1) + ".</b> " + esc(c.t.hints[i](c.p, LANG)) + "</p></div>";
    var last = Sv.attempts[Sv.attempts.length - 1];
    if (last) h += feedbackS(last, c);
    if (Sv.shown) h += '<div class="fb"><p><b>' + L("Толық шешім", "Полное решение", "Full solution") + '</b></p><ol class="sol-list">' + c.t.solution(c.p, LANG).map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") + "</ol></div>";
    if (Sv.done) h += nextBtn();
    return h;
  }
  function feedbackS(a, c) {
    var msg, ok = a.status === "ok";
    if (ok) msg = L("Дұрыс! Келесі кезеңде нәтижені тексеріңіз.", "Верно! На следующем этапе проверьте результат.", "Correct! Check the result in the next stage.");
    else if (a.status === "nan") msg = L("Санды дұрыс енгізіңіз (үтір де, нүкте де болады).", "Введите число правильно (можно с запятой или точкой).", "Enter a valid number (comma or dot both work).");
    else if (a.status === "unit") msg = L("Бірлік ізделетін шамаға сәйкес келмейді. Не табу керек екенін еске түсіріңіз.", "Единица не соответствует искомой величине. Вспомните, что нужно найти.", "That unit does not match the quantity you are looking for. Recall what must be found.");
    else if (a.status === "sign") msg = L("Таңба қате: бұл шама оң болуы керек.", "Неверный знак: эта величина должна быть положительной.", "Wrong sign: this quantity must be positive.");
    else if (a.status === "mistake") msg = T3(a.mistake);
    else if (a.status === "scale") msg = L("Сан 60 не 1000 есе ерекшеленеді — бірліктерді айналдыруды тексеріңіз.", "Число отличается в 60 или 1000 раз — проверьте перевод единиц.", "The number is off by a factor of 60 or 1000 — check your unit conversion.");
    else msg = (a.high ? L("Жауап тым үлкен.", "Ответ слишком большой.", "The answer is too large.") : L("Жауап тым кіші.", "Ответ слишком маленький.", "The answer is too small.")) + " " + L("Қадамдарды қайта қараңыз немесе кеңес алыңыз.", "Пересмотрите шаги или возьмите подсказку.", "Go back over your steps or take a hint.");
    return '<div class="fb ' + (ok ? "ok" : "bad") + '" role="status"><p>' + (ok ? '<span class="mark-ok">✓</span> ' : '<span class="mark-bad">✗</span> ') + esc(msg) + "</p>" +
      (!ok ? '<p class="muted small">' + L("Әрекет: ", "Попытка: ", "Attempt: ") + cur.s.attempts.length + "</p>" : "") + "</div>";
  }
  // 5. Проверка по правилам.
  function stCheck(c) {
    var C = cur.c, h = head(4, L("Жауапқа сенуге бола ма? Төмендегі сұрақтарға жауап беріп, нәтижені тексеріңіз.", "Можно ли доверять ответу? Ответьте на вопросы ниже и проверьте результат.", "Can you trust the answer? Answer the questions below to check the result."));
    h += '<div class="fb"><p>' + L("<b>ИИ-тәлімгер қосылмаған.</b> Бұл кезеңде тексеру алдын ала дайындалған ережелермен жүргізіледі.", "<b>ИИ-наставник не подключён.</b> На этом этапе проверка идёт по заранее подготовленным правилам.", "<b>The AI tutor is not connected.</b> In this stage checking uses prepared rules.") + "</p></div>";
    c.t.checks.forEach(function (q, i) {
      h += '<p class="q">' + (i + 1) + ". " + esc(T3(q.q)) + '</p><div class="yn">';
      [[true, L("Иә", "Да", "Yes")], [false, L("Жоқ", "Нет", "No")]].forEach(function (o) {
        var cls = C.checked ? (o[0] === q.a ? " right" : C.ans[i] === o[0] ? " wrong" : "") : "";
        h += '<label class="opt' + cls + '"><input type="radio" name="chk' + i + '" value="' + o[0] + '"' + (C.ans[i] === o[0] ? " checked" : "") + (C.checked ? " disabled" : "") + "><span>" + o[1] + "</span></label>";
      });
      h += "</div>";
      if (C.checked) h += '<p class="small muted" style="margin-top:6px">' + esc(T3(q.why)) + "</p>";
    });
    if (!C.checked) return h + '<div class="row"><button class="btn btn-primary" type="button" data-act="checkC">' + L("Тексеру", "Проверить", "Check") + "</button></div>";
    return h + nextBtn();
  }
  // 6. Критический анализ «решения ИИ».
  function stCritical(c) {
    var K = cur.k, h = head(5, L("Төменде ИИ ұсынған шешім. Оған сенуге бола ма? Формула, бірліктер, есептеу, деректер дұрыс па?", "Ниже — решение, предложенное ИИ. Можно ли ему доверять? Верны ли формула, единицы, вычисления, данные?", "Below is a solution proposed by an AI. Can you trust it? Are the formula, units, arithmetic and data right?"));
    h += '<div class="ai-sol"><p class="tag">' + L("ИИ шешімі · оқу мақсатында дайындалған мысал", "Решение ИИ · учебный пример, подготовленный заранее", "AI solution · a prepared teaching example") + "</p><ol>" +
      c.ai.text(LANG).map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") + "</ol></div>";
    h += '<p class="q">' + L("Сіздің бағаңыз:", "Ваша оценка:", "Your verdict:") + '</p><div class="yn">';
    [["ok", L("Шешім дұрыс", "Решение верное", "The solution is correct")], ["err", L("Шешімде қате бар", "В решении есть ошибка", "The solution has an error")]].forEach(function (o) {
      h += '<label class="opt"><input type="radio" name="verdict" value="' + o[0] + '"' + (K.verdict === o[0] ? " checked" : "") + (K.checked ? " disabled" : "") + "><span>" + o[1] + "</span></label>";
    });
    h += "</div>";
    if (K.verdict === "err") {
      h += '<p class="q">' + L("Қатенің түрі:", "Тип ошибки:", "Type of error:") + '</p><select id="ctErrType"' + (K.checked ? " disabled" : "") + '><option value="">—</option>' +
        Object.keys(E.ERRORS).filter(function (k) { return k !== "none"; }).map(function (k) { return '<option value="' + k + '"' + (K.type === k ? " selected" : "") + ">" + esc(T3(E.ERRORS[k])) + "</option>"; }).join("") + "</select>";
    }
    h += '<p class="q">' + L("Дәлеліңіз (неге солай ойлайсыз?):", "Ваш аргумент (почему вы так считаете?):", "Your argument (why do you think so?):") + "</p>";
    h += '<textarea id="ctExpl"' + (K.checked ? " readonly" : "") + ">" + esc(K.expl) + "</textarea>";
    if (!K.checked) return h + '<div class="row"><button class="btn btn-primary" type="button" data-act="checkK">' + L("Тексеру", "Проверить", "Check") + '</button><span class="muted small" id="ctKHint"></span></div>';
    var good = K.verdictOk && (c.ai.type === "none" || K.typeOk);
    h += '<div class="fb ' + (good ? "ok" : "bad") + '"><p>' + mark(K.verdictOk) + " " +
      (c.ai.type === "none" ? L("Бұл шешім дұрыс еді.", "Это решение было верным.", "This solution was correct.") : L("Бұл шешімде қате бар: ", "В этом решении есть ошибка: ", "This solution has an error: ") + "<b>" + esc(T3(E.ERRORS[c.ai.type])) + "</b>.") +
      (c.ai.type !== "none" && K.verdict === "err" ? " " + mark(K.typeOk) + L(" қатенің түрі", " тип ошибки", " error type") : "") + "</p>" +
      "<p><b>" + L("Эталон шешім:", "Эталонное решение:", "Reference solution:") + '</b></p><ol class="sol-list">' + c.t.solution(c.p, LANG).map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") + "</ol>" +
      '<p class="muted small">' + L("Дәлеліңіз автоматты түрде бағаланбайды — оны мұғалім қарайды.", "Ваш аргумент не оценивается автоматически — его посмотрит учитель.", "Your argument is not scored automatically; the teacher will review it.") + "</p></div>";
    return h + nextBtn();
  }
  // 7. Рефлексия.
  var RQ = [
    ["q1", ["Осы тапсырмадан кейін не түсіндім?", "Что я понял после выполнения задания?", "What did I understand after this task?"]],
    ["q2", ["Қандай қате жібердім немесе қай жерде қиналдым?", "Какую ошибку я допустил или где было трудно?", "What mistake did I make, or where did I struggle?"]],
    ["q3", ["Келесі есепте не істеймін басқаша?", "Что я сделаю по-другому в следующей задаче?", "What will I do differently in the next problem?"]],
    ["q4", ["Шарт өзгерсе (мысалы, температура не концентрация), жауап қалай өзгерер еді?", "Как изменился бы ответ при других условиях (например, температуре или концентрации)?", "How would the answer change under different conditions (e.g. temperature or concentration)?"]]
  ];
  function stReflect() {
    var h = head(6, L("Жауаптарыңыз зерттеу үшін өзгеріссіз сақталады. Дұрыс не бұрыс жауап жоқ — өз ойыңызды жазыңыз.", "Ответы сохраняются без изменений для исследования. Правильных и неправильных ответов нет — пишите своё мнение.", "Your answers are saved unchanged for the research. There are no right or wrong answers; write what you think."));
    RQ.forEach(function (q) {
      h += '<p class="q"><label for="ct_' + q[0] + '">' + esc(T3(q[1])) + "</label></p>" + '<textarea id="ct_' + q[0] + '" data-refl="' + q[0] + '">' + esc(cur.r[q[0]]) + "</textarea>";
    });
    return h + '<div class="row"><button class="btn btn-primary" type="button" data-act="finish">' + L("Аяқтау және сақтау", "Завершить и сохранить", "Finish and save") + '</button><span class="muted small" id="ctRHint"></span></div>';
  }

  /* ---------- Предварительная автоматическая оценка ---------- */
  function autoScore(c) {
    var f = cur.a.first, Sv = cur.s, k3;
    if (!Sv.correct) k3 = Sv.attempts.length ? (Sv.shown ? 1 : 0) : 0;
    else if (Sv.shown) k3 = 1;
    else if (Sv.hintsAtCorrect === 0) k3 = Sv.attempts.length <= 2 ? 4 : 3;
    else k3 = Sv.hintsAtCorrect === 1 ? 3 : 2;
    var k4 = (cur.c.ok ? 1 : 0) + (cur.k.verdictOk ? 1 : 0) + ((c.ai.type === "none" ? cur.k.verdictOk : cur.k.typeOk) ? 1 : 0);
    return {
      K1: (f.unknown ? 1 : 0) + (f.givens ? 1 : 0) + (f.distractor ? 1 : 0) + (f.convert ? 1 : 0),
      K2: cur.m.first === c.t.method ? 2 : 0,
      K3: k3, K4: k4, K5: null,
      max: { K1: 4, K2: 2, K3: 4, K4: 3, K5: 0 }
    };
  }
  function renderSummary(c) {
    var a = cur.auto, rows = [
      ["K1", ["Ақпаратты талдау", "Анализ информации", "Analysing information"], ["Толық автоматты (1-кезеңнің бірінші жауабы).", "Полностью автоматически (первый ответ этапа 1).", "Fully automatic (first answer in stage 1)."]],
      ["K2", ["Стратегияны таңдау және негіздеу", "Выбор и обоснование стратегии", "Choosing and justifying a strategy"], ["Автоматты — тек әдісті таңдау; негіздемені мұғалім бағалайды (+2).", "Автоматически — только выбор метода; обоснование оценивает учитель (+2).", "Automatic for the method choice only; the teacher scores the justification (+2)."]],
      ["K3", ["Пайымдау логикасы", "Логика рассуждений", "Logic of reasoning"], ["Алдын ала: дұрыстық пен дербестік бойынша; жазбаны мұғалім қарайды.", "Предварительно: по правильности и самостоятельности; запись хода решения смотрит учитель.", "Preliminary: based on correctness and independence; the teacher reviews the working."]],
      ["K4", ["Нәтижені тексеру", "Проверка результата", "Checking the result"], ["Автоматты — тексеру сұрақтары мен ИИ шешімін бағалау; дәлелді мұғалім бағалайды (+1).", "Автоматически — вопросы проверки и оценка решения ИИ; аргумент оценивает учитель (+1).", "Automatic for the check questions and the AI verdict; the teacher scores the argument (+1)."]],
      ["K5", ["Рефлексия", "Рефлексия", "Reflection"], ["Тек мұғалім бағалайды.", "Оценивает только учитель.", "Scored by the teacher only."]]
    ];
    var h = "<h2>" + L("Есеп аяқталды", "Задача завершена", "Problem complete") + '</h2><p class="lead">' + L("Төменде — алдын ала автоматты бағалау. Бұл зерттеу бағасы емес: ашық жауаптарды мұғалім рубрика бойынша бағалайды.", "Ниже — предварительная автоматическая оценка. Это не исследовательская оценка: открытые ответы оценивает учитель по рубрике.", "Below is a preliminary automatic score. It is not a research score: open answers are scored by the teacher using the rubric.") + "</p>";
    h += '<div class="table-wrap"><table class="score-table"><thead><tr><th>' + L("Критерий", "Критерий", "Criterion") + "</th><th>" + L("Авто", "Авто", "Auto") + "</th><th>" + L("Макс. авто", "Макс. авто", "Max auto") + "</th><th>" + L("Ескерту", "Примечание", "Note") + "</th></tr></thead><tbody>";
    rows.forEach(function (r) {
      h += "<tr><td><b>" + r[0] + "</b> " + esc(T3(r[1])) + "</td><td>" + (a[r[0]] == null ? "—" : a[r[0]]) + "</td><td>" + a.max[r[0]] + " / 4</td><td class=\"small muted\" style=\"text-align:left;white-space:normal\">" + esc(T3(r[2])) + "</td></tr>";
    });
    h += "</tbody></table></div>";
    h += '<div class="row"><button class="btn btn-primary" type="button" data-act="again">' + L("Жаңа есеп", "Новая задача", "New problem") + '</button><a class="btn" href="../research/">' + L("Рубрика туралы", "О рубрике", "About the rubric") + "</a></div>";
    return h;
  }
  function mark(ok) { return ok ? '<span class="mark-ok">✓</span>' : '<span class="mark-bad">✗</span>'; }

  /* ---------- Обработчики ---------- */
  function bindStage(c) {
    var box = $("ctStage");
    box.querySelectorAll("[data-given]").forEach(function (el) { el.addEventListener("change", function () { cur.a.sel[el.getAttribute("data-given")] = el.checked; save(); }); });
    box.querySelectorAll('input[name="unk"]').forEach(function (el) { el.addEventListener("change", function () { cur.a.unknown = el.value; save(); }); });
    box.querySelectorAll('input[name="conv"]').forEach(function (el) { el.addEventListener("change", function () { cur.a.convert = el.value === "true"; save(); }); });
    box.querySelectorAll('input[name="meth"]').forEach(function (el) { el.addEventListener("change", function () { cur.m.choice = el.value; save(); }); });
    box.querySelectorAll('input[name^="chk"]').forEach(function (el) { el.addEventListener("change", function () { cur.c.ans[el.name.slice(3)] = el.value === "true"; save(); }); });
    box.querySelectorAll('input[name="verdict"]').forEach(function (el) { el.addEventListener("change", function () { cur.k.verdict = el.value; save(); render(); }); });
    var map = { ctJust: ["m", "just"], ctWork: ["s", "work"], ctAns: ["s", "value"], ctExpl: ["k", "expl"] };
    Object.keys(map).forEach(function (id) {
      var el = $(id);
      if (el) el.addEventListener("input", function () { cur[map[id][0]][map[id][1]] = el.value; save(); });
    });
    if ($("ctUnit")) $("ctUnit").addEventListener("change", function () { cur.s.unit = $("ctUnit").value; save(); });
    if ($("ctErrType")) $("ctErrType").addEventListener("change", function () { cur.k.type = $("ctErrType").value; save(); });
    box.querySelectorAll("[data-refl]").forEach(function (el) { el.addEventListener("input", function () { cur.r[el.getAttribute("data-refl")] = el.value; save(); }); });
    if ($("ctAns")) $("ctAns").addEventListener("keydown", function (e) { if (e.key === "Enter") act("checkS", c); });
    box.querySelectorAll("[data-act]").forEach(function (b) { b.addEventListener("click", function () { act(b.getAttribute("data-act"), c); }); });
  }
  function need(id, msg) { var el = $(id); if (el) el.textContent = msg; }
  function go(stage) { cur.stage = stage; save(); render(); try { $("ctProblem").scrollIntoView({ block: "start", behavior: reducedMotion() ? "auto" : "smooth" }); } catch (e) {} }
  function act(a, c) {
    if (a === "checkA") {
      var A = cur.a, gv = c.t.givens(c.p, LANG);
      if (A.unknown == null || A.convert == null) return alertStage(L("Ізделетін шаманы және бірліктер туралы жауапты таңдаңыз.", "Выберите искомую величину и ответ про единицы.", "Choose the unknown and answer the units question."));
      A.first = {
        unknown: A.unknown === c.unk,
        givens: gv.every(function (g) { return !g.relevant || !!A.sel[g.id]; }),
        distractor: gv.every(function (g) { return g.relevant || !A.sel[g.id]; }),
        convert: A.convert === c.t.convert(c.p)
      };
      A.checked = true; save(); render();
    } else if (a === "next") {
      if (cur.stage === 1 && !cur.m.choice) return alertStage(L("Әдісті таңдаңыз.", "Выберите метод.", "Choose a method."));
      if (cur.stage === 1 && cur.m.first == null) cur.m.first = cur.m.choice;
      go(cur.stage + 1);
    } else if (a === "checkM") {
      if ((cur.m.just || "").trim().length < 15) return need("ctJustHint", L("Кемінде бір толық сөйлем жазыңыз.", "Напишите хотя бы одно полное предложение.", "Write at least one full sentence."));
      cur.m.checked = true; save(); render();
    } else if (a === "changeM") {
      cur.m.checked = false; cur.m.changes++; cur.m.choice = null; go(1);
    } else if (a === "checkS") {
      var r = E.check(cur.template, c.p, cur.s.value, cur.s.unit);
      cur.s.attempts.push({ value: cur.s.value, unit: cur.s.unit, status: r.status, mistake: r.mistake ? r.mistake.id : null, hints: cur.s.hints, at: new Date().toISOString() });
      if (r.status === "ok") { cur.s.done = true; cur.s.correct = true; cur.s.hintsAtCorrect = cur.s.hints; }
      if (r.mistake) cur.s.attempts[cur.s.attempts.length - 1].mistake = r.mistake.id;
      if (r.status === "mistake") cur.s.attempts[cur.s.attempts.length - 1].mistakeMsg = r.mistake.msg;
      save(); render();
    } else if (a === "hint") {
      if (cur.s.hints < 2) cur.s.hints++;
      else { cur.s.shown = true; cur.s.done = true; }
      save(); render();
    } else if (a === "checkC") {
      var all = c.t.checks.every(function (q, i) { return cur.c.ans[i] != null; });
      if (!all) return alertStage(L("Барлық сұрақтарға жауап беріңіз.", "Ответьте на все вопросы.", "Answer all the questions."));
      cur.c.ok = c.t.checks.every(function (q, i) { return cur.c.ans[i] === q.a; });
      cur.c.checked = true; save(); render();
    } else if (a === "checkK") {
      var K = cur.k;
      if (!K.verdict) return need("ctKHint", L("Бағаңызды таңдаңыз.", "Выберите оценку.", "Choose a verdict."));
      if (K.verdict === "err" && !K.type) return need("ctKHint", L("Қатенің түрін таңдаңыз.", "Выберите тип ошибки.", "Choose the error type."));
      if ((K.expl || "").trim().length < 10) return need("ctKHint", L("Дәлеліңізді жазыңыз.", "Запишите аргумент.", "Write down your argument."));
      K.verdictOk = (K.verdict === "ok") === (c.ai.type === "none");
      K.typeOk = c.ai.type !== "none" && K.verdict === "err" && K.type === c.ai.type;
      K.checked = true; save(); render();
    } else if (a === "finish") {
      var empty = RQ.some(function (q) { return (cur.r[q[0]] || "").trim().length < 3; });
      if (empty) return need("ctRHint", L("Әр сұраққа қысқа болса да жауап жазыңыз.", "Ответьте на каждый вопрос, хотя бы коротко.", "Answer each question, even briefly."));
      cur.finished = new Date().toISOString();
      cur.auto = autoScore(c);
      var hist = load(KEY_HIST, []);
      hist.unshift(record(c));
      store(KEY_HIST, JSON.stringify(hist.slice(0, 300)));
      save(); render(); renderHistory();
    } else if (a === "again") {
      newProblem();
    }
  }
  function alertStage(msg) {
    var box = $("ctStage"), old = box.querySelector(".fb.warn");
    if (old) old.remove();
    var d = document.createElement("div");
    d.className = "fb bad warn"; d.setAttribute("role", "alert"); d.textContent = msg;
    box.appendChild(d);
  }
  function record(c) {
    return {
      kind: "problem", id: cur.id, template: cur.template, level: cur.level, seed: cur.seed, version: cur.version, lang: LANG,
      started: cur.started, finished: cur.finished,
      analysis: { selected: cur.a.sel, unknown: cur.a.unknown, convert: cur.a.convert, first: cur.a.first },
      method: { first: cur.m.first, final: cur.m.choice, expected: c.t.method, changes: cur.m.changes, justification: cur.m.just },
      solve: { work: cur.s.work, attempts: cur.s.attempts, hints: cur.s.hints, solutionShown: cur.s.shown, correct: cur.s.correct },
      check: { answers: cur.c.ans, allCorrect: cur.c.ok },
      critical: { aiErrorType: c.ai.type, verdict: cur.k.verdict, errorType: cur.k.type, argument: cur.k.expl, verdictOk: cur.k.verdictOk, typeOk: cur.k.typeOk },
      reflection: cur.r, auto: cur.auto, teacherReview: null
    };
  }

  /* ---------- Режим «Проверь ответ ИИ» ---------- */
  var cl = { order: shuffled(E.CLAIMS.map(function (x, i) { return i; }), (Math.random() * 1e9) >>> 0), i: 0, verdict: null, type: "", expl: "", checked: false };
  function renderClaim() {
    var box = $("claimBox"), c = E.CLAIMS[cl.order[cl.i]];
    var h = '<p class="muted small">' + L("Тұжырым ", "Утверждение ", "Statement ") + (cl.i + 1) + " / " + E.CLAIMS.length + "</p>";
    h += '<div class="ai-sol" style="margin:8px 0 14px"><p class="tag">' + L("ИИ айтты", "ИИ утверждает", "The AI says") + "</p><p>" + esc(T3(c.c)) + "</p></div>";
    h += '<div class="yn">' + [["ok", L("Дұрыс", "Верно", "Correct")], ["err", L("Қате бар", "Есть ошибка", "There is an error")]].map(function (o) {
      return '<label class="opt"><input type="radio" name="clv" value="' + o[0] + '"' + (cl.verdict === o[0] ? " checked" : "") + (cl.checked ? " disabled" : "") + "><span>" + o[1] + "</span></label>";
    }).join("") + "</div>";
    if (cl.verdict === "err") h += '<p class="q">' + L("Қатенің түрі:", "Тип ошибки:", "Type of error:") + '</p><select id="clType"' + (cl.checked ? " disabled" : "") + '><option value="">—</option>' +
      Object.keys(E.ERRORS).filter(function (k) { return k !== "none"; }).map(function (k) { return '<option value="' + k + '"' + (cl.type === k ? " selected" : "") + ">" + esc(T3(E.ERRORS[k])) + "</option>"; }).join("") + "</select>";
    h += '<p class="q">' + L("Ғылыми дәлеліңіз және дұрыс тұжырым:", "Ваш научный аргумент и верный вывод:", "Your scientific argument and the correct conclusion:") + '</p><textarea id="clExpl"' + (cl.checked ? " readonly" : "") + ">" + esc(cl.expl) + "</textarea>";
    if (!cl.checked) h += '<div class="row"><button class="btn btn-primary" type="button" id="clCheck">' + L("Тексеру", "Проверить", "Check") + '</button><span class="muted small" id="clHint"></span></div>';
    else {
      var vOk = (cl.verdict === "ok") === c.ok, tOk = c.ok || cl.type === c.type;
      h += '<div class="fb ' + (vOk && tOk ? "ok" : "bad") + '"><p>' + mark(vOk) + " " + (c.ok ? L("Тұжырым дұрыс.", "Утверждение верно.", "The statement is correct.") : L("Тұжырымда қате бар: ", "В утверждении ошибка: ", "The statement contains an error: ") + "<b>" + esc(T3(E.ERRORS[c.type])) + "</b>.") + "</p><p>" + esc(T3(c.ref)) + '</p><p class="muted small">' +
        L("Сіздің дәлеліңіз басқаша тұжырымдалуы мүмкін — оны мұғалім қарайды.", "Ваш аргумент может быть сформулирован иначе — его посмотрит учитель.", "Your argument may be worded differently; the teacher will review it.") + "</p></div>";
      h += '<div class="row"><button class="btn btn-primary" type="button" id="clNext">' + (cl.i < E.CLAIMS.length - 1 ? L("Келесі тұжырым →", "Следующее утверждение →", "Next statement →") : L("Басынан бастау", "Начать сначала", "Start again")) + "</button></div>";
    }
    box.innerHTML = h;
    box.querySelectorAll('input[name="clv"]').forEach(function (el) { el.addEventListener("change", function () { cl.verdict = el.value; renderClaim(); }); });
    if ($("clType")) $("clType").addEventListener("change", function () { cl.type = $("clType").value; });
    $("clExpl").addEventListener("input", function () { cl.expl = $("clExpl").value; });
    if ($("clCheck")) $("clCheck").addEventListener("click", function () {
      if (!cl.verdict) return need("clHint", L("Бағаңызды таңдаңыз.", "Выберите оценку.", "Choose a verdict."));
      if (cl.verdict === "err" && !cl.type) return need("clHint", L("Қатенің түрін таңдаңыз.", "Выберите тип ошибки.", "Choose the error type."));
      if (cl.expl.trim().length < 10) return need("clHint", L("Дәлеліңізді жазыңыз.", "Запишите аргумент.", "Write down your argument."));
      cl.checked = true;
      var hist = load(KEY_HIST, []);
      hist.unshift({ kind: "claim", id: rid(), claim: cl.order[cl.i], expectedOk: c.ok, expectedType: c.type, verdict: cl.verdict, errorType: cl.type, argument: cl.expl,
        verdictOk: (cl.verdict === "ok") === c.ok, typeOk: c.ok || cl.type === c.type, lang: LANG, finished: new Date().toISOString(), teacherReview: null });
      store(KEY_HIST, JSON.stringify(hist.slice(0, 300)));
      renderClaim(); renderHistory();
    });
    if ($("clNext")) $("clNext").addEventListener("click", function () {
      cl.i = (cl.i + 1) % E.CLAIMS.length; cl.verdict = null; cl.type = ""; cl.expl = ""; cl.checked = false; renderClaim();
    });
  }

  /* ---------- История и экспорт ---------- */
  function renderHistory() {
    var hist = load(KEY_HIST, []), box = $("historyBox");
    if (!hist.length) { box.innerHTML = '<p class="empty">' + L("Әзірге нәтиже жоқ.", "Результатов пока нет.", "No results yet.") + "</p>"; return; }
    var h = '<div class="table-wrap"><table class="hist"><thead><tr><th>' + [L("Күні", "Дата", "Date"), L("Түрі", "Тип", "Type"), L("Тапсырма", "Задание", "Task"), "K1", "K2", "K3", "K4", L("Жауап", "Ответ", "Answer"), L("Кеңес", "Подсказки", "Hints")].join("</th><th>") + "</th></tr></thead><tbody>";
    hist.forEach(function (r) {
      var ds = r.finished ? r.finished.slice(0, 10) + " " + new Date(r.finished).toTimeString().slice(0, 5) : "—";
      if (r.kind === "problem") h += "<tr><td>" + ds + "</td><td>" + L("Есеп", "Задача", "Problem") + "</td><td>" + esc(r.template) + " · " + r.level + "</td><td>" + r.auto.K1 + "</td><td>" + r.auto.K2 + "</td><td>" + r.auto.K3 + "</td><td>" + r.auto.K4 + "</td><td>" + mark(r.solve.correct) + "</td><td>" + r.solve.hints + (r.solve.solutionShown ? "+" : "") + "</td></tr>";
      else h += "<tr><td>" + ds + "</td><td>" + L("ИИ тұжырымы", "Утверждение ИИ", "AI claim") + "</td><td>#" + (r.claim + 1) + '</td><td colspan="4">' + mark(r.verdictOk) + " " + L("баға", "оценка", "verdict") + " · " + mark(r.typeOk) + " " + L("түрі", "тип", "type") + "</td><td>—</td><td>—</td></tr>";
    });
    box.innerHTML = h + "</tbody></table></div>";
  }
  function download(name, text, type) {
    try {
      var blob = new Blob([text], { type: type }), a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = name;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
    } catch (e) { console.error(e); }
  }
  function csvCell(v) { var s = v == null ? "" : typeof v === "object" ? JSON.stringify(v) : String(v); return /[",\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }
  function toCSV(hist) {
    var cols = ["kind", "id", "finished", "lang", "template", "level", "seed", "version", "K1_auto", "K2_auto", "K3_auto", "K4_auto", "answer_correct", "attempts", "hints", "solution_shown",
      "method_first", "method_expected", "justification", "work", "ai_error_type", "verdict", "verdict_ok", "error_type", "type_ok", "argument", "refl_q1", "refl_q2", "refl_q3", "refl_q4"];
    var lines = [cols.join(",")];
    hist.forEach(function (r) {
      var p = r.kind === "problem";
      var v = p ? [r.kind, r.id, r.finished, r.lang, r.template, r.level, r.seed, r.version, r.auto.K1, r.auto.K2, r.auto.K3, r.auto.K4, r.solve.correct, r.solve.attempts.length, r.solve.hints, r.solve.solutionShown,
        r.method.first, r.method.expected, r.method.justification, r.solve.work, r.critical.aiErrorType, r.critical.verdict, r.critical.verdictOk, r.critical.errorType, r.critical.typeOk, r.critical.argument,
        r.reflection.q1, r.reflection.q2, r.reflection.q3, r.reflection.q4]
        : [r.kind, r.id, r.finished, r.lang, "claim_" + (r.claim + 1), "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", r.expectedOk ? "none" : r.expectedType, r.verdict, r.verdictOk, r.errorType, r.typeOk, r.argument, "", "", "", ""];
      lines.push(v.map(csvCell).join(","));
    });
    return "﻿" + lines.join("\r\n");
  }

  /* ---------- Вкладки и запуск ---------- */
  var tabs = [["tabProblem", "paneProblem"], ["tabClaims", "paneClaims"], ["tabHistory", "paneHistory"]];
  tabs.forEach(function (t) {
    $(t[0]).addEventListener("click", function () {
      tabs.forEach(function (u) { $(u[0]).setAttribute("aria-selected", String(u === t)); $(u[1]).hidden = u !== t; });
    });
  });
  $("ctNew").addEventListener("click", newProblem);
  $("hCsv").addEventListener("click", function () { download("nurserik-ct-results.csv", toCSV(load(KEY_HIST, [])), "text/csv;charset=utf-8"); });
  $("hJson").addEventListener("click", function () { download("nurserik-ct-results.json", JSON.stringify(load(KEY_HIST, []), null, 2), "application/json"); });
  var clearArmed = 0;
  $("hClear").addEventListener("click", function () {
    var b = $("hClear");
    if (Date.now() - clearArmed > 4000) {
      clearArmed = Date.now();
      b.textContent = L("Растау: бәрін өшіру", "Подтвердить: удалить всё", "Confirm: delete everything");
      setTimeout(function () { if (Date.now() - clearArmed >= 4000) b.textContent = L("Тарихты тазалау", "Очистить историю", "Clear history"); }, 4100);
      return;
    }
    clearArmed = 0;
    store(KEY_HIST, "[]");
    b.textContent = L("Тарихты тазалау", "Очистить историю", "Clear history");
    renderHistory();
  });

  cur = load(KEY_CUR, null);
  if (cur && (!E.byId(cur.template) || cur.version !== E.VERSION)) cur = null;
  render();
  renderClaim();
  renderHistory();
  onLang(function () { render(); renderClaim(); renderHistory(); });
});
