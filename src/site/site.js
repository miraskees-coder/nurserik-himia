/* ================= Платформа: тіл, тақырып, қолжетімділік, мәзір ================= */
var LANG = "kk";
var KK = {};
function L(kk, ru, en) { return LANG === "ru" ? ru : LANG === "en" ? en : kk; }
function safe(name, fn) { try { fn(); } catch (e) { if (window.console) console.error("[" + name + "]", e); } }
function $(id) { return document.getElementById(id); }
function store(key, val) {
  try { if (val === undefined) return localStorage.getItem(key); localStorage.setItem(key, val); } catch (e) {}
  return null;
}
function fmt(x, d) {
  if (typeof x !== "number" || !isFinite(x)) return "—";
  var s = Math.abs(x).toFixed(d == null ? 2 : d);
  if (s.indexOf(".") >= 0) s = s.replace(/0+$/, "").replace(/\.$/, "");
  var p = s.split("."), en = LANG === "en";
  if (p[0].length > (en ? 3 : 4)) p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, en ? "," : " ");
  return (x < 0 && s !== "0" ? "−" : "") + p[0] + (p[1] ? (en ? "." : ",") + p[1] : "");
}

var ATTRS = [["data-ia", "aria-label"], ["data-it", "title"], ["data-ip", "placeholder"]];
var PAGE_TITLE = null;

function setLang(lang, silent) {
  if (lang !== "kk" && !I18N[lang]) lang = "kk";
  LANG = lang;
  var dict = I18N[lang];
  document.querySelectorAll("[data-i]").forEach(function (el) {
    var i = el.getAttribute("data-i"), v = lang === "kk" ? KK["t" + i] : dict[i];
    if (v != null && el.innerHTML !== v) el.innerHTML = v;
  });
  ATTRS.forEach(function (p) {
    document.querySelectorAll("[" + p[0] + "]").forEach(function (el) {
      var i = el.getAttribute(p[0]), v = lang === "kk" ? KK["a" + i] : dict[i];
      if (v != null) el.setAttribute(p[1], v);
    });
  });
  document.documentElement.lang = lang;
  if (PAGE_TITLE) document.title = L(PAGE_TITLE[0], PAGE_TITLE[1], PAGE_TITLE[2]);
  document.querySelectorAll(".lang-seg button").forEach(function (b) {
    b.setAttribute("aria-pressed", String(b.getAttribute("data-lang") === lang));
  });
  store("nc-lang", lang);
  if (!silent) document.dispatchEvent(new CustomEvent("langchange", { detail: { lang: lang } }));
}
function onLang(fn) { document.addEventListener("langchange", function () { safe("langchange", fn); }); }

safe("i18n", function () {
  var t = document.querySelector('meta[name="nc-title"]');
  if (t) PAGE_TITLE = t.getAttribute("content").split("‖");
  document.querySelectorAll("[data-i]").forEach(function (el) { KK["t" + el.getAttribute("data-i")] = el.innerHTML; });
  ATTRS.forEach(function (p) {
    document.querySelectorAll("[" + p[0] + "]").forEach(function (el) { KK["a" + el.getAttribute(p[0])] = el.getAttribute(p[1]); });
  });
  document.querySelectorAll(".lang-seg button").forEach(function (b) {
    b.addEventListener("click", function () { setLang(b.getAttribute("data-lang")); });
  });
  var saved = store("nc-lang");
  setLang(saved === "ru" || saved === "en" ? saved : "kk", true);
});

/* ---------- Тақырып және қолжетімділік ---------- */
safe("prefs", function () {
  var root = document.documentElement, btn = $("prefsBtn"), pop = $("prefs");
  function applyTheme(v) {
    if (v === "light" || v === "dark") root.setAttribute("data-theme", v); else root.removeAttribute("data-theme");
    document.querySelectorAll("[data-theme-set]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-theme-set") === (v || "system")));
    });
  }
  var flags = { large: "data-large", contrast: "data-contrast", calm: "data-calm" };
  function applyA11y(key, on) {
    if (on) root.setAttribute(flags[key], ""); else root.removeAttribute(flags[key]);
  }
  applyTheme(store("nc-theme") || "system");
  document.querySelectorAll("[data-a11y]").forEach(function (c) {
    var k = c.getAttribute("data-a11y");
    c.checked = store("nc-" + k) === "1";
    applyA11y(k, c.checked);
    c.addEventListener("change", function () {
      applyA11y(k, c.checked);
      store("nc-" + k, c.checked ? "1" : "0");
      document.dispatchEvent(new CustomEvent("prefschange"));
    });
  });
  document.querySelectorAll("[data-theme-set]").forEach(function (b) {
    b.addEventListener("click", function () {
      var v = b.getAttribute("data-theme-set");
      store("nc-theme", v);
      applyTheme(v);
      document.dispatchEvent(new CustomEvent("prefschange"));
    });
  });
  function toggle(open) {
    pop.hidden = !open;
    btn.setAttribute("aria-expanded", String(open));
  }
  btn.addEventListener("click", function (e) { e.stopPropagation(); toggle(pop.hidden); });
  pop.addEventListener("click", function (e) { e.stopPropagation(); });
  document.addEventListener("click", function () { if (!pop.hidden) toggle(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !pop.hidden) { toggle(false); btn.focus(); } });
});

/* ---------- Мобильді мәзір және белсенді бөлім ---------- */
safe("menu", function () {
  var nav = $("mainNav"), btn = $("menuToggle");
  btn.addEventListener("click", function () {
    var open = !nav.classList.contains("open");
    nav.classList.toggle("open", open);
    btn.setAttribute("aria-expanded", String(open));
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && nav.classList.contains("open")) { nav.classList.remove("open"); btn.setAttribute("aria-expanded", "false"); btn.focus(); }
  });
  var page = document.body.getAttribute("data-page");
  var cur = page && nav.querySelector('[data-nav="' + page + '"]');
  if (cur) cur.setAttribute("aria-current", "page");
});

function reducedMotion() {
  var calm = document.documentElement.hasAttribute("data-calm");
  try { return calm || window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return calm; }
}
