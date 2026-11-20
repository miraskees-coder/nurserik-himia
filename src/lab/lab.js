/* ================= Виртуальная лаборатория: каталог и шаблон работы =================
   Зависит от site.js (L, LANG, $, safe, store, onLang, fmt, reducedMotion), models.js, labs.js (NCLabs). */
safe("lab", function () {
  var M = NCLabModels, LABS = NCLabs.list, PLANNED = NCLabs.planned;
  var STAGES = [["Дайындық", "Подготовка", "Preparation"], ["Болжам", "Прогноз", "Prediction"], ["Тәжірибе", "Опыт", "Experiment"],
    ["Талдау", "Анализ", "Analysis"], ["Қорытынды", "Вывод", "Conclusion"], ["Нәтиже", "Результат", "Result"]];
  function T3(a) { return a ? L(a[0], a[1], a[2]) : ""; }
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function load(k, d) { try { var v = JSON.parse(store(k) || "null"); return v == null ? d : v; } catch (e) { return d; } }
  function byId(id) { for (var i = 0; i < LABS.length; i++) if (LABS[i].id === id) return LABS[i]; return null; }
  function param() { try { return new URLSearchParams(location.search).get("lab"); } catch (e) { var m = /[?&]lab=([^&]+)/.exec(location.search); return m && decodeURIComponent(m[1]); } }
  function fmtN(x, d) { return fmt(x, d == null ? 3 : d); }
  function parseNum(v) {
    var s = String(v == null ? "" : v).trim().replace(/[\s ]/g, "").replace(/−/g, "-").replace(",", ".");
    s = s.replace(/[·x×*]10\^?(-?\d+)$/i, "e$1");
    return /^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(s) ? parseFloat(s) : NaN;
  }
  function gradeLabel(g) { return g + L(" сынып", " класс", " grade"); }

  var lab = byId(param()), st = null;

  /* ================= Каталог ================= */
  function statusOf(id) {
    var s = load("nc-lab-" + id, null), h = load("nc-lab-history", []);
    if (s && !s.finished && (s.stage > 0 || (s.runs && s.runs.length))) return "progress";
    if (h.some(function (r) { return r.lab === id; })) return "done";
    return "new";
  }
  var STATUS = { "new": ["Басталмаған", "Не начата", "Not started"], progress: ["Орындалуда", "В процессе", "In progress"], done: ["Аяқталған", "Завершена", "Completed"] };
  var KIND = { lab: ["Зертханалық жұмыс", "Лабораторная работа", "Lab work"], data: ["Деректерді талдау", "Анализ данных", "Data analysis"], research: ["Зерттеу", "Исследование", "Investigation"] };
  var LEVEL = { base: ["Негізгі", "Базовый", "Basic"], adv: ["Жоғары", "Повышенный", "Advanced"], res: ["Зерттеушілік", "Исследовательский", "Research"] };
  var flt = { grade: "", kind: "", level: "", status: "", q: "" };

  function renderCatalog() {
    $("labRunner").hidden = true;
    $("labCatalog").hidden = false;
    var list = LABS.filter(function (l) {
      if (flt.grade && String(l.grade) !== flt.grade) return false;
      if (flt.kind && l.kind !== flt.kind) return false;
      if (flt.level && l.level !== flt.level) return false;
      if (flt.status && statusOf(l.id) !== flt.status) return false;
      if (flt.q) { var hay = [l.title, l.topic, l.goal].map(function (t) { return t.join(" "); }).join(" ").toLowerCase(); if (hay.indexOf(flt.q.toLowerCase()) < 0) return false; }
      return true;
    });
    var done = LABS.filter(function (l) { return statusOf(l.id) === "done"; }).length;
    $("labProgress").innerHTML = L("Аяқталған жұмыстар: ", "Завершено работ: ", "Labs completed: ") + "<b>" + done + " / " + LABS.length + "</b> " +
      '<span class="muted small">' + L("(осы браузерде)", "(в этом браузере)", "(in this browser)") + "</span>";
    $("labGrid").innerHTML = list.length ? list.map(function (l, i) {
      var s = statusOf(l.id);
      return '<article class="card lab-card"><div class="lab-card-top"><span class="lab-no">' + esc(l.no) + '</span><span class="chip">' + gradeLabel(l.grade) + "</span></div>" +
        "<h3>" + esc(T3(l.title)) + "</h3>" + '<p class="muted small">' + esc(T3(l.topic)) + "</p>" +
        '<div class="course-meta"><span class="chip">' + esc(T3(KIND[l.kind])) + '</span><span class="chip">' + esc(T3(LEVEL[l.level])) + '</span><span class="chip">≈ ' + l.minutes + L(" мин", " мин", " min") + "</span></div>" +
        '<div class="lab-card-foot"><span class="status st-' + (s === "done" ? "ok" : s === "progress" ? "part" : "dev") + '">' + esc(T3(STATUS[s])) + "</span>" +
        '<a class="btn btn-primary" href="?lab=' + l.id + '">' + (s === "progress" ? L("Жалғастыру", "Продолжить", "Continue") : L("Бастау", "Начать", "Start")) + "</a></div></article>";
    }).join("") : '<p class="empty">' + L("Сүзгіге сәйкес жұмыс жоқ.", "Нет работ, подходящих под фильтр.", "No labs match the filter.") + "</p>";
    $("labPlanned").innerHTML = PLANNED.map(function (g) {
      return "<div><h3>" + gradeLabel(g.grade) + "</h3><ul>" + g.items.map(function (t) { return "<li>" + esc(T3(t)) + "</li>"; }).join("") + "</ul></div>";
    }).join("");
  }
  function bindCatalog() {
    [["fGrade", "grade"], ["fKind", "kind"], ["fLevel", "level"], ["fStatus", "status"]].forEach(function (x) {
      $(x[0]).addEventListener("change", function () { flt[x[1]] = $(x[0]).value; renderCatalog(); });
    });
    $("fSearch").addEventListener("input", function () { flt.q = $("fSearch").value.trim(); renderCatalog(); });
  }

  /* ================= Состояние работы ================= */
  function fresh() {
    var p = {};
    lab.controls.forEach(function (c) { p[c.id] = c.value; });
    return { lab: lab.id, version: NCLabs.VERSION, stage: 0, visited: 0, started: new Date().toISOString(), params: p, runs: [],
      pred: { choice: null, text: "" }, answers: {}, checked: false, concl: { text: "", evidence: [] }, finished: null,
      dataSeed: (Math.random() * 4294967296) >>> 0, data: {} };
  }
  function save() { store("nc-lab-" + lab.id, JSON.stringify(st)); }
  function simulate(p) { return lab.simulate(p); }

  /* ================= Отрисовка работы ================= */
  function renderRunner() {
    $("labCatalog").hidden = true;
    $("labRunner").hidden = false;
    document.title = T3(lab.title) + " — NURSERIK CHEMISTRY";
    var idx = LABS.indexOf(lab);
    $("labHead").innerHTML = '<a class="back" href="./">← ' + L("Барлық жұмыстар", "Все работы", "All labs") + "</a>" +
      '<div class="lab-title-row"><div><p class="eyebrow">' + esc(lab.no) + " · " + lab.grade + L(" сынып", " класс", " grade") + " · " + esc(T3(lab.topic)) + "</p><h1>" + esc(T3(lab.title)) + "</h1></div>" +
      '<button class="btn" type="button" id="demoBtn" aria-pressed="' + demoOn() + '">' + L("Сабақта көрсету", "Демонстрация на уроке", "Classroom demo") + ' <kbd>D</kbd></button></div>';
    $("demoBtn").addEventListener("click", function () { setDemo(!demoOn()); });
    $("labSteps").innerHTML = STAGES.map(function (s, i) {
      var cls = i < st.stage || st.finished ? "done" : i === st.stage ? "now" : "";
      var can = i <= st.visited;
      return '<li class="' + cls + '"><button type="button" data-goto="' + i + '"' + (can ? "" : " disabled") + (i === st.stage ? ' aria-current="step"' : "") + "><b>" + (i + 1) + "</b>" + esc(T3(s)) + "</button></li>";
    }).join("");
    $("labSteps").querySelectorAll("[data-goto]").forEach(function (b) { b.addEventListener("click", function () { go(+b.getAttribute("data-goto")); }); });
    var body = $("labBody");
    stopAnim();
    body.innerHTML = [stPrep, stPred, stRun, stAnalysis, stConcl, stResult][st.stage]();
    [bindPrep, bindPred, bindRun, bindAnalysis, bindConcl, bindResult][st.stage]();
    $("demoPrev").disabled = idx <= 0;
    $("demoNext").disabled = idx >= LABS.length - 1;
  }
  function go(i) { st.stage = i; st.visited = Math.max(st.visited, i); save(); renderRunner(); try { $("labHead").scrollIntoView({ block: "start" }); } catch (e) {} }
  function nextBtn(ok, why) {
    return '<div class="row"><button class="btn btn-primary" type="button" id="nextStage"' + (ok ? "" : " disabled") + ">" + L("Келесі кезең →", "Следующий этап →", "Next stage →") + "</button>" +
      (!ok && why ? '<span class="muted small">' + why + "</span>" : "") + "</div>";
  }
  function bindNext() { var b = $("nextStage"); if (b) b.addEventListener("click", function () { go(st.stage + 1); }); }

  // 1. Подготовка
  function stPrep() {
    return '<div class="grid g2"><div class="card prose"><h2>' + L("Мақсаты", "Цель", "Aim") + "</h2><p>" + esc(T3(lab.goal)) + "</p>" +
      "<h3>" + L("Қысқаша теория", "Кратко о теории", "Theory in brief") + "</h3>" + T3(lab.theory) + "</div>" +
      '<div class="stack-s"><div class="card prose"><h3>' + L("Виртуалды жабдық", "Виртуальное оборудование", "Virtual equipment") + "</h3><ul>" + lab.equipment.map(function (e) { return "<li>" + esc(T3(e)) + "</li>"; }).join("") + "</ul></div>" +
      '<div class="card prose safety"><h3>' + L("Қауіпсіздік", "Безопасность", "Safety") + "</h3>" + T3(lab.safety) + "</div>" +
      '<div class="card prose model-note"><h3>' + L("Модель туралы", "О модели", "About the model") + '</h3><p><span class="chip">' + esc(T3(lab.model.type)) + "</span></p><ul>" +
      lab.model.notes.map(function (n) { return "<li>" + T3(n) + "</li>"; }).join("") + "</ul></div></div></div>" + nextBtn(true);
  }
  function bindPrep() { bindNext(); }

  // 2. Прогноз
  function stPred() {
    var P = lab.prediction, h = '<div class="card"><h2>' + L("Болжам жасаңыз", "Сделайте прогноз", "Make a prediction") + '</h2><p class="lead muted">' +
      L("Тәжірибеге дейін жауап беріңіз. Дұрыс жауап тәжірибеден кейін ашылады.", "Ответьте до опыта. Правильный ответ откроется после эксперимента.", "Answer before the experiment. The right answer is revealed afterwards.") + "</p>" +
      '<p class="q">' + esc(T3(P.q)) + '</p><div class="opts">';
    P.opts.forEach(function (o, i) { h += '<label class="opt"><input type="radio" name="pred" value="' + i + '"' + (st.pred.choice === i ? " checked" : "") + "><span>" + esc(T3(o)) + "</span></label>"; });
    h += '</div><p class="q"><label for="predWhy">' + L("Неге солай ойлайсыз?", "Почему вы так думаете?", "Why do you think so?") + '</label></p><textarea id="predWhy">' + esc(st.pred.text) + "</textarea>";
    if (demoOn()) h += '<div class="row"><button class="btn" type="button" id="revealPred">' + L("Дұрыс жауапты көрсету", "Показать правильный ответ", "Show the right answer") + '</button><span id="predAns" class="muted" hidden>' + esc(T3(P.opts[P.correct])) + "</span></div>";
    return h + "</div>" + nextBtn(st.pred.choice != null && st.pred.text.trim().length >= 5, L("Жауапты таңдап, себебін жазыңыз.", "Выберите ответ и напишите причину.", "Choose an answer and give a reason."));
  }
  function bindPred() {
    document.querySelectorAll('input[name="pred"]').forEach(function (el) { el.addEventListener("change", function () { st.pred.choice = +el.value; save(); refreshNext(); }); });
    $("predWhy").addEventListener("input", function () { st.pred.text = $("predWhy").value; save(); refreshNext(); });
    if ($("revealPred")) $("revealPred").addEventListener("click", function () { $("predAns").hidden = !$("predAns").hidden; });
    bindNext();
  }
  function refreshNext() {
    var b = $("nextStage"); if (!b) return;
    var ok = st.stage === 1 ? st.pred.choice != null && st.pred.text.trim().length >= 5
      : st.stage === 2 ? st.runs.length >= lab.minRuns
      : st.stage === 4 ? st.concl.text.trim().length >= 20 && st.concl.evidence.length > 0 : true;
    b.disabled = !ok;
    var hint = b.nextElementSibling; if (hint) hint.hidden = ok;
  }

  // 3. Опыт
  var anim = { raf: 0, t: 0, res: null, p: null, running: false, last: 0, speed: 1, done: false };
  function stRun() {
    if (lab.kind === "data") return stData();
    var h = '<div class="exp"><div class="card exp-ctrl"><h2>' + L("Шарттар", "Условия", "Conditions") + "</h2>";
    lab.controls.forEach(function (c) {
      var vis = !c.show || c.show(st.params);
      h += '<div class="ctl"' + (vis ? "" : " hidden") + ' data-ctl="' + c.id + '">';
      if (c.type === "range") h += '<div class="range-top"><label for="c_' + c.id + '">' + esc(T3(c.label)) + '</label><output id="o_' + c.id + '"></output></div><input type="range" id="c_' + c.id + '" min="' + c.min + '" max="' + c.max + '" step="' + c.step + '" value="' + st.params[c.id] + '">';
      else if (c.type === "select") h += '<label class="field-inline">' + esc(T3(c.label)) + '<select id="c_' + c.id + '">' + c.options.map(function (o) { return '<option value="' + o.v + '"' + (String(st.params[c.id]) === String(o.v) ? " selected" : "") + ">" + esc(T3(o.t)) + "</option>"; }).join("") + "</select></label>";
      else if (c.type === "check") h += '<label class="check"><input type="checkbox" id="c_' + c.id + '"' + (st.params[c.id] ? " checked" : "") + "><span>" + esc(T3(c.label)) + "</span></label>";
      h += "</div>";
    });
    h += '<div class="row run-btns"><button class="btn btn-primary" type="button" id="runBtn">' + L("Іске қосу", "Запустить", "Run") + '</button><button class="btn" type="button" id="pauseBtn" disabled>' + L("Пауза", "Пауза", "Pause") + '</button><button class="btn" type="button" id="resetBtn">' + L("Тазалау", "Сбросить", "Reset") + "</button></div>" +
      '<div class="clock"><span>' + L("Секундомер", "Секундомер", "Stopwatch") + '</span><b id="clock">0,0 ' + L("с", "с", "s") + '</b><span class="muted small" id="speedNote"></span></div>' +
      '<p class="muted small" id="runMsg" aria-live="polite"></p></div>' +
      '<div class="card exp-view"><canvas id="labCanvas" role="img" aria-label="' + esc(L("Виртуалды тәжірибе", "Виртуальный опыт", "Virtual experiment")) + '"></canvas><p class="muted small view-note">' + esc(T3(lab.viewNote)) + "</p></div></div>";
    h += '<div class="grid g2" style="margin-top:16px"><div class="card"><h3>' + L("Бақылау кестесі", "Таблица наблюдений", "Observation table") + '</h3><div class="table-wrap" id="runTable"></div></div>' +
      '<div class="card"><h3>' + esc(T3(lab.chart.title)) + '</h3><div id="runChart" class="chart"></div><p class="muted small" id="fitNote"></p></div></div>';
    h += '<div class="card" style="margin-top:16px"><h3>' + L("Екі тәжірибені салыстыру", "Сравнение двух опытов", "Compare two runs") + '</h3><div class="row"><select id="cmpA"></select><span>↔</span><select id="cmpB"></select></div><div id="cmpOut" class="fb" hidden></div></div>';
    if (lab.extra) h += '<div class="card" style="margin-top:16px" id="extraBox"></div>';
    return h + nextBtn(st.runs.length >= lab.minRuns, L("Кемінде ", "Проведите не менее ", "Do at least ") + lab.minRuns + L(" тәжірибе жасаңыз.", " опытов.", " runs."));
  }
  function bindRun() {
    if (lab.kind === "data") return bindData();
    lab.controls.forEach(function (c) {
      var el = $("c_" + c.id);
      var upd = function () {
        st.params[c.id] = c.type === "check" ? el.checked : c.type === "range" ? +el.value : el.value;
        if (c.type === "range") $("o_" + c.id).textContent = fmtN(+el.value, c.dec) + " " + T3(c.unit);
        lab.controls.forEach(function (d) { var box = document.querySelector('[data-ctl="' + d.id + '"]'); if (box) box.hidden = !!(d.show && !d.show(st.params)); });
        save();
        if (!anim.running) { anim.res = null; anim.t = 0; drawFrame(); }
        renderExtra();
      };
      el.addEventListener(c.type === "range" ? "input" : "change", upd);
      if (c.type === "range") $("o_" + c.id).textContent = fmtN(+el.value, c.dec) + " " + T3(c.unit);
    });
    $("runBtn").addEventListener("click", startRun);
    $("pauseBtn").addEventListener("click", togglePause);
    $("resetBtn").addEventListener("click", resetRun);
    ["cmpA", "cmpB"].forEach(function (id) { $(id).addEventListener("change", renderCompare); });
    sizeCanvas();
    drawFrame();
    renderRunData();
    renderExtra();
    bindNext();
  }
  function renderExtra() { if (lab.extra && $("extraBox")) $("extraBox").innerHTML = lab.extra(st.params, LANG); }

  function startRun() {
    var p = JSON.parse(JSON.stringify(st.params)), res = simulate(p);
    if (!res.ok) { $("runMsg").textContent = L("Параметрлер рұқсат етілген ауқымнан тыс.", "Параметры вне допустимого диапазона.", "Parameters are outside the allowed range."); return; }
    anim.p = p; anim.res = res; anim.t = 0; anim.done = false; anim.running = true; anim.last = 0;
    anim.speed = Math.max(1, res.end / 8);
    $("speedNote").textContent = anim.speed > 1.01 ? "× " + fmtN(anim.speed, 0) + " " + L("жылдамдатылған", "ускорено", "sped up") : "";
    $("runBtn").disabled = true; $("pauseBtn").disabled = false;
    $("pauseBtn").textContent = L("Пауза", "Пауза", "Pause");
    $("runMsg").textContent = L("Тәжірибе жүріп жатыр…", "Идёт опыт…", "Experiment running…");
    loop();
  }
  function togglePause() {
    if (!anim.res || anim.done) return;
    anim.running = !anim.running;
    $("pauseBtn").textContent = anim.running ? L("Пауза", "Пауза", "Pause") : L("Жалғастыру", "Продолжить", "Resume");
    if (anim.running) { anim.last = 0; loop(); }
  }
  function resetRun() { stopAnim(); anim.res = null; anim.t = 0; anim.done = false; $("runBtn").disabled = false; $("pauseBtn").disabled = true; $("clock").textContent = "0,0 " + L("с", "с", "s"); $("runMsg").textContent = ""; drawFrame(); }
  function stopAnim() { anim.running = false; if (anim.raf) cancelAnimationFrame(anim.raf); anim.raf = 0; }
  function loop() {
    anim.raf = requestAnimationFrame(function (ts) {
      anim.raf = 0;
      if (!anim.running) return;
      var dt = anim.last ? Math.min(0.1, (ts - anim.last) / 1000) : 0;
      anim.last = ts;
      anim.t = Math.min(anim.res.end, anim.t + dt * anim.speed);
      drawFrame();
      $("clock").textContent = fmtN(anim.t, 1) + " " + L("с", "с", "s");
      if (anim.t >= anim.res.end) return finishRun();
      loop();
    });
  }
  function finishRun() {
    anim.running = false; anim.done = true;
    st.runs.push({ p: anim.p, at: new Date().toISOString(), summary: lab.summary(anim.p, anim.res) });
    save();
    $("runBtn").disabled = false; $("pauseBtn").disabled = true;
    $("runMsg").textContent = L("Тәжірибе аяқталды, нәтиже кестеге жазылды.", "Опыт завершён, результат записан в таблицу.", "Run complete; the result was added to the table.");
    renderRunData();
    refreshNext();
  }
  function renderRunData() {
    var cols = lab.columns(LANG), rows = st.runs.map(function (r, i) { return lab.row(r.p, simulate(r.p), LANG); });
    $("runTable").innerHTML = st.runs.length ? "<table><thead><tr><th>№</th>" + cols.map(function (c) { return "<th>" + esc(c) + "</th>"; }).join("") + "<th></th></tr></thead><tbody>" +
      rows.map(function (r, i) { return "<tr><td>" + (i + 1) + "</td>" + r.map(function (c) { return "<td>" + esc(c) + "</td>"; }).join("") + '<td><button class="icon-x" type="button" data-del="' + i + '" aria-label="' + esc(L("Жою", "Удалить", "Delete")) + '">×</button></td></tr>'; }).join("") + "</tbody></table>"
      : '<p class="empty">' + L("Әзірге тәжірибе жоқ. Шарттарды таңдап, «Іске қосу» басыңыз.", "Опытов пока нет. Выберите условия и нажмите «Запустить».", "No runs yet. Choose conditions and press “Run”.") + "</p>";
    $("runTable").querySelectorAll("[data-del]").forEach(function (b) { b.addEventListener("click", function () { st.runs.splice(+b.getAttribute("data-del"), 1); save(); renderRunData(); refreshNext(); }); });
    drawChart();
    var opts = st.runs.map(function (r, i) { return '<option value="' + i + '">' + L("Тәжірибе ", "Опыт ", "Run ") + (i + 1) + "</option>"; }).join("");
    $("cmpA").innerHTML = opts; $("cmpB").innerHTML = opts;
    if (st.runs.length > 1) { $("cmpA").value = String(st.runs.length - 2); $("cmpB").value = String(st.runs.length - 1); }
    renderCompare();
  }
  function renderCompare() {
    var out = $("cmpOut");
    if (st.runs.length < 2) { out.hidden = true; return; }
    var a = st.runs[+$("cmpA").value], b = st.runs[+$("cmpB").value];
    if (!a || !b || a === b) { out.hidden = true; return; }
    var diff = lab.controls.filter(function (c) { return (!c.show || c.show(a.p) || c.show(b.p)) && String(a.p[c.id]) !== String(b.p[c.id]); });
    var ma = lab.metric(a.p, simulate(a.p)), mb = lab.metric(b.p, simulate(b.p));
    var h = "<p><b>" + L("Өзгерген шарттар: ", "Изменённые условия: ", "Changed conditions: ") + "</b>" + (diff.length ? diff.map(function (c) { return esc(T3(c.label)); }).join(", ") : L("жоқ", "нет", "none")) + "</p>";
    h += "<p>" + esc(T3(ma.label)) + ": " + esc(ma.text) + " ↔ " + esc(mb.text) + (ma.value > 0 && mb.value > 0 && isFinite(ma.value) && isFinite(mb.value) ? " (" + L("қатынасы ", "отношение ", "ratio ") + fmtN(mb.value / ma.value, 2) + ")" : "") + "</p>";
    if (diff.length > 1) h += '<p class="mark-bad">' + L("Бірден бірнеше шарт өзгерген — қай фактор әсер еткенін бұл жұпқа қарап айту мүмкін емес.", "Изменено сразу несколько условий — по этой паре нельзя сказать, какой фактор повлиял.", "Several conditions changed at once — this pair cannot tell you which factor had the effect.") + "</p>";
    else if (diff.length === 1) h += '<p class="mark-ok">' + L("Тек бір шарт өзгерген — бұл жұп сол фактордың әсерін көрсетеді.", "Изменено одно условие — эта пара показывает влияние именно этого фактора.", "Only one condition changed — this pair shows the effect of that factor.") + "</p>";
    out.innerHTML = h; out.hidden = false;
  }

  /* ---------- Данные «концентрация — время» (L5) ---------- */
  function stData() {
    var D = M.dataset(st.dataSeed), h = '<div class="card"><h2>' + L("Тәжірибе деректері", "Данные опыта", "Experimental data") + '</h2><p class="muted">' + esc(T3(lab.dataNote)) + "</p>";
    h += '<div class="grid g2"><div class="table-wrap"><table><thead><tr><th>t, ' + L("с", "с", "s") + "</th><th>C(H₂O₂), " + L("моль/л", "моль/л", "mol/L") + "</th><th>" + L("Аралық", "Интервал", "Interval") + "</th><th>v<sub>" + L("орт", "ср", "avg") + "</sub>, " + L("моль/(л·с)", "моль/(л·с)", "mol/(L·s)") + "</th></tr></thead><tbody>";
    D.rows.forEach(function (r, i) {
      h += "<tr><td>" + r[0] + "</td><td>" + fmtN(r[1], 3) + "</td>";
      if (i < D.rows.length - 1) {
        var v = st.data["v" + i] || "", ck = st.data["c" + i];
        h += "<td>" + r[0] + "–" + D.rows[i + 1][0] + '</td><td><input class="inp" type="text" inputmode="decimal" data-v="' + i + '" value="' + esc(v) + '" aria-label="v ' + (i + 1) + '">' + (ck == null ? "" : ck ? ' <span class="mark-ok">✓</span>' : ' <span class="mark-bad">✗</span>') + "</td>";
      } else h += "<td></td><td></td>";
      h += "</tr>";
    });
    h += '</tbody></table></div><div id="runChart" class="chart"></div></div><div class="row"><button class="btn btn-primary" type="button" id="checkData">' + L("Есептеулерді тексеру", "Проверить расчёты", "Check calculations") + '</button><button class="btn" type="button" id="newData">' + L("Жаңа деректер", "Новые данные", "New data") + '</button><span class="muted small" id="dataMsg"></span></div></div>';
    var ok = [0, 1, 2, 3, 4].every(function (i) { return st.data["c" + i]; });
    return h + nextBtn(ok, L("Барлық аралықтар үшін жылдамдықты дұрыс есептеңіз.", "Правильно рассчитайте скорость на всех интервалах.", "Calculate the rate correctly for every interval."));
  }
  function bindData() {
    document.querySelectorAll("[data-v]").forEach(function (el) { el.addEventListener("input", function () { st.data["v" + el.getAttribute("data-v")] = el.value; save(); }); });
    $("checkData").addEventListener("click", function () {
      var D = M.dataset(st.dataSeed), wrong = 0;
      for (var i = 0; i < 5; i++) {
        var x = parseNum(st.data["v" + i]), v = (D.rows[i][1] - D.rows[i + 1][1]) / (D.rows[i + 1][0] - D.rows[i][0]);
        st.data["c" + i] = isFinite(x) && Math.abs(x - v) / v <= 0.03;
        if (!st.data["c" + i]) wrong++;
      }
      st.data.attempts = (st.data.attempts || 0) + 1;
      save(); renderRunner();
      if (wrong) $("dataMsg").textContent = L("Қате: ", "Ошибок: ", "Errors: ") + wrong + ". " + L("Кеңес: v = (C₁ − C₂) / (t₂ − t₁).", "Подсказка: v = (C₁ − C₂) / (t₂ − t₁).", "Hint: v = (C₁ − C₂) / (t₂ − t₁).");
    });
    $("newData").addEventListener("click", function () { st.dataSeed = (Math.random() * 4294967296) >>> 0; st.data = {}; save(); renderRunner(); });
    var D = M.dataset(st.dataSeed);
    $("runChart").innerHTML = svgChart({ series: [{ pts: D.rows, color: "var(--accent)", line: true, dots: true }], xLabel: "t, " + L("с", "с", "s"), yLabel: "C, " + L("моль/л", "моль/л", "mol/L") });
    bindNext();
  }

  /* ---------- График ---------- */
  function drawChart() {
    var c = lab.chart, el = $("runChart"), note = $("fitNote");
    if (!st.runs.length) { el.innerHTML = '<p class="empty">' + L("Деректер пайда болғанда график сызылады.", "График появится, когда будут данные.", "The graph appears once there is data.") + "</p>"; if (note) note.textContent = ""; return; }
    var colors = ["var(--accent)", "var(--c-a)", "var(--c-b)", "var(--c-ab)", "var(--ok)", "var(--ext)"];
    var series;
    if (c.kind === "scatter") {
      var pts = st.runs.map(function (r) { var res = simulate(r.p); return [c.x(r.p, res), c.y(r.p, res)]; });
      series = [{ pts: pts, color: "var(--accent)", dots: true }];
      if (c.fit && pts.length >= 2) {
        var f = linfit(pts);
        if (f) {
          var xs = pts.map(function (q) { return q[0]; }), x0 = c.origin ? 0 : Math.min.apply(null, xs), x1 = Math.max.apply(null, xs);
          series.push({ pts: [[x0, f.a * x0 + f.b], [x1, f.a * x1 + f.b]], color: "var(--c-ab)", line: true, dash: true });
          if (note) note.textContent = L("Түзу: ", "Прямая: ", "Line: ") + "y = " + fmtN(f.a, 3) + "·x " + (f.b < 0 ? "− " : "+ ") + fmtN(Math.abs(f.b), 3) + ";  R² = " + fmtN(f.r2, 4);
        }
      } else if (note) note.textContent = "";
    } else {
      series = st.runs.map(function (r, i) {
        var res = simulate(r.p), n = 60, pts = [];
        for (var k = 0; k <= n; k++) { var t = res.end * k / n; pts.push([t, c.y(r.p, res, t)]); }
        return { pts: pts, color: colors[i % colors.length], line: true, label: (i + 1) + "" };
      });
      if (note) note.textContent = L("Сызықтағы сан — тәжірибе нөмірі.", "Число у линии — номер опыта.", "The number by each line is the run number.");
    }
    el.innerHTML = svgChart({ series: series, xLabel: T3(c.xLabel), yLabel: T3(c.yLabel), xZero: true });
  }
  function linfit(pts) {
    var n = pts.length, sx = 0, sy = 0, sxx = 0, sxy = 0;
    pts.forEach(function (p) { sx += p[0]; sy += p[1]; sxx += p[0] * p[0]; sxy += p[0] * p[1]; });
    var d = n * sxx - sx * sx; if (!d) return null;
    var a = (n * sxy - sx * sy) / d, b = (sy - a * sx) / n, my = sy / n, ssr = 0, sst = 0;
    pts.forEach(function (p) { var f = a * p[0] + b; ssr += (p[1] - f) * (p[1] - f); sst += (p[1] - my) * (p[1] - my); });
    return { a: a, b: b, r2: sst ? 1 - ssr / sst : 1 };
  }
  function svgChart(o) {
    var W = 560, H = 320, x0 = 62, x1 = 540, y0 = 270, y1 = 18;
    var all = []; o.series.forEach(function (s) { all = all.concat(s.pts); });
    var xs = all.map(function (p) { return p[0]; }), ys = all.map(function (p) { return p[1]; });
    var xmin = o.xZero ? 0 : Math.min.apply(null, xs), xmax = Math.max.apply(null, xs), ymin = 0, ymax = Math.max.apply(null, ys);
    if (xmax === xmin) { xmax = xmin + 1; }
    if (ymax <= 0) ymax = 1;
    xmax = nice(xmax); ymax = nice(ymax * 1.08);
    function sx(v) { return x0 + (v - xmin) / (xmax - xmin) * (x1 - x0); }
    function sy(v) { return y0 - (v - ymin) / (ymax - ymin) * (y0 - y1); }
    var g = '<svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="' + esc(o.yLabel + " — " + o.xLabel) + '">';
    for (var i = 0; i <= 4; i++) {
      var yv = ymin + (ymax - ymin) * i / 4, xv = xmin + (xmax - xmin) * i / 4;
      g += '<line x1="' + x0 + '" x2="' + x1 + '" y1="' + sy(yv) + '" y2="' + sy(yv) + '" stroke="var(--border)"/>';
      g += '<text x="' + (x0 - 8) + '" y="' + (sy(yv) + 4) + '" text-anchor="end" class="ax">' + esc(fmtN(yv, ymax < 1 ? 3 : ymax < 10 ? 2 : 0)) + "</text>";
      g += '<text x="' + sx(xv) + '" y="' + (y0 + 18) + '" text-anchor="middle" class="ax">' + esc(fmtN(xv, xmax < 1 ? 2 : xmax < 10 ? 1 : 0)) + "</text>";
    }
    g += '<line x1="' + x0 + '" x2="' + x1 + '" y1="' + y0 + '" y2="' + y0 + '" stroke="var(--muted)"/><line x1="' + x0 + '" x2="' + x0 + '" y1="' + y1 + '" y2="' + y0 + '" stroke="var(--muted)"/>';
    g += '<text x="' + ((x0 + x1) / 2) + '" y="' + (H - 6) + '" text-anchor="middle" class="ax-t">' + esc(o.xLabel) + "</text>";
    g += '<text x="14" y="' + ((y0 + y1) / 2) + '" text-anchor="middle" class="ax-t" transform="rotate(-90 14 ' + ((y0 + y1) / 2) + ')">' + esc(o.yLabel) + "</text>";
    o.series.forEach(function (s) {
      if (s.line) g += '<path d="' + s.pts.map(function (p, i) { return (i ? "L" : "M") + sx(p[0]).toFixed(1) + " " + sy(p[1]).toFixed(1); }).join(" ") + '" fill="none" stroke="' + s.color + '" stroke-width="2.5"' + (s.dash ? ' stroke-dasharray="7 5"' : "") + "/>";
      if (s.dots) s.pts.forEach(function (p) { g += '<circle cx="' + sx(p[0]) + '" cy="' + sy(p[1]) + '" r="6" fill="' + s.color + '" stroke="var(--surface)" stroke-width="2"/>'; });
      if (s.label) { var e = s.pts[s.pts.length - 1]; g += '<text x="' + (sx(e[0]) - 4) + '" y="' + (sy(e[1]) - 6) + '" text-anchor="end" class="ax-t" style="fill:' + s.color + '">' + s.label + "</text>"; }
    });
    return g + "</svg>";
  }
  function nice(v) { var e = Math.pow(10, Math.floor(Math.log10(v))), f = v / e; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * e; }

  /* ---------- Визуализация опыта (canvas) ---------- */
  var cv, ctx, W = 0, Hc = 0, dpr = 1, parts = [], flashes = [], lastDraw = 0, collisions = 0;
  function sizeCanvas() {
    cv = $("labCanvas"); if (!cv) return;
    ctx = cv.getContext("2d");
    var w = cv.clientWidth, h = cv.clientHeight;
    if (w < 40 || h < 40) return;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); W = w; Hc = h;
    parts = [];
  }
  function css(v) { return getComputedStyle(document.documentElement).getPropertyValue(v).trim(); }
  function drawFrame() {
    if (!cv || !W) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, Hc);
    var p = anim.p && anim.res ? anim.p : st.params, res = anim.res, t = anim.t;
    var mode = lab.mode(p);
    var now = performance.now(), dt = lastDraw ? Math.min(0.05, (now - lastDraw) / 1000) : 0; lastDraw = now;
    if (mode === "cross") drawCross(p, res, t, dt);
    else if (mode === "gas") drawGas(p, res, t, dt);
    else drawChips(p, res, t, dt);
  }
  function beaker(x, y, w, h, fill, level) {
    ctx.fillStyle = fill; ctx.fillRect(x + 3, y + h * (1 - level), w - 6, h * level - 3);
    ctx.strokeStyle = css("--muted"); ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w, y); ctx.stroke();
  }
  function label(text, x, y, align, size) {
    ctx.fillStyle = css("--text"); ctx.font = "600 " + (size || 13) + "px 'Golos Text', system-ui"; ctx.textAlign = align || "left"; ctx.textBaseline = "alphabetic";
    ctx.fillText(text, x, y);
  }
  // Na₂S₂O₃ + HCl: стакан над крестом + увеличенный вид частиц.
  function drawCross(p, res, t, dt) {
    var half = W > 520 ? W * 0.5 : W, bx = 20, bw = Math.min(170, half - 60), bh = Math.min(170, Hc - 80), by = Hc - bh - 40;
    var prog = res ? res.progress(t) : 0;
    ctx.fillStyle = css("--surface-2"); ctx.fillRect(bx - 10, by + bh + 4, bw + 20, 26);
    ctx.strokeStyle = "#111"; ctx.lineWidth = 7; ctx.globalAlpha = 1;
    var cx = bx + bw / 2, cy = by + bh * 0.62;
    ctx.beginPath(); ctx.moveTo(cx - 34, cy - 34); ctx.lineTo(cx + 34, cy + 34); ctx.moveTo(cx + 34, cy - 34); ctx.lineTo(cx - 34, cy + 34); ctx.stroke();
    ctx.globalAlpha = Math.min(0.97, prog * 0.97);
    ctx.fillStyle = "#E9DB9A"; ctx.fillRect(bx + 3, by + bh * 0.15, bw - 6, bh * 0.85 - 3);
    ctx.globalAlpha = 1;
    ctx.fillStyle = "rgba(160,200,255,.12)"; ctx.fillRect(bx + 3, by + bh * 0.15, bw - 6, bh * 0.85 - 3);
    beaker(bx, by, bw, bh, "rgba(0,0,0,0)", 0);
    label(L("Лайлану: ", "Помутнение: ", "Cloudiness: ") + Math.round(prog * 100) + "%", bx, by - 10);
    if (res && t >= res.end) label(L("Крест көрінбейді!", "Крест не виден!", "Cross no longer visible!"), bx, by - 30, "left", 14);
    if (W <= 520) return;
    // Увеличенный вид: число частиц ∝ C, скорость ∝ √T, вспышки ∝ скорости реакции (масштабировано).
    var zx = half + 10, zy = 20, zw = W - zx - 16, zh = Hc - 60;
    ctx.strokeStyle = css("--border"); ctx.lineWidth = 1.5; ctx.strokeRect(zx, zy, zw, zh);
    label(L("Үлкейтілген көрініс (сапалық)", "Увеличенный вид (качественно)", "Zoomed view (qualitative)"), zx + 6, zy + zh + 18, "left", 12);
    var n = Math.round(8 + (+p.C) / 0.15 * 34), sp = 40 * Math.sqrt((+p.T + 273.15) / 293.15);
    while (parts.length < n) parts.push({ x: zx + 8 + Math.random() * (zw - 16), y: zy + 8 + Math.random() * (zh - 16), a: Math.random() * 6.283 });
    parts.length = n;
    var acol = css("--c-a"), hcol = css("--c-b");
    parts.forEach(function (q, i) {
      q.a += (Math.random() - 0.5) * 0.6 * (dt * 10);
      q.x += Math.cos(q.a) * sp * dt; q.y += Math.sin(q.a) * sp * dt;
      if (q.x < zx + 6 || q.x > zx + zw - 6) q.a = Math.PI - q.a;
      if (q.y < zy + 6 || q.y > zy + zh - 6) q.a = -q.a;
      q.x = Math.max(zx + 6, Math.min(zx + zw - 6, q.x)); q.y = Math.max(zy + 6, Math.min(zy + zh - 6, q.y));
      ctx.fillStyle = i % 3 ? acol : hcol;
      ctx.beginPath(); ctx.arc(q.x, q.y, 5, 0, 6.283); ctx.fill();
    });
    if (res && anim.running) {
      var lam = res.rate(t) / (M.THIO.k20 * 0.15) * 4; // вспышек в секунду: 4 при C = 0,15 моль/л и 20 °C
      if (Math.random() < lam * dt) { var q = parts[Math.floor(Math.random() * parts.length)]; flashes.push({ x: q.x, y: q.y, life: 0.5 }); collisions++; }
    }
    flashes = flashes.filter(function (f) { f.life -= dt; return f.life > 0; });
    flashes.forEach(function (f) { ctx.globalAlpha = f.life * 2; ctx.fillStyle = css("--c-ab"); ctx.beginPath(); ctx.arc(f.x, f.y, 14 * (1 - f.life), 0, 6.283); ctx.fill(); ctx.globalAlpha = 1; });
    var leg = L("● S₂O₃²⁻  ● H⁺   ✺ тиімді соқтығысу", "● S₂O₃²⁻  ● H⁺   ✺ эффективное столкновение", "● S₂O₃²⁻  ● H⁺   ✺ effective collision");
    label(leg, zx + 6, zy + 16, "left", 11);
  }
  // 2H₂O₂: колба + газовый шприц.
  function drawGas(p, res, t, dt) {
    var bx = 30, bw = Math.min(150, W * 0.3), bh = Math.min(160, Hc - 90), by = Hc - bh - 30;
    beaker(bx, by, bw, bh, "rgba(140,190,255,.35)", 0.55);
    var cat = p.cat;
    if (cat === "mno2") { ctx.fillStyle = "#2B2B2B"; for (var i = 0; i < 18; i++) ctx.fillRect(bx + 10 + (i * 37) % (bw - 20), by + bh - 8 - (i % 3) * 3, 4, 4); }
    if (cat === "catalase") { ctx.fillStyle = "#E8D9A8"; ctx.fillRect(bx + bw / 2 - 22, by + bh - 14, 44, 10); }
    var rate = res ? res.rate(t) : 0, V = res ? res.V(t) : 0;
    if (res && anim.running && Math.random() < Math.min(1, rate * dt * 4)) flashes.push({ x: bx + 15 + Math.random() * (bw - 30), y: by + bh - 12, life: 1 });
    flashes = flashes.filter(function (f) { f.y -= 60 * dt; f.life -= dt * 1.2; return f.life > 0 && f.y > by + bh * 0.45; });
    ctx.strokeStyle = css("--text"); ctx.lineWidth = 1.5;
    flashes.forEach(function (f) { ctx.beginPath(); ctx.arc(f.x, f.y, 4, 0, 6.283); ctx.stroke(); });
    // Шприц: шкала 0–120 мл.
    var sx = bx + bw + 40, sw = Math.max(160, W - sx - 30), sy = by + 10, sh = 36;
    ctx.strokeStyle = css("--muted"); ctx.lineWidth = 2; ctx.strokeRect(sx, sy, sw, sh);
    ctx.beginPath(); ctx.moveTo(bx + bw / 2, by); ctx.lineTo(bx + bw / 2, sy + sh / 2); ctx.lineTo(sx, sy + sh / 2); ctx.stroke();
    var frac = Math.min(1, V / 120);
    ctx.fillStyle = "rgba(120,200,255,.35)"; ctx.fillRect(sx + 2, sy + 2, (sw - 4) * frac, sh - 4);
    ctx.fillStyle = css("--muted"); ctx.fillRect(sx + 2 + (sw - 4) * frac, sy - 4, 6, sh + 8);
    for (var m = 0; m <= 120; m += 20) { var xx = sx + 2 + (sw - 4) * m / 120; ctx.fillRect(xx, sy + sh, 1.5, 8); label(String(m), xx, sy + sh + 22, "center", 11); }
    label("V(O₂) = " + fmtN(V, 1) + L(" мл", " мл", " mL"), sx, sy - 12, "left", 15);
    label(L("Газ шприцы, мл", "Газовый шприц, мл", "Gas syringe, mL"), sx, sy + sh + 40, "left", 12);
  }
  // CaCO₃ + HCl: колба на весах.
  function drawChips(p, res, t, dt) {
    var bx = 40, bw = Math.min(170, W * 0.4), bh = Math.min(160, Hc - 110), by = Hc - bh - 70;
    beaker(bx, by, bw, bh, "rgba(140,190,255,.30)", 0.55);
    var left = res ? res.left(t) : +p.m0, kfr = Math.cbrt(Math.max(0, left / +p.m0));
    var size = p.size, R0 = size === "chunk" ? 14 : size === "grain" ? 6 : 2, N = size === "chunk" ? 4 : size === "grain" ? 14 : 90;
    N = Math.round(N * (+p.m0));
    ctx.fillStyle = "#F2EEE6"; ctx.strokeStyle = "#9A948A"; ctx.lineWidth = 1;
    for (var i = 0; i < N; i++) {
      var r = R0 * kfr; if (r < 0.6) continue;
      var x = bx + 12 + ((i * 53) % (bw - 24)), y = by + bh - 6 - r - ((i * 7) % 4) * (r * 0.8);
      ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill(); if (r > 2) ctx.stroke();
    }
    var rate = res ? res.rate(t) : 0;
    if (res && anim.running && Math.random() < Math.min(1, rate * 400 * dt)) flashes.push({ x: bx + 15 + Math.random() * (bw - 30), y: by + bh - 12, life: 1 });
    flashes = flashes.filter(function (f) { f.y -= 50 * dt; f.life -= dt * 1.2; return f.life > 0 && f.y > by + bh * 0.45; });
    ctx.strokeStyle = css("--text");
    flashes.forEach(function (f) { ctx.beginPath(); ctx.arc(f.x, f.y, 3.5, 0, 6.283); ctx.stroke(); });
    if (p.closed) { ctx.fillStyle = css("--muted"); ctx.fillRect(bx - 2, by - 8, bw + 4, 10); label(L("жабық", "закрыто", "sealed"), bx + bw / 2, by - 14, "center", 12); }
    // Весы.
    ctx.fillStyle = css("--surface-2"); ctx.fillRect(bx - 20, by + bh + 4, bw + 40, 14);
    ctx.fillStyle = "#14161F"; ctx.fillRect(bx + bw / 2 - 70, by + bh + 22, 140, 34);
    var lost = res ? res.lost(t) : 0, mass = res ? (p.closed ? res.massStart : res.massStart - lost) : (M.MARBLE.flask + +p.m0 + M.MARBLE.Vacid * 1.02);
    ctx.fillStyle = "#7CFFB2"; ctx.font = "700 18px ui-monospace, monospace"; ctx.textAlign = "center"; ctx.fillText(mass.toFixed(2) + " g", bx + bw / 2, by + bh + 46);
    var tx = bx + bw + 50;
    if (W > 420) {
      label(L("Бөлінген CO₂: ", "Выделилось CO₂: ", "CO₂ released: ") + fmtN(lost, 3) + L(" г", " г", " g"), tx, by + 20, "left", 14);
      label(L("Қалған CaCO₃: ", "Осталось CaCO₃: ", "CaCO₃ left: ") + fmtN(left, 3) + L(" г", " г", " g"), tx, by + 44, "left", 14);
    }
  }

  /* ================= Анализ ================= */
  function stAnalysis() {
    var P = lab.prediction, h = "";
    h += '<div class="card"><h2>' + L("Болжамды тексеру", "Проверка прогноза", "Checking the prediction") + "</h2><p>" + L("Сіздің болжамыңыз: ", "Ваш прогноз: ", "Your prediction: ") + "<b>" + esc(st.pred.choice == null ? "—" : T3(P.opts[st.pred.choice])) + "</b>. " +
      (st.pred.choice === P.correct ? '<span class="mark-ok">' + L("Тәжірибе оны растады.", "Опыт его подтвердил.", "The experiment confirmed it.") + "</span>" : '<span class="mark-bad">' + L("Тәжірибе басқа нәтиже көрсетті: ", "Опыт показал другое: ", "The experiment showed something else: ") + esc(T3(P.opts[P.correct])) + ".</span>") + "</p></div>";
    h += '<div class="card" style="margin-top:16px"><h2>' + L("Сұрақтар", "Вопросы", "Questions") + '</h2><p class="muted small">' + L("Алдымен өзіңіз жауап беріңіз — дұрыс жауаптар «Тексеру» батырмасынан кейін ғана ашылады.", "Сначала ответьте сами — правильные ответы откроются только после «Проверить».", "Answer on your own first — the right answers appear only after “Check”.") + "</p>";
    ["base", "adv", "res"].forEach(function (lv) {
      var qs = lab.questions.filter(function (q) { return q.level === lv; });
      if (!qs.length) return;
      h += '<h3 class="lvl-h">' + esc(T3(LEVEL[lv])) + "</h3>";
      qs.forEach(function (q) { h += question(q); });
    });
    h += st.checked ? "" : '<div class="row"><button class="btn btn-primary" type="button" id="checkQ">' + L("Тексеру", "Проверить", "Check") + '</button><span class="muted small" id="qMsg"></span></div>';
    h += "</div>";
    return h + nextBtn(st.checked, L("Алдымен жауаптарды тексеріңіз.", "Сначала проверьте ответы.", "Check your answers first."));
  }
  function question(q) {
    var a = st.answers[q.id], h = '<div class="qbox"><p class="q">' + esc(T3(q.q)) + "</p>";
    if (q.type === "choice") {
      h += '<div class="opts">' + q.opts.map(function (o, i) {
        var cls = st.checked ? (i === q.correct ? " right" : a === i ? " wrong" : "") : "";
        return '<label class="opt' + cls + '"><input type="radio" name="q_' + q.id + '" value="' + i + '"' + (a === i ? " checked" : "") + (st.checked ? " disabled" : "") + "><span>" + esc(T3(o)) + "</span></label>";
      }).join("") + "</div>";
    } else if (q.type === "num") {
      h += '<div class="row"><input class="inp" type="text" inputmode="decimal" data-qn="' + q.id + '" value="' + esc(a == null ? "" : a) + '"' + (st.checked ? " readonly" : "") + '><span class="muted">' + esc(T3(q.unit)) + "</span></div>";
    } else {
      h += '<textarea data-qo="' + q.id + '"' + (st.checked ? " readonly" : "") + ">" + esc(a || "") + "</textarea>";
    }
    if (st.checked) {
      var ok = grade(q);
      h += '<div class="fb ' + (ok === null ? "" : ok ? "ok" : "bad") + '"><p>' + (ok === null ? L("Ашық жауап — мұғалім бағалайды. ", "Открытый ответ — оценит учитель. ", "Open answer — the teacher will assess it. ") : ok ? '<span class="mark-ok">✓</span> ' : '<span class="mark-bad">✗</span> ') +
        (q.type === "num" ? L("Дұрыс мәні: ", "Правильное значение: ", "Correct value: ") + "<b>" + esc(numAns(q)) + "</b>. " : "") + esc(T3(q.explain)) + "</p></div>";
    }
    return h + "</div>";
  }
  function numAns(q) { var v = q.answer(st, simulate); return v == null ? "—" : fmtN(v, q.dec == null ? 3 : q.dec) + " " + T3(q.unit); }
  function grade(q) {
    var a = st.answers[q.id];
    if (q.type === "choice") return a === q.correct;
    if (q.type === "num") { var v = q.answer(st, simulate), x = parseNum(a); return v != null && isFinite(x) && Math.abs(x - v) / Math.abs(v) <= (q.tol || 0.03); }
    return null;
  }
  function bindAnalysis() {
    lab.questions.forEach(function (q) {
      document.querySelectorAll('input[name="q_' + q.id + '"]').forEach(function (el) { el.addEventListener("change", function () { st.answers[q.id] = +el.value; save(); }); });
      var n = document.querySelector('[data-qn="' + q.id + '"]'); if (n) n.addEventListener("input", function () { st.answers[q.id] = n.value; save(); });
      var o = document.querySelector('[data-qo="' + q.id + '"]'); if (o) o.addEventListener("input", function () { st.answers[q.id] = o.value; save(); });
    });
    if ($("checkQ")) $("checkQ").addEventListener("click", function () {
      var missing = lab.questions.filter(function (q) { var a = st.answers[q.id]; return a == null || (typeof a === "string" && a.trim().length < (q.type === "open" ? 10 : 1)); });
      if (missing.length) { $("qMsg").textContent = L("Барлық сұраққа жауап беріңіз (ашық жауап — кемінде бір сөйлем).", "Ответьте на все вопросы (открытый ответ — хотя бы одно предложение).", "Answer every question (open answers need at least one sentence)."); return; }
      st.checked = true; save(); renderRunner();
    });
    bindNext();
  }

  /* ================= Вывод ================= */
  function stConcl() {
    var h = '<div class="card"><h2>' + L("Қорытынды", "Вывод", "Conclusion") + '</h2><p class="muted">' + esc(T3(lab.conclusionHint)) + '</p><textarea id="conclText" style="min-height:140px">' + esc(st.concl.text) + "</textarea>";
    h += '<p class="q">' + L("Қорытындыңызды қай тәжірибелер растайды?", "Какие опыты подтверждают ваш вывод?", "Which runs support your conclusion?") + '</p><div class="yn">';
    var n = lab.kind === "data" ? 0 : st.runs.length;
    for (var i = 0; i < n; i++) h += '<label class="opt"><input type="checkbox" data-ev="' + i + '"' + (st.concl.evidence.indexOf(i) >= 0 ? " checked" : "") + "><span>" + L("Тәжірибе ", "Опыт ", "Run ") + (i + 1) + "</span></label>";
    if (lab.kind === "data") h += '<label class="opt"><input type="checkbox" data-ev="0"' + (st.concl.evidence.indexOf(0) >= 0 ? " checked" : "") + "><span>" + L("Деректер кестесі", "Таблица данных", "Data table") + "</span></label>";
    h += "</div></div>";
    return h + '<div class="row"><button class="btn btn-primary" type="button" id="nextStage"' + (st.concl.text.trim().length >= 20 && st.concl.evidence.length ? "" : " disabled") + ">" + L("Аяқтау және сақтау", "Завершить и сохранить", "Finish and save") + '</button><span class="muted small">' + L("Кемінде 20 таңба және бір дәлел.", "Не меньше 20 символов и одно доказательство.", "At least 20 characters and one piece of evidence.") + "</span></div>";
  }
  function bindConcl() {
    $("conclText").addEventListener("input", function () { st.concl.text = $("conclText").value; save(); refreshNext(); });
    document.querySelectorAll("[data-ev]").forEach(function (el) {
      el.addEventListener("change", function () {
        var i = +el.getAttribute("data-ev"), k = st.concl.evidence.indexOf(i);
        if (el.checked && k < 0) st.concl.evidence.push(i); else if (!el.checked && k >= 0) st.concl.evidence.splice(k, 1);
        save(); refreshNext();
      });
    });
    $("nextStage").addEventListener("click", function () {
      st.finished = new Date().toISOString();
      st.score = score();
      var hist = load("nc-lab-history", []);
      hist.unshift(record());
      store("nc-lab-history", JSON.stringify(hist.slice(0, 300)));
      go(5);
    });
  }
  function score() {
    var auto = 0, max = 0, open = 0;
    lab.questions.forEach(function (q) { var g = grade(q); if (g === null) open++; else { max++; if (g) auto++; } });
    return { auto: auto, max: max, open: open, prediction: st.pred.choice === lab.prediction.correct };
  }
  function record() {
    return { lab: lab.id, title: lab.title[1], version: st.version, started: st.started, finished: st.finished, lang: LANG,
      prediction: st.pred, runs: st.runs.map(function (r) { return { params: r.p, result: r.summary, at: r.at }; }), data: lab.kind === "data" ? { seed: st.dataSeed, answers: st.data } : null,
      answers: st.answers, conclusion: st.concl, score: st.score, teacherReview: null };
  }

  /* ================= Результат ================= */
  function stResult() {
    var s = st.score || score();
    var h = '<div class="card print-area"><h2>' + L("Жұмыс аяқталды", "Работа завершена", "Lab complete") + "</h2>" +
      '<div class="readout big"><div><b>' + s.auto + " / " + s.max + "</b><span>" + L("автоматты тексерілген сұрақтар", "вопросы с автопроверкой", "auto-checked questions") + "</span></div>" +
      "<div><b>" + s.open + "</b><span>" + L("ашық жауап — мұғалім бағалайды", "открытых ответа — оценит учитель", "open answers — teacher to assess") + "</span></div>" +
      "<div><b>" + (lab.kind === "data" ? "—" : st.runs.length) + "</b><span>" + L("тәжірибе", "опытов", "runs") + "</span></div></div>" +
      '<p class="muted small" style="margin-top:12px">' + L("Бұл — алдын ала автоматты нәтиже. Қорытынды мен ашық жауаптарды мұғалім бағалайды. Аккаунттар қосылмағандықтан, нәтиже тек осы браузерде сақталады — файлға жүктеп алыңыз.", "Это предварительный автоматический результат. Вывод и открытые ответы оценивает учитель. Аккаунты пока не подключены, поэтому результат хранится только в этом браузере — скачайте файл.", "This is a preliminary automatic result. The teacher assesses the conclusion and open answers. Accounts are not connected yet, so the result is stored only in this browser — download the file.") + "</p>" +
      "<h3>" + L("Сіздің қорытындыңыз", "Ваш вывод", "Your conclusion") + "</h3><p>" + esc(st.concl.text) + "</p></div>";
    h += '<div class="row"><button class="btn" type="button" id="dlJson">' + L("JSON жүктеу", "Скачать JSON", "Download JSON") + '</button><button class="btn" type="button" id="dlCsv">' + L("CSV (Excel) жүктеу", "Скачать CSV (Excel)", "Download CSV (Excel)") + '</button><button class="btn" type="button" id="printBtn">' + L("Басып шығару / PDF", "Печать / PDF", "Print / PDF") + '</button><button class="btn btn-primary" type="button" id="againBtn">' + L("Жұмысты қайта орындау", "Выполнить заново", "Do it again") + "</button></div>";
    return h;
  }
  function bindResult() {
    $("dlJson").addEventListener("click", function () { download(lab.id + ".json", JSON.stringify(record(), null, 2), "application/json"); });
    $("dlCsv").addEventListener("click", function () {
      var cols = lab.kind === "data" ? [] : lab.columns(LANG), lines = [["№"].concat(cols).join(";")];
      if (lab.kind !== "data") st.runs.forEach(function (r, i) { lines.push([i + 1].concat(lab.row(r.p, simulate(r.p), LANG)).map(csv).join(";")); });
      lines.push(""); lines.push([L("Қорытынды", "Вывод", "Conclusion"), csv(st.concl.text)].join(";"));
      download(lab.id + ".csv", "﻿" + lines.join("\r\n"), "text/csv;charset=utf-8");
    });
    $("printBtn").addEventListener("click", function () { try { window.print(); } catch (e) {} });
    $("againBtn").addEventListener("click", function () { st = fresh(); save(); renderRunner(); });
  }
  function csv(v) { var s = String(v == null ? "" : v); return /[";\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }
  function download(name, text, type) {
    try { var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type: type })); a.download = name; document.body.appendChild(a); a.click(); a.remove(); } catch (e) { console.error(e); }
  }

  /* ================= Режим «Демонстрация на уроке» ================= */
  function demoOn() { return document.documentElement.hasAttribute("data-demo"); }
  function setDemo(on) {
    if (on) document.documentElement.setAttribute("data-demo", ""); else document.documentElement.removeAttribute("data-demo");
    try { if (on && document.documentElement.requestFullscreen && !document.fullscreenElement) document.documentElement.requestFullscreen().catch(function () {}); if (!on && document.fullscreenElement) document.exitFullscreen(); } catch (e) {}
    store("nc-demo", on ? "1" : "0");
    $("demoBar").hidden = !on;
    if (lab) renderRunner();
  }
  function demoBind() {
    $("demoRun").addEventListener("click", function () { if (st.stage !== 2) go(2); setTimeout(function () { if ($("runBtn") && !$("runBtn").disabled) startRun(); else togglePause(); }, 30); });
    $("demoReset").addEventListener("click", function () { if (st.stage === 2) resetRun(); });
    $("demoExplain").addEventListener("click", function () { var b = $("explainBox"); b.hidden = !b.hidden; b.innerHTML = "<h3>" + L("Түсіндірме", "Объяснение", "Explanation") + "</h3>" + T3(lab.explain); });
    $("demoExit").addEventListener("click", function () { setDemo(false); });
    $("demoPrev").addEventListener("click", function () { var i = LABS.indexOf(lab); if (i > 0) location.href = "?lab=" + LABS[i - 1].id; });
    $("demoNext").addEventListener("click", function () { var i = LABS.indexOf(lab); if (i < LABS.length - 1) location.href = "?lab=" + LABS[i + 1].id; });
    document.addEventListener("keydown", function (e) {
      var tg = e.target && e.target.tagName;
      if (tg === "INPUT" || tg === "TEXTAREA" || tg === "SELECT" || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === "d" || e.key === "D") setDemo(!demoOn());
      else if (demoOn() && e.key === " ") { e.preventDefault(); $("demoRun").click(); }
      else if (demoOn() && (e.key === "r" || e.key === "R")) $("demoReset").click();
      else if (demoOn() && (e.key === "e" || e.key === "E")) $("demoExplain").click();
      else if (e.key === "Escape" && demoOn()) setDemo(false);
    });
  }

  /* ================= Запуск ================= */
  if (lab) {
    st = load("nc-lab-" + lab.id, null);
    if (!st || st.version !== NCLabs.VERSION) st = fresh();
    if (st.finished && st.stage < 5) st.stage = 5;
    if (store("nc-demo") === "1") document.documentElement.setAttribute("data-demo", "");
    $("demoBar").hidden = !demoOn();
    demoBind();
    renderRunner();
    window.addEventListener("resize", function () { if (st.stage === 2 && lab.kind !== "data") { sizeCanvas(); drawFrame(); } });
    onLang(renderRunner);
    // Перерисовка цветов canvas при смене темы.
    document.addEventListener("prefschange", function () { if (st.stage === 2) drawFrame(); });
  } else {
    bindCatalog();
    renderCatalog();
    onLang(renderCatalog);
  }
});
