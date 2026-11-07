/* ================= Тест ================= */
var QUIZ = [
  { q: ["Гомогенді реакция жылдамдығының өлшем бірлігі:", "Единица измерения скорости гомогенной реакции:", "The unit of the rate of a homogeneous reaction is:"],
    o: [["моль/(л·с)", "моль/(л·с)", "mol/(L·s)"], ["моль/с", "моль/с", "mol/s"], ["л/(моль·с)", "л/(моль·с)", "L/(mol·s)"], ["моль/л", "моль/л", "mol/L"]], a: 0,
    e: ["v = ΔC/Δt: концентрация (моль/л) уақытқа (с) бөлінеді.", "v = ΔC/Δt: концентрация (моль/л) делится на время (с).", "v = ΔC/Δt: concentration (mol/L) divided by time (s)."] },
  { q: ["Қай реакция гетерогенді?", "Какая реакция гетерогенная?", "Which reaction is heterogeneous?"],
    o: [["Zn + 2HCl(ерітінді) → ZnCl₂ + H₂", "Zn + 2HCl(р-р) → ZnCl₂ + H₂", "Zn + 2HCl(aq) → ZnCl₂ + H₂"], ["H₂ + Cl₂ → 2HCl", "H₂ + Cl₂ → 2HCl", "H₂ + Cl₂ → 2HCl"], ["NaOH + HCl → NaCl + H₂O (ерітіндіде)", "NaOH + HCl → NaCl + H₂O (в растворе)", "NaOH + HCl → NaCl + H₂O (in solution)"], ["N₂ + O₂ → 2NO", "N₂ + O₂ → 2NO", "N₂ + O₂ → 2NO"]], a: 0,
    e: ["Мырыш — қатты зат, HCl — ерітінді: екі фаза, реакция бетте жүреді.", "Цинк — твёрдое вещество, HCl — раствор: две фазы, реакция идёт на поверхности.", "Zinc is a solid and HCl is a solution: two phases, so the reaction happens at the surface."] },
  { q: ["Соқтығысу теориясы бойынша реакция қашан жүреді?", "Согласно теории столкновений, реакция происходит, когда…", "According to collision theory, a reaction takes place when…"],
    o: [["соқтығысу энергиясы ≥ Eₐ және бағыты дұрыс болғанда", "энергия столкновения ≥ Eₐ и ориентация правильная", "the collision energy is ≥ Eₐ and the orientation is right"], ["кез келген соқтығысуда", "при любом столкновении", "in any collision"], ["тек жоғары температурада", "только при высокой температуре", "only at high temperature"], ["тек катализатор болғанда", "только в присутствии катализатора", "only when a catalyst is present"]], a: 0,
    e: ["Тиімді соқтығысу үшін жеткілікті энергия да, дұрыс бағыт та қажет.", "Для эффективного столкновения нужны и достаточная энергия, и правильная ориентация.", "An effective collision needs both enough energy and the right orientation."] },
  { q: ["Температура 20-дан 40 °C-қа көтерілді, γ = 3. Жылдамдық неше есе артады?", "Температуру подняли с 20 до 40 °C, γ = 3. Во сколько раз возрастёт скорость?", "The temperature rises from 20 to 40 °C with γ = 3. How many times faster is the reaction?"],
    o: [["9", "9", "9"], ["6", "6", "6"], ["3", "3", "3"], ["27", "27", "27"]], a: 0,
    e: ["3^((40−20)/10) = 3² = 9.", "3^((40−20)/10) = 3² = 9.", "3^((40−20)/10) = 3² = 9."] },
  { q: ["Катализатор нені өзгертеді?", "Что изменяет катализатор?", "What does a catalyst change?"],
    o: [["Активтендіру энергиясын төмендетеді", "Снижает энергию активации", "It lowers the activation energy"], ["Реакцияның ΔH-ын өзгертеді", "Меняет ΔH реакции", "It changes the ΔH of the reaction"], ["Тепе-теңдікті ығыстырады", "Смещает равновесие", "It shifts the equilibrium"], ["Реакцияда толық жұмсалады", "Полностью расходуется в реакции", "It is used up completely"]], a: 0,
    e: ["Катализатор Eₐ-сы төмен жол ашады; ΔH және тепе-теңдік өзгермейді, өзі қалпына келеді.", "Катализатор открывает путь с меньшей Eₐ; ΔH и равновесие не меняются, сам он восстанавливается.", "A catalyst opens a path with a lower Eₐ; ΔH and the equilibrium stay the same and the catalyst is regenerated."] },
  { q: ["Элементар реакция 2A(г) + B(г) → C үшін кинетикалық теңдеу:", "Кинетическое уравнение элементарной реакции 2A(г) + B(г) → C:", "The rate law for the elementary reaction 2A(g) + B(g) → C is:"],
    o: [["v = k[A]²[B]", "v = k[A]²[B]", "v = k[A]²[B]"], ["v = k[A][B]", "v = k[A][B]", "v = k[A][B]"], ["v = k[C]", "v = k[C]", "v = k[C]"], ["v = 2k[A][B]", "v = 2k[A][B]", "v = 2k[A][B]"]], a: 0,
    e: ["Массалар заңы: концентрациялар коэффициенттерге тең дәрежеде алынады.", "Закон действующих масс: концентрации берутся в степенях, равных коэффициентам.", "Law of mass action: each concentration is raised to the power of its coefficient."] },
  { q: ["2NO + O₂ → 2NO₂ реакциясында қысымды 3 есе арттырса, жылдамдық:", "В реакции 2NO + O₂ → 2NO₂ давление увеличили в 3 раза. Скорость:", "In 2NO + O₂ → 2NO₂ the pressure is tripled. The rate:"],
    o: [["27 есе артады", "увеличится в 27 раз", "becomes 27× faster"], ["9 есе артады", "увеличится в 9 раз", "becomes 9× faster"], ["3 есе артады", "увеличится в 3 раза", "becomes 3× faster"], ["6 есе артады", "увеличится в 6 раз", "becomes 6× faster"]], a: 0,
    e: ["v = k[NO]²[O₂] → 3² · 3 = 27.", "v = k[NO]²[O₂] → 3² · 3 = 27.", "v = k[NO]²[O₂] → 3² · 3 = 27."] },
  { q: ["CaCO₃(қ) + 2HCl(ер) реакциясының жылдамдығына қай фактор әсер етпейді?", "Какой фактор не влияет на скорость реакции CaCO₃(тв) + 2HCl(р-р)?", "Which factor does not affect the rate of CaCO₃(s) + 2HCl(aq)?"],
    o: [["Қысым", "Давление", "Pressure"], ["HCl концентрациясы", "Концентрация HCl", "HCl concentration"], ["Температура", "Температура", "Temperature"], ["Борды ұсақтау", "Измельчение мела", "Grinding the chalk"]], a: 0,
    e: ["Бастапқы заттар арасында газ жоқ, сондықтан қысым концентрацияны өзгертпейді.", "Среди исходных веществ нет газов, поэтому давление не меняет их концентрацию.", "None of the reactants is a gas, so pressure does not change their concentrations."] },
  { q: ["Активтендірілген комплекс дегеніміз:", "Активированный комплекс — это:", "The activated complex is:"],
    o: [["реакция жолындағы энергиясы ең жоғары күй", "состояние с максимальной энергией на пути реакции", "the highest-energy state on the reaction path"], ["реакцияның соңғы өнімі", "конечный продукт реакции", "the final product of the reaction"], ["катализатордың басқа атауы", "другое название катализатора", "another name for a catalyst"], ["энергиясы ең төмен аралық зат", "промежуточное вещество с минимальной энергией", "the lowest-energy intermediate"]], a: 0,
    e: ["Ол энергетикалық диаграмманың шыңында орналасады.", "Он находится на вершине энергетической диаграммы.", "It sits at the top of the energy profile diagram."] },
  { q: ["Экзотермиялық реакцияда Eₐ(тура) = 50 кДж/моль, ΔH = −30 кДж/моль. Eₐ(кері) = ?", "Для экзотермической реакции Eₐ(прям.) = 50 кДж/моль, ΔH = −30 кДж/моль. Eₐ(обр.) = ?", "For an exothermic reaction Eₐ(forward) = 50 kJ/mol and ΔH = −30 kJ/mol. Eₐ(reverse) = ?"],
    o: [["80 кДж/моль", "80 кДж/моль", "80 kJ/mol"], ["20 кДж/моль", "20 кДж/моль", "20 kJ/mol"], ["50 кДж/моль", "50 кДж/моль", "50 kJ/mol"], ["30 кДж/моль", "30 кДж/моль", "30 kJ/mol"]], a: 0,
    e: ["Eₐ(кері) = Eₐ(тура) + |ΔH| = 50 + 30 = 80 кДж/моль.", "Eₐ(обр.) = Eₐ(прям.) + |ΔH| = 50 + 30 = 80 кДж/моль.", "Eₐ(reverse) = Eₐ(forward) + |ΔH| = 50 + 30 = 80 kJ/mol."] },
  { q: ["1-ретті реакцияның жартылай ыдырау периоды:", "Период полупревращения реакции 1 порядка:", "The half-life of a first-order reaction:"],
    o: [["бастапқы концентрацияға тәуелді емес", "не зависит от начальной концентрации", "does not depend on the initial concentration"], ["C₀-ға тура пропорционал", "прямо пропорционален C₀", "is proportional to C₀"], ["C₀-ға кері пропорционал", "обратно пропорционален C₀", "is inversely proportional to C₀"], ["k-ға тең", "равен k", "equals k"]], a: 0,
    e: ["t½ = ln 2 / k — мұнда C₀ жоқ.", "t½ = ln 2 / k — C₀ сюда не входит.", "t½ = ln 2 / k, which contains no C₀."] },
  { q: ["Адам ағзасындағы ферменттер қай температурада ең белсенді?", "При какой температуре ферменты человека наиболее активны?", "At what temperature are human enzymes most active?"],
    o: [["≈ 37 °C", "≈ 37 °C", "≈ 37 °C"], ["0 °C", "0 °C", "0 °C"], ["70 °C", "70 °C", "70 °C"], ["100 °C", "100 °C", "100 °C"]], a: 0,
    e: ["Дене температурасында; 40–45 °C-тан жоғары ақуыз денатурацияланады.", "При температуре тела; выше 40–45 °C белок денатурирует.", "At body temperature; above 40–45 °C the protein denatures."] },
  { q: ["Промотор дегеніміз:", "Промотор — это:", "A promoter is:"],
    o: [["катализатордың белсенділігін арттыратын зат", "вещество, усиливающее активность катализатора", "a substance that boosts a catalyst's activity"], ["каталитикалық у", "каталитический яд", "a catalyst poison"], ["ингибитор", "ингибитор", "an inhibitor"], ["реакция өнімі", "продукт реакции", "a reaction product"]], a: 0,
    e: ["Мысалы, K₂O мен Al₂O₃ аммиак синтезіндегі темір катализаторын күшейтеді.", "Например, K₂O и Al₂O₃ усиливают железный катализатор синтеза аммиака.", "For example, K₂O and Al₂O₃ boost the iron catalyst used for ammonia synthesis."] },
  { q: ["Көмір шаңы неге жарылуы мүмкін, ал көмір кесегі баяу жанады?", "Почему угольная пыль может взорваться, а кусок угля горит медленно?", "Why can coal dust explode while a lump of coal burns slowly?"],
    o: [["Шаңның бет ауданы әлдеқайда үлкен", "У пыли гораздо больше площадь поверхности", "The dust has a much larger surface area"], ["Шаңның химиялық табиғаты басқа", "У пыли другая химическая природа", "The dust has a different chemical nature"], ["Шаңда катализатор бар", "В пыли есть катализатор", "The dust contains a catalyst"], ["Кесекте оттегі көп", "В куске больше кислорода", "The lump contains more oxygen"]], a: 0,
    e: ["Гетерогенді реакция бетте жүреді: ұсақтағанда жанасу беті күрт артады.", "Гетерогенная реакция идёт на поверхности: при измельчении площадь контакта резко растёт.", "A heterogeneous reaction happens at the surface: grinding greatly increases the contact area."] },
  { q: ["Жылдамдық константасы k неге тәуелді емес?", "От чего не зависит константа скорости k?", "What does the rate constant k not depend on?"],
    o: [["Заттардың концентрациясына", "От концентрации веществ", "The concentrations of the substances"], ["Температураға", "От температуры", "Temperature"], ["Заттардың табиғатына", "От природы веществ", "The nature of the substances"], ["Катализаторға", "От катализатора", "The catalyst"]], a: 0,
    e: ["k — концентрациялар 1 моль/л болғандағы жылдамдық; ол T, табиғат және катализаторға тәуелді.", "k — скорость при концентрациях 1 моль/л; зависит от T, природы веществ и катализатора.", "k is the rate when all concentrations are 1 mol/L; it depends on T, the nature of the substances and the catalyst."] }
];

safe("quiz", function () {
  var box = $("quiz");
  // Нұсқалардың орнын тұрақты түрде араластырамыз (дұрыс жауап әрқашан бірінші болмауы үшін).
  QUIZ.forEach(function (q, i) {
    var order = [0, 1, 2, 3], seed = i * 7 + 3;
    for (var k = 3; k > 0; k--) { seed = (seed * 9301 + 49297) % 233280; var j = seed % (k + 1); var t = order[k]; order[k] = order[j]; order[j] = t; }
    q.order = order;
  });
  var state = { i: 0, picked: [] };

  function render() {
    var n = QUIZ.length;
    if (state.i >= n) return renderEnd();
    var q = QUIZ[state.i], picked = state.picked[state.i];
    var html = '<div class="ctrl-top"><span class="muted">' + L("Сұрақ ", "Вопрос ", "Question ") + (state.i + 1) + " / " + n + "</span>" +
      "<output>" + L("Ұпай: ", "Баллы: ", "Score: ") + score() + "</output></div>" +
      '<div class="q-progress"><i style="width:' + (state.i / n * 100) + '%"></i></div>' +
      '<p class="q-text">' + esc(T3(q.q)) + '</p><div class="q-opts">';
    q.order.forEach(function (oi, pos) {
      var cls = "q-opt";
      if (picked != null) { if (oi === q.a) cls += " right"; else if (oi === picked) cls += " wrong"; }
      html += '<button type="button" class="' + cls + '" data-o="' + oi + '"' + (picked != null ? " disabled" : "") + '><span class="k">' + "ABCD"[pos] + "</span><span>" + esc(T3(q.o[oi])) + "</span></button>";
    });
    html += "</div>";
    if (picked != null) {
      var ok = picked === q.a;
      html += '<div class="q-explain"><b style="color:var(--' + (ok ? "ok" : "bad") + ')">' + (ok ? L("Дұрыс!", "Верно!", "Correct!") : L("Қате.", "Неверно.", "Not quite.")) + "</b> " + esc(T3(q.e)) + "</div>";
      html += '<div class="row-btns" style="margin-top:16px"><button type="button" class="btn btn-primary" data-next>' +
        (state.i === n - 1 ? L("Нәтижені көру", "Посмотреть результат", "See results") : L("Келесі сұрақ →", "Следующий вопрос →", "Next question →")) + "</button></div>";
    }
    box.innerHTML = html;
  }
  function score() {
    var s = 0;
    state.picked.forEach(function (p, i) { if (p === QUIZ[i].a) s++; });
    return s;
  }
  function renderEnd() {
    var s = score(), n = QUIZ.length, advice;
    if (s >= 13) advice = L("Керемет! Тақырыпты жақсы меңгергенсіз. C деңгейіндегі есептерді шығарып көріңіз.", "Отлично! Тема усвоена хорошо. Попробуйте решить задачи уровня C.", "Excellent! You know this topic well. Try the level C problems.");
    else if (s >= 9) advice = L("Жақсы нәтиже. Қате жіберген сұрақтардың түсіндірмесін қайта оқып, калькуляторларда жаттығыңыз.", "Хороший результат. Перечитайте объяснения к ошибкам и потренируйтесь с калькуляторами.", "Good result. Reread the explanations for the ones you missed and practise with the calculators.");
    else advice = L("Тақырыпты қайталаған жөн: <a href=\"#s3\">01 Жылдамдық</a>, <a href=\"#s5\">02 Соқтығысу теориясы</a>, <a href=\"#s9\">06 Температура</a> слайдтарын қарап, тестті қайта тапсырыңыз.",
      "Стоит повторить тему: посмотрите слайды <a href=\"#s3\">01 Скорость</a>, <a href=\"#s5\">02 Теория столкновений</a>, <a href=\"#s9\">06 Температура</a> и пройдите тест ещё раз.",
      "It is worth reviewing the topic: look at <a href=\"#s3\">01 Rate</a>, <a href=\"#s5\">02 Collision theory</a> and <a href=\"#s9\">06 Temperature</a>, then take the quiz again.");
    box.innerHTML = '<div style="text-align:center"><p class="muted">' + L("Сіздің нәтижеңіз", "Ваш результат", "Your result") + '</p>' +
      '<div class="q-score grad-text">' + s + " / " + n + "</div>" +
      '<p style="margin:12px 0 4px;font-weight:600">' + pct(s / n) + "</p>" +
      '<p class="q-explain" style="text-align:left">' + advice + "</p>" +
      '<div class="row-btns" style="margin-top:16px;justify-content:center"><button type="button" class="btn btn-primary" data-restart>' + L("Қайта тапсыру", "Пройти заново", "Try again") + "</button></div></div>";
  }
  box.addEventListener("click", function (e) {
    var b = e.target.closest("button");
    if (!b || !box.contains(b)) return;
    if (b.hasAttribute("data-o")) {
      if (state.picked[state.i] != null) return;
      state.picked[state.i] = +b.getAttribute("data-o");
      render();
      var nx = box.querySelector("[data-next]");
      if (nx) nx.focus({ preventScroll: true });
    } else if (b.hasAttribute("data-next")) {
      state.i++;
      render();
      var first = box.querySelector(".q-opt");
      if (first) first.focus({ preventScroll: true });
    } else if (b.hasAttribute("data-restart")) {
      state = { i: 0, picked: [] };
      render();
    }
  });
  render();
  onLang(render);
});
