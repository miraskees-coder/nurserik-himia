/* ================= Зертхана журналы ================= */
safe("lab", function () {
  var rows = Array.prototype.slice.call(document.querySelectorAll("#labBody tr"));
  var VOL = [50, 40, 30, 20, 10];
  var el = $("labChart"), res = $("labRes");

  function calc() {
    var pts = [];
    rows.forEach(function (tr, i) {
      var inp = tr.querySelector("input"), out = tr.querySelector("[data-out]");
      var t = parseNum(inp.value), ok = !isNaN(t) && t > 0;
      inp.classList.toggle("err", !ok && inp.value.trim() !== "");
      out.textContent = ok ? fmt(1000 / t, 1) : "—";
      if (ok) pts.push([VOL[i], 1000 / t]);
    });

    var fit = null;
    if (pts.length >= 2) {
      var n = pts.length, sx = 0, sy = 0, sxx = 0, sxy = 0;
      pts.forEach(function (p) { sx += p[0]; sy += p[1]; sxx += p[0] * p[0]; sxy += p[0] * p[1]; });
      var den = n * sxx - sx * sx;
      if (den !== 0) {
        var a = (n * sxy - sx * sy) / den, b = (sy - a * sx) / n, my = sy / n, ssr = 0, sst = 0;
        pts.forEach(function (p) { var f = a * p[0] + b; ssr += (p[1] - f) * (p[1] - f); sst += (p[1] - my) * (p[1] - my); });
        fit = { a: a, b: b, r2: sst ? 1 - ssr / sst : 1 };
      }
    }

    var ymax = 10;
    pts.forEach(function (p) { ymax = Math.max(ymax, p[1]); });
    ymax = Math.ceil(ymax * 1.15 / 10) * 10;
    function sxf(v) { return CH.x0 + v / 55 * (CH.x1 - CH.x0); }
    function syf(v) { return CH.y0 - v / ymax * (CH.y0 - CH.y1); }
    var step = ymax > 100 ? 50 : ymax > 50 ? 20 : 10, yt = [];
    for (var y = 0; y <= ymax; y += step) yt.push(y);
    var g = svgOpen(L("1000/t шамасының Na₂S₂O₃ көлеміне тәуелділігі", "Зависимость 1000/t от объёма Na₂S₂O₃", "1000/t against the volume of Na₂S₂O₃"));
    g += '<defs><clipPath id="labClip"><rect x="' + CH.x0 + '" y="' + CH.y1 + '" width="' + (CH.x1 - CH.x0) + '" height="' + (CH.y0 - CH.y1) + '"/></clipPath></defs>';
    g += axes({
      x0: CH.x0, x1: CH.x1, y0: CH.y0, y1: CH.y1, sx: sxf, sy: syf,
      xTicks: [0, 10, 20, 30, 40, 50], yTicks: yt,
      xFmt: function (v) { return fmt(v); }, yFmt: function (v) { return fmt(v); },
      xTitle: L("V(Na₂S₂O₃), мл", "V(Na₂S₂O₃), мл", "V(Na₂S₂O₃), mL"), yTitle: "1000/t"
    });
    if (fit) g += '<line clip-path="url(#labClip)" x1="' + sxf(0) + '" y1="' + syf(fit.b) + '" x2="' + sxf(55) + '" y2="' + syf(fit.a * 55 + fit.b) + '" stroke="var(--pink)" stroke-width="2.5" stroke-dasharray="8 5"/>';
    pts.forEach(function (p) {
      g += '<circle cx="' + sxf(p[0]) + '" cy="' + syf(p[1]) + '" r="7" fill="var(--p-a)" stroke="var(--bg)" stroke-width="2"/>';
    });
    g += "</svg>";
    el.innerHTML = g;

    if (!fit) {
      res.classList.add("err");
      res.innerHTML = '<div class="sub">' + L("Түзу салу үшін кемінде екі оң уақыт мәнін енгізіңіз.", "Для построения прямой введите хотя бы два положительных значения времени.", "Enter at least two positive times to draw the line.") + "</div>";
      return;
    }
    res.classList.remove("err");
    var sign = fit.b < 0 ? " − " : " + ";
    var good = fit.r2 >= 0.98;
    res.innerHTML = '<div class="big">R² = ' + fmt(fit.r2, 4) + "</div>" +
      '<div class="sub">1000/t = ' + fmt(fit.a, 3) + "·V" + sign + fmt(Math.abs(fit.b), 2) + "<br>" +
      (good
        ? L("Нүктелер түзуге жақсы түседі: жылдамдық Na₂S₂O₃ концентрациясына тура пропорционал, яғни реакция осы зат бойынша 1-ретті.",
            "Точки хорошо ложатся на прямую: скорость прямо пропорциональна концентрации Na₂S₂O₃, то есть реакция по этому веществу первого порядка.",
            "The points fit a straight line well: the rate is directly proportional to the Na₂S₂O₃ concentration, so the reaction is first order in this substance.")
        : L("Нүктелер түзуден ауытқиды. Өлшеулерді тексеріңіз: секундомер, температура, крестің көрінуі бірдей ме?",
            "Точки отклоняются от прямой. Проверьте измерения: одинаковы ли секундомер, температура, видимость креста?",
            "The points stray from the line. Check your measurements: were the timing, temperature and view of the cross the same each time?")) + "</div>";
  }
  rows.forEach(function (tr) { tr.querySelector("input").addEventListener("input", calc); });
  calc();
  onLang(calc);
});
