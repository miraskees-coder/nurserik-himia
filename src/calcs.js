/* ================= Калькуляторлар ================= */
function readField(id) {
  var el = $(id), v = parseNum(el.value);
  el.classList.toggle("err", isNaN(v));
  return v;
}
function showRes(el, big, sub) {
  el.classList.remove("err");
  el.innerHTML = '<div class="big">' + big + "</div>" + (sub ? '<div class="sub">' + sub + "</div>" : "");
}
function showErr(el, msg) {
  el.classList.add("err");
  el.innerHTML = '<div class="sub">' + (msg || L("Сандарды дұрыс енгізіңіз (үтір немесе нүкте қолдануға болады).", "Введите числа правильно (можно с запятой или точкой).", "Please enter valid numbers (comma or dot both work).")) + "</div>";
}
function sup(s) { return "<sup>" + s + "</sup>"; }

/* ---------- Вант-Гофф ---------- */
safe("calc-vh", function () {
  var res = $("vhRes");
  function calc() {
    var g = readField("vhG"), t1 = readField("vhT1"), t2 = readField("vhT2");
    var tauEl = $("vhTau"), tau = tauEl.value.trim() === "" ? NaN : readField("vhTau");
    if (tauEl.value.trim() === "") tauEl.classList.remove("err");
    if ([g, t1, t2].some(isNaN)) return showErr(res);
    if (g <= 0) return showErr(res, L("γ оң сан болуы керек.", "γ должен быть положительным.", "γ must be positive."));
    var ratio = Math.pow(g, (t2 - t1) / 10);
    var sub = "v₂/v₁ = " + fmt(g, 3) + sup("(" + fmt(t2) + " − " + fmt(t1) + ")/10") + " = " + fmt(g, 3) + sup(fmt((t2 - t1) / 10, 2)) + " = " + fmtAuto(ratio, 2);
    if (!isNaN(tau) && tau > 0) {
      var s = L(" с", " с", " s");
      sub += "<br>" + L("Реакция уақыты", "Время реакции", "Reaction time") + ": τ₂ = " + fmt(tau, 2) + " / " + fmtAuto(ratio, 2) + " = <b>" + fmtAuto(tau / ratio, 2) + s + "</b>";
    }
    showRes(res, rateChange(ratio), sub);
  }
  ["vhG", "vhT1", "vhT2", "vhTau"].forEach(function (id) { $(id).addEventListener("input", calc); });
  calc();
  onLang(calc);
});

/* ---------- Аррениус ---------- */
safe("calc-ar", function () {
  var res = $("arRes"), mode = "k", R = 8.314;
  function calc() {
    $("arEaF").hidden = mode !== "k";
    $("arRF").hidden = mode !== "e";
    $("arModeK").setAttribute("aria-pressed", String(mode === "k"));
    $("arModeE").setAttribute("aria-pressed", String(mode === "e"));
    var t1 = readField("arT1"), t2 = readField("arT2");
    var T1 = t1 + 273.15, T2 = t2 + 273.15;
    var kelvin = "T₁ = " + fmt(T1, 2) + " K, T₂ = " + fmt(T2, 2) + " K";
    if (isNaN(t1) || isNaN(t2)) return showErr(res);
    if (T1 <= 0 || T2 <= 0) return showErr(res, L("Температура −273,15 °C-тан жоғары болуы керек.", "Температура должна быть выше −273,15 °C.", "Temperature must be above −273.15 °C."));
    var inv = 1 / T1 - 1 / T2;
    if (mode === "k") {
      var ea = readField("arEa");
      if (isNaN(ea)) return showErr(res);
      var ln = ea * 1000 / R * inv, ratio = Math.exp(ln);
      showRes(res, "k₂/k₁ ≈ " + fmtAuto(ratio, 2),
        kelvin + "<br>ln(k₂/k₁) = " + fmt(ea * 1000, 0) + " / " + fmt(R, 3) + " · (1/" + fmt(T1, 2) + " − 1/" + fmt(T2, 2) + ") = " + fmt(ln, 4) + "<br>" + rateChange(ratio));
    } else {
      var r = readField("arR");
      if (isNaN(r)) return showErr(res);
      if (r <= 0) return showErr(res, L("k₂/k₁ оң сан болуы керек.", "k₂/k₁ должно быть положительным.", "k₂/k₁ must be positive."));
      if (Math.abs(inv) < 1e-12) return showErr(res, L("t₁ мен t₂ әртүрлі болуы керек.", "t₁ и t₂ должны различаться.", "t₁ and t₂ must differ."));
      var E = R * Math.log(r) / inv;
      showRes(res, "Eₐ ≈ " + fmt(E / 1000, 1) + L(" кДж/моль", " кДж/моль", " kJ/mol"),
        kelvin + "<br>Eₐ = " + fmt(R, 3) + " · ln " + fmt(r, 3) + " / (1/" + fmt(T1, 2) + " − 1/" + fmt(T2, 2) + ") = " + fmt(E, 0) + L(" Дж/моль", " Дж/моль", " J/mol"));
    }
  }
  $("arModeK").addEventListener("click", function () { mode = "k"; calc(); });
  $("arModeE").addEventListener("click", function () { mode = "e"; calc(); });
  ["arEa", "arR", "arT1", "arT2"].forEach(function (id) { $(id).addEventListener("input", calc); });
  calc();
  onLang(calc);
});

/* ---------- Әрекеттесуші массалар заңы ---------- */
safe("calc-ma", function () {
  var RX = [
    { sp: [["NO", 2], ["O₂", 1]] },
    { sp: [["H₂", 1], ["I₂", 1]] },
    { sp: [["SO₂", 2], ["O₂", 1]] },
    { sp: [["O₂", 1]], solid: true }
  ];
  var box = $("maFields"), res = $("maRes"), sel = $("maRx");
  var values = {};
  function build() {
    var rx = RX[+sel.value];
    box.innerHTML = "";
    rx.sp.forEach(function (s, i) {
      var id = "maC" + i, key = sel.value + ":" + i;
      var lab = document.createElement("label");
      lab.className = "field";
      lab.innerHTML = '<span class="ma-lab"></span><input type="text" inputmode="decimal" id="' + id + '">';
      var inp = lab.querySelector("input");
      inp.value = values[key] != null ? values[key] : (+sel.value === 0 && i === 0 ? "3" : "1");
      inp.addEventListener("input", function () { values[key] = inp.value; calc(); });
      box.appendChild(lab);
    });
    labels();
    calc();
  }
  function labels() {
    var rx = RX[+sel.value];
    box.querySelectorAll(".ma-lab").forEach(function (el, i) {
      el.textContent = L("[" + rx.sp[i][0] + "] неше есе артады", "Во сколько раз растёт [" + rx.sp[i][0] + "]", "[" + rx.sp[i][0] + "] multiplied by");
    });
  }
  function calc() {
    var rx = RX[+sel.value];
    var law = "v = k · " + rx.sp.map(function (s) { return "[" + s[0] + "]" + (s[1] > 1 ? sup(s[1]) : ""); }).join(" · ");
    var p = readField("maP");
    var mult = rx.sp.map(function (s, i) { return readField("maC" + i); });
    if (isNaN(p) || mult.some(isNaN)) return showErr(res);
    if (p <= 0 || mult.some(function (m) { return m <= 0; })) return showErr(res, L("Көбейткіштер оң сан болуы керек.", "Множители должны быть положительными.", "Multipliers must be positive."));
    var ratio = 1, parts = [];
    rx.sp.forEach(function (s, i) {
      var m = mult[i] * p;
      ratio *= Math.pow(m, s[1]);
      parts.push(fmt(m, 3) + (s[1] > 1 ? sup(s[1]) : ""));
    });
    var sub = law + "<br>v₂/v₁ = " + parts.join(" · ") + " = " + fmtAuto(ratio, 2);
    if (p !== 1) sub += "<br>" + L("Қысым " + fmt(p, 2) + " есе өзгергенде әр газдың концентрациясы да " + fmt(p, 2) + " есе өзгереді.",
      "При изменении давления в " + fmt(p, 2) + " " + razWord(p) + " концентрация каждого газа меняется во столько же раз.",
      "Changing the pressure " + fmt(p, 2) + "× changes the concentration of each gas by the same factor.");
    if (rx.solid) sub += "<br>" + L("Көмір — қатты зат, ол теңдеуге жазылмайды.", "Уголь — твёрдое вещество, в уравнение не входит.", "Carbon is a solid, so it is left out of the rate law.");
    showRes(res, rateChange(ratio), sub);
  }
  sel.addEventListener("change", build);
  $("maP").addEventListener("input", calc);
  build();
  onLang(function () { labels(); calc(); });
});
