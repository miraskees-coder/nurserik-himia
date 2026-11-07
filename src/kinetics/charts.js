/* ================= Графиктер ================= */
var CH = { w: 640, h: 380, x0: 64, x1: 620, y1: 20, y0: 318 };
function svgOpen(label) {
  return '<svg viewBox="0 0 ' + CH.w + " " + CH.h + '" role="img" aria-label="' + esc(label) + '">';
}
function unitS() { return L("с", "с", "s"); }
function pct(x) {
  var v = x * 100;
  var s = v >= 10 ? fmt(v, 1) : v >= 1 ? fmt(v, 2) : v >= 0.01 ? fmt(v, 3) : fmtSci(v, 1);
  return s + (LANG === "en" ? "%" : " %");
}

/* ---------- C(t): хорда және жанама ---------- */
safe("chart-ct", function () {
  var el = $("ctChart"), r1 = $("ctT1"), r2 = $("ctT2"), rp = $("ctTp");
  var K = 0.05;
  function C(t) { return Math.exp(-K * t); }
  function sx(t) { return CH.x0 + t / 60 * (CH.x1 - CH.x0); }
  function sy(c) { return CH.y0 - c / 1.05 * (CH.y0 - CH.y1); }

  function draw(src) {
    var a = +r1.value, b = +r2.value, p = +rp.value;
    if (b <= a) {
      if (src === r1) { b = Math.min(60, a + 1); r2.value = b; if (b <= a) { a = b - 1; r1.value = a; } }
      else { a = Math.max(0, b - 1); r1.value = a; }
    }
    var ca = C(a), cb = C(b), cp = C(p);
    var avg = (ca - cb) / (b - a), inst = K * cp;
    var s = unitS();

    var g = svgOpen(L("Концентрацияның уақытқа тәуелділік графигі", "График зависимости концентрации от времени", "Graph of concentration against time"));
    g += '<defs><clipPath id="ctClip"><rect x="' + CH.x0 + '" y="' + CH.y1 + '" width="' + (CH.x1 - CH.x0) + '" height="' + (CH.y0 - CH.y1) + '"/></clipPath></defs>';
    g += axes({
      x0: CH.x0, x1: CH.x1, y0: CH.y0, y1: CH.y1, sx: sx, sy: sy,
      xTicks: [0, 10, 20, 30, 40, 50, 60], yTicks: [0, 0.2, 0.4, 0.6, 0.8, 1],
      xFmt: function (v) { return fmt(v); }, yFmt: function (v) { return fmt(v, 1); },
      xTitle: "t, " + s, yTitle: L("C, моль/л", "C, моль/л", "C, mol/L")
    });
    var pts = [];
    for (var t = 0; t <= 60.001; t += 0.5) pts.push([sx(t), sy(C(t))]);
    g += '<path d="' + poly(pts) + '" fill="none" stroke="var(--accent)" stroke-width="3"/>';
    g += '<g clip-path="url(#ctClip)">';
    var ea = a - 4, eb = b + 4;
    g += '<line x1="' + sx(ea) + '" y1="' + sy(ca + avg * 4) + '" x2="' + sx(eb) + '" y2="' + sy(cb - avg * 4) + '" stroke="var(--p-a)" stroke-width="2.5"/>';
    var d = 16;
    g += '<line x1="' + sx(p - d) + '" y1="' + sy(cp + inst * d) + '" x2="' + sx(p + d) + '" y2="' + sy(cp - inst * d) + '" stroke="var(--p-b)" stroke-width="2.5" stroke-dasharray="7 5"/>';
    g += "</g>";
    [[a, ca, "t₁", "var(--p-a)"], [b, cb, "t₂", "var(--p-a)"], [p, cp, "t", "var(--p-b)"]].forEach(function (q) {
      g += '<line x1="' + sx(q[0]) + '" x2="' + sx(q[0]) + '" y1="' + sy(q[1]) + '" y2="' + CH.y0 + '" stroke="' + q[3] + '" stroke-opacity=".35" stroke-dasharray="3 4"/>';
      g += '<circle cx="' + sx(q[0]) + '" cy="' + sy(q[1]) + '" r="6" fill="' + q[3] + '" stroke="var(--bg)" stroke-width="2"/>';
      g += svgText(sx(q[0]) + 8, sy(q[1]) - 10, q[2], "ax-title");
    });
    g += "</svg>";
    el.innerHTML = g;

    $("ctT1v").textContent = fmt(a) + " " + s;
    $("ctT2v").textContent = fmt(b) + " " + s;
    $("ctTpv").textContent = fmt(p) + " " + s;
    $("ctAvg").textContent = fmt(avg, 4);
    $("ctInst").textContent = fmt(inst, 4);
    $("ctNote").innerHTML =
      L("v<sub>орт</sub>", "v<sub>ср</sub>", "v<sub>avg</sub>") + " = (" + fmt(ca, 4) + " − " + fmt(cb, 4) + ") / " + fmt(b - a) + " = " + fmt(avg, 4) +
      "<br>v(" + fmt(p) + ") = " + fmt(K) + " · " + fmt(cp, 4) + " = " + fmt(inst, 4);
  }
  [r1, r2, rp].forEach(function (r) { r.addEventListener("input", function () { draw(r); }); });
  draw();
  onLang(function () { draw(); });
});

/* ---------- Максвелл–Больцман ---------- */
safe("chart-mb", function () {
  var el = $("mbChart"), rT = $("mbT"), rE = $("mbEa");
  var EMAX = 25;
  function f(E, T) {
    var kT = 0.008314 * T;
    return 2 / Math.sqrt(Math.PI) * Math.pow(kT, -1.5) * Math.sqrt(E) * Math.exp(-E / kT);
  }
  // Eₐ-дан жоғары үлес: Симпсон әдісі.
  function above(Ea, T) {
    var b = Ea + 40 * 0.008314 * T, n = 800, h = (b - Ea) / n, s = f(Ea, T) + f(b, T);
    for (var i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * f(Ea + i * h, T);
    return s * h / 3;
  }
  function draw() {
    var T = +rT.value, Ea = +rE.value;
    var peak = Math.max(f(0.008314 * 300 / 2, 300), f(0.008314 * T / 2, T)) * 1.12;
    function sx(E) { return CH.x0 + E / EMAX * (CH.x1 - CH.x0); }
    function sy(v) { return CH.y0 - v / peak * (CH.y0 - CH.y1); }
    var g = svgOpen(L("Максвелл–Больцман таралу графигі", "График распределения Максвелла–Больцмана", "Maxwell–Boltzmann distribution graph"));
    g += axes({
      x0: CH.x0, x1: CH.x1, y0: CH.y0, y1: CH.y1, sx: sx, sy: sy,
      xTicks: [0, 5, 10, 15, 20, 25], yTicks: [],
      xFmt: function (v) { return fmt(v); }, yFmt: function () { return ""; },
      xTitle: L("E, кДж/моль", "E, кДж/моль", "E, kJ/mol"), yTitle: L("Бөлшектер үлесі", "Доля частиц", "Fraction of particles")
    });
    var shade = [[sx(Ea), sy(0)]];
    for (var E = Ea; E <= EMAX + 0.001; E += 0.1) shade.push([sx(E), sy(f(E, T))]);
    shade.push([sx(EMAX), sy(0)]);
    g += '<path d="' + poly(shade) + ' Z" fill="var(--pink)" fill-opacity=".28"/>';
    function curve(TT, color, dash) {
      var pts = [];
      for (var E = 0; E <= EMAX + 0.001; E += 0.1) pts.push([sx(E), sy(f(E, TT))]);
      return '<path d="' + poly(pts) + '" fill="none" stroke="' + color + '" stroke-width="3"' + (dash ? ' stroke-dasharray="7 5"' : "") + "/>";
    }
    g += curve(300, "var(--p-a)", true);
    g += curve(T, "var(--pink)");
    g += '<line x1="' + sx(Ea) + '" x2="' + sx(Ea) + '" y1="' + CH.y1 + '" y2="' + CH.y0 + '" stroke="var(--text)" stroke-width="1.5" stroke-dasharray="4 4"/>';
    g += svgText(sx(Ea) + 6, CH.y1 + 14, "Eₐ = " + fmt(Ea, 1), "ax-title");
    g += '<rect x="' + (CH.x1 - 150) + '" y="' + (CH.y1 + 30) + '" width="150" height="50" rx="10" fill="var(--bg)" fill-opacity=".8"/>';
    g += '<line x1="' + (CH.x1 - 140) + '" x2="' + (CH.x1 - 116) + '" y1="' + (CH.y1 + 48) + '" y2="' + (CH.y1 + 48) + '" stroke="var(--p-a)" stroke-width="3" stroke-dasharray="6 4"/>';
    g += svgText(CH.x1 - 108, CH.y1 + 52, "300 K", "ax-label");
    g += '<line x1="' + (CH.x1 - 140) + '" x2="' + (CH.x1 - 116) + '" y1="' + (CH.y1 + 68) + '" y2="' + (CH.y1 + 68) + '" stroke="var(--pink)" stroke-width="3"/>';
    g += svgText(CH.x1 - 108, CH.y1 + 72, fmt(T) + " K", "ax-label");
    g += "</svg>";
    el.innerHTML = g;

    var f300 = above(Ea, 300), fT = above(Ea, T), ratio = fT / f300;
    var K = L("К", "К", "K");
    $("mbTv").textContent = fmt(T) + " " + K;
    $("mbEav").textContent = fmt(Ea, 1) + " " + L("кДж/моль", "кДж/моль", "kJ/mol");
    $("mbF300").textContent = pct(f300);
    $("mbFT").textContent = pct(fT);
    $("mbFTl").textContent = L("Eₐ-дан жоғары үлес, ", "доля выше Eₐ, ", "fraction above Eₐ, ") + fmt(T) + " " + K;
    var n = fmtAuto(ratio >= 1 ? ratio : 1 / ratio, 2);
    $("mbRatio").innerHTML = Math.abs(ratio - 1) < 0.005
      ? L("T = 300 К: қисықтар бірдей.", "T = 300 К: кривые совпадают.", "T = 300 K: the curves coincide.")
      : ratio > 1
        ? L(fmt(T) + " К-де энергиясы Eₐ-дан жоғары бөлшектер 300 К-ге қарағанда <b>" + n + " есе көп</b>.",
            "При " + fmt(T) + " К частиц с энергией выше Eₐ <b>в " + n + " " + razWord(ratio) + " больше</b>, чем при 300 К.",
            "At " + fmt(T) + " K there are <b>" + n + "× more</b> particles above Eₐ than at 300 K.")
        : L(fmt(T) + " К-де энергиясы Eₐ-дан жоғары бөлшектер 300 К-ге қарағанда <b>" + n + " есе аз</b>.",
            "При " + fmt(T) + " К частиц с энергией выше Eₐ <b>в " + n + " " + razWord(1 / ratio) + " меньше</b>, чем при 300 К.",
            "At " + fmt(T) + " K there are <b>" + n + "× fewer</b> particles above Eₐ than at 300 K.");
  }
  [rT, rE].forEach(function (r) { r.addEventListener("input", draw); });
  draw();
  onLang(draw);
});

/* ---------- Энергетикалық диаграмма ---------- */
safe("chart-ed", function () {
  var el = $("edChart"), bExo = $("edExo"), bEndo = $("edEndo"), cat = $("edCat");
  var exo = true;
  var X0 = 70, X1 = 612, Y0 = 330, Y1 = 30, EMAX = 160;
  function x(u) { return (X0 + u * (X1 - X0)).toFixed(1); }
  function y(e) { return (Y0 - e / EMAX * (Y0 - Y1)).toFixed(1); }
  function arrow(xu, e1, e2, color, label, side) {
    var xa = x(xu), ya = +y(e1), yb = +y(e2), dir = yb < ya ? 1 : -1;
    var s = '<line x1="' + xa + '" x2="' + xa + '" y1="' + ya + '" y2="' + (yb + dir * 6) + '" stroke="' + color + '" stroke-width="2"/>';
    s += '<path d="M' + (xa - 5) + " " + (yb + dir * 9) + " L" + xa + " " + yb + " L" + (+xa + 5) + " " + (yb + dir * 9) + '" fill="none" stroke="' + color + '" stroke-width="2"/>';
    var tx = side === "l" ? +xa - 8 : +xa + 8;
    s += svgText(tx, (ya + yb) / 2 + 4, label, "ax-title", ' fill="' + color + '" style="fill:' + color + '" text-anchor="' + (side === "l" ? "end" : "start") + '"');
    return s;
  }
  function dashH(u1, u2, e) {
    return '<line x1="' + x(u1) + '" x2="' + x(u2) + '" y1="' + y(e) + '" y2="' + y(e) + '" stroke="var(--muted)" stroke-opacity=".6" stroke-dasharray="4 4"/>';
  }
  function draw() {
    var R = exo ? 60 : 20, P = exo ? 20 : 60, PK = 140;
    var p1 = exo ? 100 : 95, p2 = exo ? 95 : 100, V = 75;
    var ea = PK - R, eaRev = PK - P, dH = P - R, eaCat = Math.max(p1, p2) - R;
    var kj = L("кДж/моль", "кДж/моль", "kJ/mol");

    var g = '<svg viewBox="0 0 640 380" role="img" aria-label="' + esc(L("Реакцияның энергетикалық диаграммасы", "Энергетическая диаграмма реакции", "Energy profile diagram of the reaction")) + '">';
    g += '<line class="ax-strong" x1="' + X0 + '" x2="' + X1 + '" y1="' + Y0 + '" y2="' + Y0 + '"/>';
    g += '<line class="ax-strong" x1="' + X0 + '" x2="' + X0 + '" y1="' + Y1 + '" y2="' + Y0 + '"/>';
    g += svgText(14, (Y0 + Y1) / 2, L("E, кДж/моль", "E, кДж/моль", "E, kJ/mol"), "ax-title", ' text-anchor="middle" transform="rotate(-90 14 ' + (Y0 + Y1) / 2 + ')"');
    g += svgText((X0 + X1) / 2, Y0 + 30, L("Реакция барысы →", "Ход реакции →", "Reaction progress →"), "ax-title", ' text-anchor="middle"');

    var main = "M" + x(0) + " " + y(R) + " L" + x(.15) + " " + y(R) +
      " C" + x(.32) + " " + y(R) + " " + x(.38) + " " + y(PK) + " " + x(.5) + " " + y(PK) +
      " C" + x(.62) + " " + y(PK) + " " + x(.68) + " " + y(P) + " " + x(.85) + " " + y(P) + " L" + x(1) + " " + y(P);
    g += '<path d="' + main + '" fill="none" stroke="var(--accent)" stroke-width="3.5"/>';
    if (cat.checked) {
      var cp = "M" + x(.15) + " " + y(R) +
        " C" + x(.25) + " " + y(R) + " " + x(.28) + " " + y(p1) + " " + x(.35) + " " + y(p1) +
        " C" + x(.42) + " " + y(p1) + " " + x(.43) + " " + y(V) + " " + x(.5) + " " + y(V) +
        " C" + x(.57) + " " + y(V) + " " + x(.58) + " " + y(p2) + " " + x(.65) + " " + y(p2) +
        " C" + x(.72) + " " + y(p2) + " " + x(.75) + " " + y(P) + " " + x(.85) + " " + y(P);
      g += '<path d="' + cp + '" fill="none" stroke="var(--p-a)" stroke-width="3" stroke-dasharray="8 6"/>';
      g += svgText(x(.5), +y(V) + 20, L("AK — аралық қосылыс", "AK — промежуточное соединение", "AK — intermediate"), "ax-label", ' text-anchor="middle" style="fill:var(--p-a)"');
    }
    g += dashH(.15, .97, R);
    g += dashH(.5, .62, P);
    g += dashH(.44, .56, PK);
    g += arrow(.47, R, PK, "var(--pink)", "Eₐ " + fmt(ea), "l");
    g += arrow(.6, P, PK, "var(--p-b)", L("Eₐ(кері) ", "Eₐ(обр.) ", "Eₐ(rev) ") + fmt(eaRev), "r");
    g += arrow(.93, R, P, "var(--ok)", "ΔH " + (dH > 0 ? "+" : "−") + fmt(Math.abs(dH)), "l");
    if (cat.checked) g += arrow(.24, R, Math.max(p1, p2), "var(--p-a)", "Eₐ(K) " + fmt(eaCat), "l");
    g += svgText(x(.5), +y(PK) - 12, L("активтендірілген комплекс ‡", "активированный комплекс ‡", "activated complex ‡"), "ax-title", ' text-anchor="middle"');
    g += svgText(x(.01), +y(R) + 22, L("бастапқы заттар", "исходные вещества", "reactants"), "ax-label");
    g += svgText(x(.99), +y(P) + 22, L("өнімдер", "продукты", "products"), "ax-label", ' text-anchor="end"');
    g += "</svg>";
    el.innerHTML = g;

    var info = exo
      ? L("<b>Экзотермиялық:</b> ΔH = −" + fmt(-dH) + " " + kj + " (жылу бөлінеді). Eₐ(кері) = " + fmt(ea) + " + |−" + fmt(-dH) + "| = " + fmt(eaRev) + " " + kj + ".",
          "<b>Экзотермическая:</b> ΔH = −" + fmt(-dH) + " " + kj + " (теплота выделяется). Eₐ(обр.) = " + fmt(ea) + " + |−" + fmt(-dH) + "| = " + fmt(eaRev) + " " + kj + ".",
          "<b>Exothermic:</b> ΔH = −" + fmt(-dH) + " " + kj + " (heat is released). Eₐ(rev) = " + fmt(ea) + " + |−" + fmt(-dH) + "| = " + fmt(eaRev) + " " + kj + ".")
      : L("<b>Эндотермиялық:</b> ΔH = +" + fmt(dH) + " " + kj + " (жылу сіңіріледі). Eₐ(кері) = " + fmt(ea) + " − " + fmt(dH) + " = " + fmt(eaRev) + " " + kj + ".",
          "<b>Эндотермическая:</b> ΔH = +" + fmt(dH) + " " + kj + " (теплота поглощается). Eₐ(обр.) = " + fmt(ea) + " − " + fmt(dH) + " = " + fmt(eaRev) + " " + kj + ".",
          "<b>Endothermic:</b> ΔH = +" + fmt(dH) + " " + kj + " (heat is absorbed). Eₐ(rev) = " + fmt(ea) + " − " + fmt(dH) + " = " + fmt(eaRev) + " " + kj + ".");
    if (cat.checked) info += "<br>" + L(
      "Катализатормен жол екі сатылы: Eₐ " + fmt(ea) + "-ден " + fmt(eaCat) + " " + kj + "-ге төмендеді, ал ΔH өзгерген жоқ.",
      "С катализатором путь двухстадийный: Eₐ снизилась с " + fmt(ea) + " до " + fmt(eaCat) + " " + kj + ", а ΔH не изменилась.",
      "With the catalyst the path has two steps: Eₐ drops from " + fmt(ea) + " to " + fmt(eaCat) + " " + kj + ", while ΔH stays the same.");
    $("edInfo").innerHTML = info;
    bExo.setAttribute("aria-pressed", String(exo));
    bEndo.setAttribute("aria-pressed", String(!exo));
  }
  bExo.addEventListener("click", function () { exo = true; draw(); });
  bEndo.addEventListener("click", function () { exo = false; draw(); });
  cat.addEventListener("change", draw);
  draw();
  onLang(draw);
});

/* ---------- 0/1/2 реттер ---------- */
safe("chart-orders", function () {
  var el = $("ordChart"), k = 0.035;
  function sx(t) { return CH.x0 + t / 60 * (CH.x1 - CH.x0); }
  function sy(c) { return CH.y0 - c / 1.05 * (CH.y0 - CH.y1); }
  var series = [
    { c: "var(--p-a)", f: function (t) { return Math.max(0, 1 - k * t); }, h: 1 / (2 * k) },
    { c: "var(--accent)", f: function (t) { return Math.exp(-k * t); }, h: Math.LN2 / k },
    { c: "var(--p-b)", f: function (t) { return 1 / (1 + k * t); }, h: 1 / k }
  ];
  function draw() {
    var s = unitS();
    var g = svgOpen(L("0, 1 және 2-ретті реакциялардың C(t) қисықтары", "Кривые C(t) для реакций 0, 1 и 2 порядка", "C(t) curves for zero-, first- and second-order reactions"));
    g += axes({
      x0: CH.x0, x1: CH.x1, y0: CH.y0, y1: CH.y1, sx: sx, sy: sy,
      xTicks: [0, 10, 20, 30, 40, 50, 60], yTicks: [0, 0.25, 0.5, 0.75, 1],
      xFmt: function (v) { return fmt(v); }, yFmt: function (v) { return fmt(v, 2); },
      xTitle: "t, " + s, yTitle: L("C, моль/л", "C, моль/л", "C, mol/L")
    });
    g += '<line x1="' + CH.x0 + '" x2="' + CH.x1 + '" y1="' + sy(0.5) + '" y2="' + sy(0.5) + '" stroke="var(--muted)" stroke-opacity=".5" stroke-dasharray="4 4"/>';
    g += svgText(CH.x1 - 4, sy(0.5) - 6, "C₀/2", "ax-label", ' text-anchor="end"');
    series.forEach(function (o, i) {
      var pts = [];
      for (var t = 0; t <= 60.001; t += 0.5) pts.push([sx(t), sy(o.f(t))]);
      g += '<path d="' + poly(pts) + '" fill="none" stroke="' + o.c + '" stroke-width="3"/>';
      g += '<line x1="' + sx(o.h) + '" x2="' + sx(o.h) + '" y1="' + sy(0.5) + '" y2="' + CH.y0 + '" stroke="' + o.c + '" stroke-dasharray="3 4"/>';
      g += '<circle cx="' + sx(o.h) + '" cy="' + sy(0.5) + '" r="5" fill="' + o.c + '" stroke="var(--bg)" stroke-width="2"/>';
      g += svgText(sx(o.h) + 5, CH.y0 - 10 - i * 18, "t½ = " + fmt(o.h, 1) + " " + s, "ax-label", ' style="fill:' + o.c + '"');
    });
    g += "</svg>";
    el.innerHTML = g;
  }
  draw();
  onLang(draw);
});

/* ---------- Фермент белсенділігі ---------- */
safe("chart-enz", function () {
  var el = $("enzChart");
  function a(T) { return Math.pow(2, (T - 37) / 10) / (1 + Math.exp((T - 40.7) / 2)); }
  var peak = 0;
  for (var T = 0; T <= 70; T += 0.25) peak = Math.max(peak, a(T));
  function sx(t) { return CH.x0 + t / 70 * (CH.x1 - CH.x0); }
  function sy(v) { return CH.y0 - v / (peak * 1.15) * (CH.y0 - CH.y1); }
  function draw() {
    var g = svgOpen(L("Фермент белсенділігінің температураға тәуелділігі", "Зависимость активности фермента от температуры", "Enzyme activity against temperature"));
    g += axes({
      x0: CH.x0, x1: CH.x1, y0: CH.y0, y1: CH.y1, sx: sx, sy: sy,
      xTicks: [0, 10, 20, 30, 40, 50, 60, 70], yTicks: [],
      xFmt: function (v) { return fmt(v); }, yFmt: function () { return ""; },
      xTitle: "t, °C", yTitle: L("Белсенділік", "Активность", "Activity")
    });
    var pts = [];
    for (var T = 0; T <= 70; T += 0.5) pts.push([sx(T), sy(a(T))]);
    g += '<path d="' + poly(pts) + ' L' + sx(70) + " " + CH.y0 + " L" + sx(0) + " " + CH.y0 + ' Z" fill="var(--accent)" fill-opacity=".14"/>';
    g += '<path d="' + poly(pts) + '" fill="none" stroke="var(--accent)" stroke-width="3"/>';
    g += '<line x1="' + sx(37) + '" x2="' + sx(37) + '" y1="' + CH.y1 + '" y2="' + CH.y0 + '" stroke="var(--pink)" stroke-dasharray="4 4"/>';
    g += svgText(sx(37) - 8, CH.y1 + 14, L("оптимум 37 °C", "оптимум 37 °C", "optimum 37 °C"), "ax-title", ' text-anchor="end"');
    g += svgText(sx(55), sy(peak * 0.35), L("денатурация", "денатурация", "denaturation"), "ax-label", ' text-anchor="middle"');
    g += "</svg>";
    el.innerHTML = g;
  }
  draw();
  onLang(draw);
});
