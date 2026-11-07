/* ================= Есептер сүзгісі ================= */
safe("problems", function () {
  var btns = document.querySelectorAll("#probFilter button");
  btns.forEach(function (b) {
    b.addEventListener("click", function () {
      var lv = b.getAttribute("data-lv");
      btns.forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
      document.querySelectorAll("#probList .prob").forEach(function (p) {
        p.hidden = lv !== "all" && p.getAttribute("data-level") !== lv;
      });
    });
  });
});

/* ================= Үш тілдегі сөздік ================= */
var GLOSSARY = [
  ["реакция жылдамдығы", "скорость реакции", "reaction rate"],
  ["концентрация", "концентрация", "concentration"],
  ["орташа жылдамдық", "средняя скорость", "average rate"],
  ["лездік жылдамдық", "мгновенная скорость", "instantaneous rate"],
  ["гомогенді реакция", "гомогенная реакция", "homogeneous reaction"],
  ["гетерогенді реакция", "гетерогенная реакция", "heterogeneous reaction"],
  ["фаза", "фаза", "phase"],
  ["соқтығысу теориясы", "теория столкновений", "collision theory"],
  ["тиімді соқтығысу", "эффективное столкновение", "effective collision"],
  ["активтендіру энергиясы", "энергия активации", "activation energy"],
  ["активтендірілген комплекс", "активированный комплекс", "activated complex"],
  ["энергетикалық диаграмма", "энергетическая диаграмма", "energy profile diagram"],
  ["экзотермиялық реакция", "экзотермическая реакция", "exothermic reaction"],
  ["эндотермиялық реакция", "эндотермическая реакция", "endothermic reaction"],
  ["жылдамдық константасы", "константа скорости", "rate constant"],
  ["кинетикалық теңдеу", "кинетическое уравнение", "rate law (rate equation)"],
  ["әрекеттесуші массалар заңы", "закон действующих масс", "law of mass action"],
  ["реакция реті", "порядок реакции", "reaction order"],
  ["молекулалық", "молекулярность", "molecularity"],
  ["шектеуші саты", "лимитирующая стадия", "rate-determining step"],
  ["жартылай ыдырау периоды", "период полупревращения", "half-life"],
  ["температуралық коэффициент", "температурный коэффициент", "temperature coefficient"],
  ["катализатор", "катализатор", "catalyst"],
  ["ингибитор", "ингибитор", "inhibitor"],
  ["фермент", "фермент", "enzyme"],
  ["промотор", "промотор", "promoter"],
  ["каталитикалық у", "каталитический яд", "catalyst poison"]
];

safe("glossary", function () {
  var body = $("glBody"), input = $("glSearch"), count = $("glCount");
  function mark(s, q) {
    var e = esc(s);
    if (!q) return e;
    var i = s.toLowerCase().indexOf(q);
    if (i < 0) return e;
    return esc(s.slice(0, i)) + "<mark>" + esc(s.slice(i, i + q.length)) + "</mark>" + esc(s.slice(i + q.length));
  }
  function render() {
    var q = input.value.trim().toLowerCase(), html = "", n = 0;
    GLOSSARY.forEach(function (row, i) {
      if (q && !row.some(function (s) { return s.toLowerCase().indexOf(q) >= 0; })) return;
      n++;
      html += "<tr><td class=\"muted\">" + (i + 1) + "</td><td>" + mark(row[0], q) + "</td><td>" + mark(row[1], q) + "</td><td>" + mark(row[2], q) + "</td></tr>";
    });
    if (!n) html = '<tr><td colspan="4" class="muted">' + esc(L("Ештеңе табылмады.", "Ничего не найдено.", "Nothing found.")) + "</td></tr>";
    body.innerHTML = html;
    count.textContent = L("Табылды: ", "Найдено: ", "Found: ") + n + " / " + GLOSSARY.length;
  }
  input.addEventListener("input", render);
  render();
  onLang(render);
});
