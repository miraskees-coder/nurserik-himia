/* ================= Ядро: тіл, сандар, навигация ================= */
var LANG = "kk";
var KK = {};

function L(kk, ru, en) { return LANG === "ru" ? ru : LANG === "en" ? en : kk; }
function T3(a) { return L(a[0], a[1], a[2]); }

function safe(name, fn) {
  try { fn(); } catch (e) { if (window.console) console.error("[" + name + "]", e); }
}
function $(id) { return document.getElementById(id); }
function onLang(fn) { document.addEventListener("langchange", function () { safe("langchange", fn); }); }

/* ---------- Сандар ---------- */
var SUP = { "-": "⁻", "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" };

function fmt(x, d) {
  if (typeof x !== "number" || !isFinite(x)) return "—";
  if (d == null) d = 2;
  var neg = x < 0;
  var s = Math.abs(x).toFixed(d);
  if (s.indexOf(".") >= 0) s = s.replace(/0+$/, "").replace(/\.$/, "");
  if (s === "0") neg = false;
  var parts = s.split(".");
  var int = parts[0];
  var en = LANG === "en";
  if (int.length > (en ? 3 : 4)) int = int.replace(/\B(?=(\d{3})+(?!\d))/g, en ? "," : " ");
  return (neg ? "−" : "") + int + (parts[1] ? (en ? "." : ",") + parts[1] : "");
}
function fmtSci(x, d) {
  if (!isFinite(x) || x === 0) return fmt(x, d);
  var e = Math.floor(Math.log10(Math.abs(x)));
  var m = x / Math.pow(10, e);
  if (Math.abs(+m.toFixed(d == null ? 1 : d)) >= 10) { m /= 10; e += 1; }
  var exp = String(e).split("").map(function (c) { return SUP[c]; }).join("");
  return fmt(m, d == null ? 1 : d) + "·10" + exp;
}
// Өте үлкен не өте кіші сандар 2,4·10⁴ түрінде.
function fmtAuto(x, d) {
  var a = Math.abs(x);
  if (a !== 0 && (a >= 1e4 || a < 1e-3)) return fmtSci(x, 1);
  return fmt(x, d);
}
function parseNum(v) {
  var s = String(v == null ? "" : v).trim().replace(/[\s ]/g, "").replace(/−/g, "-").replace(",", ".");
  if (!/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(s)) return NaN;
  return parseFloat(s);
}

// Орысша «раз / раза»: бөлшек сан → «раза»; 2–4 → «раза» (12–14-тен басқа).
function razWord(x) {
  var r = Math.round(x * 100) / 100;
  if (Math.abs(r % 1) > 1e-9) return "раза";
  var n = Math.abs(r) % 100;
  if (n >= 11 && n <= 14) return "раз";
  var d = n % 10;
  return d >= 2 && d <= 4 ? "раза" : "раз";
}
// Жылдамдықтың өзгерісі: «9 есе артады / в 9 раз / 9× faster».
function rateChange(r) {
  if (!isFinite(r) || r <= 0) return "—";
  if (Math.abs(r - 1) < 0.005) return L("Жылдамдық өзгермейді", "Скорость не изменится", "The rate does not change");
  var up = r > 1;
  var f = up ? r : 1 / r;
  var n = fmtAuto(f, 2);
  return up
    ? L("Жылдамдық " + n + " есе артады", "Скорость увеличится в " + n + " " + razWord(f), "The rate becomes " + n + "× faster")
    : L("Жылдамдық " + n + " есе кемиді", "Скорость уменьшится в " + n + " " + razWord(f), "The rate becomes " + n + "× slower");
}

/* ---------- Слайдтар тізімі ---------- */
var SLIDES = [
  { n: "", t: ["Басты бет", "Главная", "Home"] },
  { n: "", t: ["Реакция камерасы", "Реакционная камера", "Reaction chamber"] },
  { n: "01", t: ["Реакция жылдамдығы", "Скорость реакции", "Reaction rate"] },
  { n: "01", t: ["Орташа және лездік жылдамдық", "Средняя и мгновенная скорость", "Average and instantaneous rate"] },
  { n: "02", t: ["Соқтығысу теориясы", "Теория столкновений", "Collision theory"] },
  { n: "03", t: ["Энергетикалық диаграмма", "Энергетическая диаграмма", "Energy profile diagram"] },
  { n: "04", t: ["Жылдамдыққа әсер ететін факторлар", "Факторы, влияющие на скорость", "Factors affecting the rate"] },
  { n: "05", t: ["Кинетикалық теңдеу", "Кинетическое уравнение", "Rate law"] },
  { n: "06", t: ["Вант-Гофф және Аррениус", "Вант-Гофф и Аррениус", "Van 't Hoff and Arrhenius"] },
  { n: "07", t: ["Катализ", "Катализ", "Catalysis"] },
  { n: "07", t: ["Ферменттер және өнеркәсіп", "Ферменты и промышленность", "Enzymes and industry"] },
  { n: "08", t: ["Зертханалық жұмыстар", "Лабораторные работы", "Lab work"] },
  { n: "09", t: ["Есептер", "Задачи", "Problems"] },
  { n: "10", t: ["Тест", "Тест", "Quiz"] },
  { n: "11", t: ["Қосымша", "Приложение", "Appendix"] }
];
var DOC_TITLE = ["Химиялық реакция жылдамдығы", "Скорость химической реакции", "Rate of chemical reactions"];

/* ---------- Тіл ---------- */
var ATTRS = [["data-ia", "aria-label"], ["data-it", "title"], ["data-ip", "placeholder"]];

function collectKK() {
  document.querySelectorAll("[data-i]").forEach(function (el) { KK["t" + el.getAttribute("data-i")] = el.innerHTML; });
  ATTRS.forEach(function (p) {
    document.querySelectorAll("[" + p[0] + "]").forEach(function (el) { KK["a" + el.getAttribute(p[0])] = el.getAttribute(p[1]); });
  });
}

function setLang(lang, silent) {
  if (!I18N[lang] && lang !== "kk") lang = "kk";
  var prevDec = LANG === "en" ? "." : ",";
  LANG = lang;
  var dict = I18N[lang];
  document.querySelectorAll("[data-i]").forEach(function (el) {
    var i = el.getAttribute("data-i");
    var v = lang === "kk" ? KK["t" + i] : dict[i];
    if (v != null && el.innerHTML !== v) el.innerHTML = v;
  });
  ATTRS.forEach(function (p) {
    document.querySelectorAll("[" + p[0] + "]").forEach(function (el) {
      var i = el.getAttribute(p[0]);
      var v = lang === "kk" ? KK["a" + i] : dict[i];
      if (v != null) el.setAttribute(p[1], v);
    });
  });
  // Енгізілген сандардағы бөлгішті жаңа тілге сай ауыстыру.
  var dec = lang === "en" ? "." : ",";
  if (dec !== prevDec) {
    document.querySelectorAll('input[inputmode="decimal"]').forEach(function (inp) {
      if (!isNaN(parseNum(inp.value))) inp.value = inp.value.replace(/[.,]/, dec);
    });
  }
  document.documentElement.lang = lang;
  document.title = T3(DOC_TITLE);
  document.querySelectorAll(".lang button").forEach(function (b) {
    b.setAttribute("aria-pressed", String(b.getAttribute("data-lang") === lang));
  });
  try { localStorage.setItem("rate-lang", lang); } catch (e) {}
  if (!silent) document.dispatchEvent(new CustomEvent("langchange", { detail: { lang: lang } }));
}

/* ---------- Навигация ---------- */
var Nav = { cur: 0, slides: [], visited: {} };

function goSlide(i, focusEl) {
  var s = Nav.slides;
  if (!s.length) return;
  i = Math.max(0, Math.min(s.length - 1, i));
  var changed = i !== Nav.cur;
  if (changed) s[Nav.cur].classList.remove("active");
  s[i].classList.add("active");
  if (changed) s[i].scrollTop = 0;
  Nav.cur = i;
  Nav.visited[i] = true;
  updateNav();
  if (focusEl) {
    setTimeout(function () { try { focusEl.scrollIntoView({ block: "start" }); } catch (e) {} }, 30);
  }
  if (changed) document.dispatchEvent(new CustomEvent("slidechange", { detail: { index: i } }));
}

function updateNav() {
  var i = Nav.cur, info = SLIDES[i];
  var title = T3(info.t);
  $("navTitle").textContent = title;
  $("navCount").textContent = (i + 1) + " / " + Nav.slides.length;
  $("chapter").innerHTML = (info.n ? "<b>" + info.n + "</b>" : "") + title;
  $("prevBtn").disabled = i === 0;
  $("nextBtn").disabled = i === Nav.slides.length - 1;
  document.querySelectorAll("#dots .dot").forEach(function (d, k) {
    d.setAttribute("aria-current", String(k === i));
    d.classList.toggle("seen", !!Nav.visited[k] && k !== i);
    d.setAttribute("aria-label", (k + 1) + ". " + T3(SLIDES[k].t));
  });
  document.querySelectorAll("#menuList button").forEach(function (b, k) {
    b.setAttribute("aria-current", String(k === i));
    b.querySelector("strong").textContent = T3(SLIDES[k].t);
    b.querySelector("small").textContent = SLIDES[k].n ? L("Тарау ", "Глава ", "Chapter ") + SLIDES[k].n : "";
  });
  var cur = document.querySelector("#dots .dot[aria-current='true']");
  if (cur && cur.parentNode.scrollWidth > cur.parentNode.clientWidth) {
    var p = cur.parentNode;
    p.scrollLeft = cur.offsetLeft - p.clientWidth / 2 + cur.offsetWidth / 2;
  }
}

function slideIndexOf(el) {
  var s = el && el.closest ? el.closest(".slide") : null;
  return s ? Nav.slides.indexOf(s) : -1;
}

function openMenu(open) {
  var m = $("menu");
  m.classList.toggle("open", open);
  $("menuBtn").setAttribute("aria-expanded", String(open));
  if (open) {
    var b = document.querySelector("#menuList button[aria-current='true']") || document.querySelector("#menuList button");
    if (b) b.focus();
  } else {
    $("menuBtn").focus();
  }
}

function isTyping(t) {
  if (!t) return false;
  var tag = t.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || t.isContentEditable;
}

safe("i18n", function () {
  collectKK();
  document.querySelectorAll(".lang button").forEach(function (b) {
    b.addEventListener("click", function () { setLang(b.getAttribute("data-lang")); });
  });
  var saved = null;
  try { saved = localStorage.getItem("rate-lang"); } catch (e) {}
  setLang(saved && (saved === "kk" || I18N[saved]) ? saved : "kk", true);
});

safe("nav", function () {
  Nav.slides = Array.prototype.slice.call(document.querySelectorAll(".slide"));
  var dots = $("dots"), list = $("menuList"), tip = $("tip");

  Nav.slides.forEach(function (s, k) {
    var d = document.createElement("button");
    d.type = "button";
    d.className = "dot";
    d.textContent = k + 1;
    d.addEventListener("click", function () { goSlide(k); });
    d.addEventListener("mouseenter", function () {
      var r = d.getBoundingClientRect();
      tip.textContent = T3(SLIDES[k].t);
      tip.style.left = Math.max(80, Math.min(window.innerWidth - 80, r.left + r.width / 2)) + "px";
      tip.style.top = (r.top - 8) + "px";
      tip.style.display = "block";
    });
    d.addEventListener("mouseleave", function () { tip.style.display = "none"; });
    dots.appendChild(d);

    var li = document.createElement("li");
    li.innerHTML = '<button type="button"><span class="n">' + (k + 1) + '</span><span><strong></strong><small></small></span></button>';
    li.firstChild.addEventListener("click", function () { openMenu(false); goSlide(k); });
    list.appendChild(li);
  });

  $("prevBtn").addEventListener("click", function () { goSlide(Nav.cur - 1); });
  $("nextBtn").addEventListener("click", function () { goSlide(Nav.cur + 1); });
  $("menuBtn").addEventListener("click", function () { openMenu(!$("menu").classList.contains("open")); });
  $("menuClose").addEventListener("click", function () { openMenu(false); });
  $("menu").addEventListener("click", function (e) { if (e.target === $("menu")) openMenu(false); });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && $("menu").classList.contains("open")) { openMenu(false); return; }
    if (isTyping(e.target) || e.altKey || e.ctrlKey || e.metaKey) return;
    if ($("menu").classList.contains("open")) return;
    if (e.key === "ArrowRight" || e.key === "PageDown") { e.preventDefault(); goSlide(Nav.cur + 1); }
    else if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); goSlide(Nav.cur - 1); }
  });

  // Ішкі #сілтемелер: hash-қа жазбай, тиісті слайдқа өтеміз.
  document.addEventListener("click", function (e) {
    var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
    if (!a) return;
    var id = decodeURIComponent(a.getAttribute("href").slice(1));
    var el = id ? document.getElementById(id) : null;
    var k = slideIndexOf(el);
    e.preventDefault();
    if (k < 0) return;
    if ($("menu").classList.contains("open")) openMenu(false);
    goSlide(k, el && !el.classList.contains("slide") ? el : null);
  });

  // Саусақпен сырғыту (жүгірткі, canvas, кесте үстінде өшірулі).
  var sx = 0, sy = 0, st = 0, track = false;
  var stage = $("stage");
  stage.addEventListener("touchstart", function (e) {
    var t = e.target;
    track = e.touches.length === 1 && !(t.closest && t.closest('input[type="range"], canvas, table, .table-wrap, .formula, .no-swipe'));
    if (!track) return;
    sx = e.touches[0].clientX; sy = e.touches[0].clientY; st = Date.now();
  }, { passive: true });
  stage.addEventListener("touchend", function (e) {
    if (!track) return;
    track = false;
    var t = e.changedTouches[0];
    var dx = t.clientX - sx, dy = t.clientY - sy;
    if (Date.now() - st < 800 && Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) goSlide(Nav.cur + (dx < 0 ? 1 : -1));
  }, { passive: true });

  // Hash-ты тек бет ашылғанда оқимыз.
  var start = 0, target = null;
  try {
    var h = decodeURIComponent((location.hash || "").slice(1));
    if (/^\d+$/.test(h)) start = parseInt(h, 10) - 1;
    else if (h) {
      target = document.getElementById(h);
      var k = slideIndexOf(target);
      if (k >= 0) start = k; else target = null;
    }
  } catch (e) {}
  Nav.slides.forEach(function (s) { s.classList.remove("active"); });
  Nav.cur = Math.max(0, Math.min(Nav.slides.length - 1, start));
  Nav.slides[Nav.cur].classList.add("active");
  Nav.visited[Nav.cur] = true;
  updateNav();
  if (target && !target.classList.contains("slide")) setTimeout(function () { try { target.scrollIntoView(); } catch (e) {} }, 50);
  onLang(updateNav);
});

/* ---------- SVG көмекшілері ---------- */
function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
function svgText(x, y, s, cls, extra) {
  return '<text x="' + x + '" y="' + y + '" class="' + (cls || "ax-label") + '"' + (extra || "") + ">" + esc(s) + "</text>";
}
// Ось торы: x/y шкалалары, белгілер, атаулар.
function axes(o) {
  var g = "";
  o.yTicks.forEach(function (v) {
    var y = o.sy(v);
    g += '<line class="ax" x1="' + o.x0 + '" x2="' + o.x1 + '" y1="' + y + '" y2="' + y + '"/>';
    g += svgText(o.x0 - 8, y + 4, o.yFmt(v), "ax-label", ' text-anchor="end"');
  });
  o.xTicks.forEach(function (v) {
    var x = o.sx(v);
    g += svgText(x, o.y0 + 18, o.xFmt(v), "ax-label", ' text-anchor="middle"');
  });
  g += '<line class="ax-strong" x1="' + o.x0 + '" x2="' + o.x1 + '" y1="' + o.y0 + '" y2="' + o.y0 + '"/>';
  g += '<line class="ax-strong" x1="' + o.x0 + '" x2="' + o.x0 + '" y1="' + o.y1 + '" y2="' + o.y0 + '"/>';
  if (o.xTitle) g += svgText((o.x0 + o.x1) / 2, o.y0 + 38, o.xTitle, "ax-title", ' text-anchor="middle"');
  if (o.yTitle) g += svgText(14, (o.y0 + o.y1) / 2, o.yTitle, "ax-title", ' text-anchor="middle" transform="rotate(-90 14 ' + (o.y0 + o.y1) / 2 + ')"');
  return g;
}
function poly(pts) {
  return pts.map(function (p, i) { return (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1); }).join(" ");
}
