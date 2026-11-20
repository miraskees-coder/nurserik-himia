/* ================= Описания лабораторных работ =================
   Каждая работа — данные + функции модели. Каталог строится только из этого списка,
   поэтому на сайте не бывает карточек без работающей лаборатории. */
var NCLabs = (function () {
  "use strict";
  var M = NCLabModels;
  function f(x, d) { return fmt(x, d); }
  var S = [" с", " с", " s"], ML = [" мл", " мл", " mL"], G = [" г", " г", " g"], MOL = [" моль/л", " моль/л", " mol/L"];
  function u(a) { return L(a[0], a[1], a[2]); }

  var THIO_MODEL = {
    type: ["Есептік модель (оқу коэффициенттері)", "Расчётная модель (учебные коэффициенты)", "Computational model (teaching coefficients)"],
    notes: [
      ["Реакция: Na₂S₂O₃ + 2HCl → 2NaCl + S↓ + SO₂↑ + H₂O. Қышқыл артық мөлшерде.", "Реакция: Na₂S₂O₃ + 2HCl → 2NaCl + S↓ + SO₂↑ + H₂O. Кислота в избытке.", "Reaction: Na₂S₂O₃ + 2HCl → 2NaCl + S↓ + SO₂↑ + H₂O. Acid in excess."],
      ["Күкірттің түзілу жылдамдығы v = k·[S₂O₃²⁻] деп алынған (тиосульфат бойынша 1-рет — оқу моделі).", "Скорость образования серы принята v = k·[S₂O₃²⁻] (1-й порядок по тиосульфату — учебная модель).", "Rate of sulfur formation taken as v = k·[S₂O₃²⁻] (first order in thiosulfate — a teaching model)."],
      ["Крест 0,002 моль/л күкірт түзілгенде көрінбей қалады деп есептеледі.", "Считается, что крест перестаёт быть виден, когда образовалось 0,002 моль/л серы.", "The cross is taken to vanish once 0.002 mol/L of sulfur has formed."],
      ["k(T) — Аррениус теңдеуі бойынша, Eₐ = 50 кДж/моль (оқу мәні). Сандар нақты өлшеу емес.", "k(T) — по уравнению Аррениуса, Eₐ = 50 кДж/моль (учебное значение). Числа — не реальные измерения.", "k(T) follows the Arrhenius equation with Eₐ = 50 kJ/mol (a teaching value). The numbers are not real measurements."],
      ["Оң жақтағы бөлшектер — сапалық көрнекілік: саны C-ға, жылдамдығы √T-ға, жарқыл жиілігі есептелген жылдамдыққа пропорционал.", "Частицы справа — качественная иллюстрация: их число ∝ C, скорость ∝ √T, частота вспышек ∝ рассчитанной скорости.", "The particles on the right are a qualitative illustration: their number ∝ C, speed ∝ √T, flash frequency ∝ the calculated rate."]
    ]
  };
  var THIO_THEORY = [
    "<p>Натрий тиосульфаты қышқылмен әрекеттескенде күкірт бөлінеді, ерітінді лайланады. Стақан астындағы крест көрінбей қалғанға дейінгі уақыт t реакция жылдамдығына кері пропорционал: v ∝ 1/t.</p><p>Соқтығысу теориясы бойынша концентрация артса, көлем бірлігіндегі бөлшектер көбейіп, тиімді соқтығысулар жиілейді.</p>",
    "<p>При взаимодействии тиосульфата натрия с кислотой выделяется сера, раствор мутнеет. Время t до исчезновения креста под стаканом обратно пропорционально скорости: v ∝ 1/t.</p><p>По теории столкновений при росте концентрации в единице объёма больше частиц, поэтому эффективные столкновения происходят чаще.</p>",
    "<p>When sodium thiosulfate reacts with acid, sulfur forms and the solution turns cloudy. The time t until the cross under the beaker disappears is inversely proportional to the rate: v ∝ 1/t.</p><p>According to collision theory, a higher concentration means more particles per unit volume, so effective collisions happen more often.</p>"
  ];
  var THIO_SAFETY = [
    "<p>Тәжірибе тек виртуалды. Нақты зертханада SO₂ тыныс жолын тітіркендіреді — тартпа шкаф, көзілдірік және мұғалімнің бақылауы қажет.</p>",
    "<p>Опыт только виртуальный. В реальной лаборатории SO₂ раздражает дыхательные пути — нужны вытяжной шкаф, очки и контроль учителя.</p>",
    "<p>This experiment is virtual only. In a real lab, SO₂ irritates the airways: a fume cupboard, goggles and teacher supervision are required.</p>"
  ];

  var list = [
    {
      id: "k-conc", no: "L1", grade: 10, kind: "lab", level: "base", minutes: 25, minRuns: 3, mode: function () { return "cross"; },
      title: ["Концентрацияның реакция жылдамдығына әсері", "Влияние концентрации на скорость реакции", "Effect of concentration on reaction rate"],
      topic: ["Химиялық кинетика", "Химическая кинетика", "Chemical kinetics"],
      goal: ["Na₂S₂O₃ концентрациясы мен реакция жылдамдығы арасындағы тәуелділікті тәжірибе арқылы анықтау.", "Экспериментально установить зависимость скорости реакции от концентрации Na₂S₂O₃.", "Find out by experiment how the reaction rate depends on the concentration of Na₂S₂O₃."],
      theory: THIO_THEORY, safety: THIO_SAFETY, model: THIO_MODEL,
      equipment: [["Химиялық стақан, 100 мл", "Химический стакан, 100 мл", "Beaker, 100 mL"], ["Қара крест салынған қағаз", "Лист с чёрным крестом", "Sheet with a black cross"], ["Na₂S₂O₃ ерітіндісі, 0,03–0,15 моль/л", "Раствор Na₂S₂O₃, 0,03–0,15 моль/л", "Na₂S₂O₃ solution, 0.03–0.15 mol/L"], ["HCl ерітіндісі (артық мөлшерде)", "Раствор HCl (в избытке)", "HCl solution (in excess)"], ["Секундомер", "Секундомер", "Stopwatch"]],
      controls: [{ id: "C", type: "range", min: 0.03, max: 0.15, step: 0.01, value: 0.06, dec: 2, label: ["Na₂S₂O₃ концентрациясы", "Концентрация Na₂S₂O₃", "Na₂S₂O₃ concentration"], unit: MOL }],
      fixed: { T: 20 },
      simulate: function (p) { return M.thiosulfate({ C: p.C, T: 20 }); },
      summary: function (p, r) { return { t: +r.t.toFixed(2), inv: +r.inv.toFixed(3), v: r.v }; },
      columns: function () { return [L("C(Na₂S₂O₃), моль/л", "C(Na₂S₂O₃), моль/л", "C(Na₂S₂O₃), mol/L"), L("t, с", "t, с", "t, s"), "1000/t", L("v, ×10⁻⁵ моль/(л·с)", "v, ×10⁻⁵ моль/(л·с)", "v, ×10⁻⁵ mol/(L·s)")]; },
      row: function (p, r) { return [f(+p.C, 2), f(r.t, 1), f(r.inv, 2), f(r.v * 1e5, 2)]; },
      metric: function (p, r) { return { label: ["Крест жоғалу уақыты", "Время исчезновения креста", "Time for the cross to vanish"], value: r.t, text: f(r.t, 1) + u(S) }; },
      chart: { kind: "scatter", fit: true, origin: true, title: ["1000/t — C тәуелділігі", "Зависимость 1000/t от C", "1000/t against C"], x: function (p) { return +p.C; }, y: function (p, r) { return r.inv; }, xLabel: ["C, моль/л", "C, моль/л", "C, mol/L"], yLabel: ["1000/t", "1000/t", "1000/t"] },
      viewNote: ["Сол жақта — стақан мен крест, оң жақта — бөлшектердің үлкейтілген көрінісі.", "Слева — стакан с крестом, справа — увеличенный вид частиц.", "Left: beaker over the cross. Right: zoomed view of the particles."],
      prediction: { q: ["Na₂S₂O₃ концентрациясын арттырсақ, крест жоғалатын уақыт қалай өзгереді?", "Как изменится время исчезновения креста при увеличении концентрации Na₂S₂O₃?", "How will the time for the cross to vanish change if the Na₂S₂O₃ concentration increases?"],
        opts: [["Азаяды", "Уменьшится", "It will decrease"], ["Артады", "Увеличится", "It will increase"], ["Өзгермейді", "Не изменится", "It will not change"]], correct: 0 },
      questions: [
        { id: "q1", level: "base", type: "choice", q: ["Концентрацияны екі есе арттырғанда t шамамен қалай өзгерді?", "Как примерно изменилось t при увеличении концентрации вдвое?", "Roughly how did t change when the concentration doubled?"],
          opts: [["Шамамен 2 есе азайды", "Уменьшилось примерно в 2 раза", "It fell about twofold"], ["2 есе артты", "Увеличилось в 2 раза", "It doubled"], ["4 есе азайды", "Уменьшилось в 4 раза", "It fell fourfold"], ["Өзгермеді", "Не изменилось", "No change"]], correct: 0,
          explain: ["Бұл модельде v ∝ C, сондықтан t ∝ 1/C.", "В этой модели v ∝ C, поэтому t ∝ 1/C.", "In this model v ∝ C, so t ∝ 1/C."] },
        { id: "q2", level: "base", type: "num", q: ["1-тәжірибе: күкірттің орташа түзілу жылдамдығын есептеңіз, v = 0,002 / t.", "Опыт 1: вычислите среднюю скорость образования серы, v = 0,002 / t.", "Run 1: calculate the average rate of sulfur formation, v = 0.002 / t."],
          unit: ["моль/(л·с)", "моль/(л·с)", "mol/(L·s)"], dec: 6, tol: 0.03, answer: function (st, sim) { return st.runs[0] ? 0.002 / sim(st.runs[0].p).t : null; },
          explain: ["v = ΔC/Δt: 0,002 моль/л күкірт t секундта түзілді.", "v = ΔC/Δt: 0,002 моль/л серы образовалось за t секунд.", "v = ΔC/Δt: 0.002 mol/L of sulfur formed in t seconds."] },
        { id: "q3", level: "adv", type: "choice", q: ["1000/t — C графигі координат басынан өтетін түзу. Бұл не білдіреді?", "График 1000/t от C — прямая через начало координат. Что это означает?", "The graph of 1000/t against C is a straight line through the origin. What does that mean?"],
          opts: [["Жылдамдық Na₂S₂O₃ концентрациясына тура пропорционал (1-рет)", "Скорость прямо пропорциональна концентрации Na₂S₂O₃ (1-й порядок)", "The rate is directly proportional to [Na₂S₂O₃] (first order)"], ["Жылдамдық концентрацияға тәуелсіз", "Скорость не зависит от концентрации", "The rate does not depend on concentration"], ["Реакция 2-ретті", "Реакция второго порядка", "The reaction is second order"]], correct: 0,
          explain: ["Түзу пропорционалдық v ∝ C береді. Бірақ бұл — тиосульфат бойынша рет қана; басқа реакцияларда тәуелділік басқаша болуы мүмкін.", "Прямая пропорциональность даёт v ∝ C. Но это порядок только по тиосульфату; у других реакций зависимость может быть иной.", "Direct proportionality means v ∝ C. But that is the order in thiosulfate only; other reactions can behave differently."] },
        { id: "q4", level: "adv", type: "open", q: ["Неге концентрация артқанда жылдамдық артады? Соқтығысу теориясымен түсіндіріңіз.", "Почему при росте концентрации скорость растёт? Объясните по теории столкновений.", "Why does the rate rise with concentration? Explain using collision theory."],
          explain: ["Күтілетін идея: көлем бірлігінде бөлшек көп → соқтығысу жиілігі артады → тиімді соқтығысулар саны артады; энергиялар таралуы өзгермейді.", "Ожидаемая идея: больше частиц в единице объёма → чаще столкновения → больше эффективных столкновений; распределение энергий не меняется.", "Expected idea: more particles per unit volume → more frequent collisions → more effective collisions; the energy distribution is unchanged."] },
        { id: "q5", level: "res", type: "choice", q: ["Осы тәжірибеден H⁺ бойынша реакция ретін анықтауға бола ма?", "Можно ли по этому опыту определить порядок реакции по H⁺?", "Can this experiment tell us the reaction order with respect to H⁺?"],
          opts: [["Жоқ: қышқыл артық және оның концентрациясы өзгертілген жоқ", "Нет: кислота в избытке, и её концентрацию не меняли", "No: the acid is in excess and its concentration was not varied"], ["Иә, график соны көрсетеді", "Да, график это показывает", "Yes, the graph shows it"]], correct: 0,
          explain: ["Деректер жеткіліксіз: H⁺ бойынша ретті табу үшін тек HCl концентрациясын өзгерту керек.", "Данных недостаточно: чтобы найти порядок по H⁺, нужно менять только концентрацию HCl.", "The data are insufficient: to find the order in H⁺ you must vary only the HCl concentration."] },
        { id: "q6", level: "res", type: "open", q: ["Нақты тәжірибеде қандай өлшеу қателері болуы мүмкін және оларды қалай азайтуға болады?", "Какие ошибки измерения возможны в реальном опыте и как их уменьшить?", "What measurement errors could occur in a real experiment, and how could you reduce them?"],
          explain: ["Мысалы: «көрінбей қалды» сәтін әр адам әртүрлі анықтайды, температура тұрақты емес, араластыру әртүрлі. Қайталау және бір бақылаушы көмектеседі.", "Например: момент «исчез» каждый определяет по-своему, температура непостоянна, перемешивание разное. Помогают повторы и один наблюдатель.", "For example: people judge “vanished” differently, temperature drifts, stirring varies. Repeats and a single observer help."] }
      ],
      conclusionHint: ["Тәжірибе нәтижесін, оны растайтын деректерді және түсіндірмесін жазыңыз.", "Запишите результат, подтверждающие его данные и объяснение.", "Write the result, the data that support it and the explanation."],
      explain: ["<p>Концентрация артқанда көлем бірлігіндегі бөлшектер көбейеді, тиімді соқтығысулар жиілейді — күкірт тезірек жиналып, крест ертерек жоғалады. Бұл модельде 1000/t концентрацияға шамамен тура пропорционал (кіші концентрацияда ауытқуы ~3 %-ға дейін).</p>", "<p>С ростом концентрации в единице объёма больше частиц, эффективные столкновения чаще — сера накапливается быстрее, и крест исчезает раньше. В этой модели 1000/t почти прямо пропорционально концентрации (при малых C отклонение до ~3 %).</p>", "<p>A higher concentration puts more particles in each unit of volume, so effective collisions are more frequent: sulfur builds up faster and the cross disappears sooner. In this model 1000/t is almost directly proportional to concentration (up to ~3% off at low C).</p>"]
    },
    {
      id: "k-temp", no: "L2", grade: 10, kind: "lab", level: "base", minutes: 25, minRuns: 3, mode: function () { return "cross"; },
      title: ["Температураның реакция жылдамдығына әсері", "Влияние температуры на скорость реакции", "Effect of temperature on reaction rate"],
      topic: ["Химиялық кинетика", "Химическая кинетика", "Chemical kinetics"],
      goal: ["Температура реакция жылдамдығын қалай өзгертетінін анықтап, температуралық коэффициентті бағалау.", "Установить, как температура меняет скорость реакции, и оценить температурный коэффициент.", "Find out how temperature changes the reaction rate and estimate the temperature coefficient."],
      theory: [THIO_THEORY[0] + "<p>Вант-Гофф ережесі: v₂/v₁ = γ^((t₂−t₁)/10). Температура артқанда энергиясы Eₐ-дан жоғары бөлшектер үлесі күрт өседі.</p>", THIO_THEORY[1] + "<p>Правило Вант-Гоффа: v₂/v₁ = γ^((t₂−t₁)/10). При нагревании резко растёт доля частиц с энергией выше Eₐ.</p>", THIO_THEORY[2] + "<p>Van 't Hoff's rule: v₂/v₁ = γ^((t₂−t₁)/10). Heating sharply increases the share of particles with energy above Eₐ.</p>"],
      safety: THIO_SAFETY, model: THIO_MODEL,
      equipment: [["Су моншасы (10–60 °C)", "Водяная баня (10–60 °C)", "Water bath (10–60 °C)"], ["Термометр", "Термометр", "Thermometer"], ["Na₂S₂O₃ ерітіндісі, 0,10 моль/л", "Раствор Na₂S₂O₃, 0,10 моль/л", "Na₂S₂O₃ solution, 0.10 mol/L"], ["HCl ерітіндісі (артық)", "Раствор HCl (в избытке)", "HCl solution (in excess)"], ["Секундомер", "Секундомер", "Stopwatch"]],
      controls: [{ id: "T", type: "range", min: 10, max: 60, step: 5, value: 20, dec: 0, label: ["Температура", "Температура", "Temperature"], unit: ["°C", "°C", "°C"] }],
      simulate: function (p) { return M.thiosulfate({ C: 0.1, T: p.T }); },
      summary: function (p, r) { return { t: +r.t.toFixed(2), inv: +r.inv.toFixed(3), k: r.k }; },
      columns: function () { return [L("t, °C", "t, °C", "t, °C"), L("уақыт, с", "время, с", "time, s"), "1000/t", L("k/k(20 °C)", "k/k(20 °C)", "k/k(20 °C)")]; },
      row: function (p, r) { return [String(p.T), f(r.t, 1), f(r.inv, 2), f(r.k / M.THIO.k20, 2)]; },
      metric: function (p, r) { return { label: ["Крест жоғалу уақыты", "Время исчезновения креста", "Time for the cross to vanish"], value: r.t, text: f(r.t, 1) + u(S) }; },
      chart: { kind: "scatter", fit: false, title: ["1000/t — температура", "1000/t от температуры", "1000/t against temperature"], x: function (p) { return +p.T; }, y: function (p, r) { return r.inv; }, xLabel: ["t, °C", "t, °C", "t, °C"], yLabel: ["1000/t", "1000/t", "1000/t"] },
      extra: function (p) {
        var r = M.thiosulfate({ C: 0.1, T: p.T }), share = Math.exp(-M.THIO.Ea / M.R * (1 / (p.T + 273.15) - 1 / 293.15));
        return "<h3>" + L("Энергиясы Eₐ-дан жоғары бөлшектер", "Частицы с энергией выше Eₐ", "Particles above Eₐ") + "</h3><p>" +
          L("Таңдалған температурада олардың үлесі 20 °C-тағыдан ", "При выбранной температуре их доля в ", "At the chosen temperature their share is ") + "<b>" + fmt(share, 2) + "</b>" +
          L(" есе көп (e^(−Eₐ/RT) бойынша). Бөлшектердің орташа жылдамдығы тек ", " раза больше, чем при 20 °C (по e^(−Eₐ/RT)). А средняя скорость частиц выросла лишь в ", " times larger than at 20 °C (from e^(−Eₐ/RT)). Yet the mean particle speed rose only ") +
          "<b>" + fmt(Math.sqrt((p.T + 273.15) / 293.15), 3) + "</b>" + L(" есе өсті.", " раза.", " times.") + "</p>";
      },
      viewNote: ["Жарқылдар жиілігі есептелген жылдамдыққа пропорционал (сапалық көрнекілік).", "Частота вспышек пропорциональна рассчитанной скорости (качественная иллюстрация).", "The flash rate is proportional to the calculated rate (a qualitative illustration)."],
      prediction: { q: ["Температураны 20-дан 30 °C-қа көтерсек, крест жоғалу уақыты қалай өзгереді?", "Как изменится время исчезновения креста при нагревании с 20 до 30 °C?", "How will the time for the cross to vanish change when heated from 20 to 30 °C?"],
        opts: [["Шамамен 2 есе азаяды", "Уменьшится примерно в 2 раза", "It will fall about twofold"], ["Шамамен 1,5 % азаяды", "Уменьшится примерно на 1,5 %", "It will fall by about 1.5%"], ["Артады", "Увеличится", "It will increase"]], correct: 0 },
      questions: [
        { id: "q1", level: "base", type: "num", q: ["Ең суық және ең ыстық тәжірибелеріңіздегі уақыттар қатынасын табыңыз: t(суық)/t(ыстық).", "Найдите отношение времён в самом холодном и самом горячем опытах: t(холодн.)/t(горяч.).", "Find the ratio of times in your coldest and hottest runs: t(cold)/t(hot)."],
          unit: ["есе", "раз", "×"], dec: 2, tol: 0.03, answer: function (st, sim) {
            if (st.runs.length < 2) return null;
            var a = st.runs.slice().sort(function (x, y) { return x.p.T - y.p.T; });
            return sim(a[0].p).t / sim(a[a.length - 1].p).t;
          }, explain: ["Уақыт жылдамдыққа кері пропорционал, сондықтан бұл сан жылдамдық неше есе өскенін көрсетеді.", "Время обратно пропорционально скорости, поэтому это число показывает, во сколько раз выросла скорость.", "Time is inversely proportional to rate, so this number shows how many times the rate increased."] },
        { id: "q2", level: "base", type: "choice", q: ["Әр 10 °C-та жылдамдық шамамен неше есе өсті?", "Примерно во сколько раз растёт скорость на каждые 10 °C?", "Roughly how many times does the rate grow per 10 °C?"],
          opts: [["≈ 2", "≈ 2", "≈ 2"], ["≈ 1,03", "≈ 1,03", "≈ 1.03"], ["≈ 10", "≈ 10", "≈ 10"]], correct: 0,
          explain: ["Eₐ = 50 кДж/моль болғанда γ ≈ 2 — Вант-Гофф ережесіндегі 2–4 аралығына сәйкес.", "При Eₐ = 50 кДж/моль γ ≈ 2 — в пределах 2–4 из правила Вант-Гоффа.", "With Eₐ = 50 kJ/mol, γ ≈ 2 — within the 2–4 range of Van 't Hoff's rule."] },
        { id: "q3", level: "adv", type: "choice", q: ["Неге 10 °C қыздыру бөлшектердің жылдамдығын небәрі ~1,7 %-ға арттырады, ал реакция ~2 есе тездейді?", "Почему нагрев на 10 °C увеличивает скорость частиц лишь на ~1,7 %, а реакция ускоряется ~в 2 раза?", "Why does heating by 10 °C raise particle speed by only ~1.7% while the reaction becomes ~2× faster?"],
          opts: [["Eₐ-дан асатын бөлшектер үлесі экспоненциалды өседі", "Доля частиц с E > Eₐ растёт экспоненциально", "The share of particles above Eₐ grows exponentially"], ["Соқтығысу саны 2 есе артады", "Число столкновений растёт в 2 раза", "The number of collisions doubles"], ["Eₐ азаяды", "Eₐ уменьшается", "Eₐ decreases"]], correct: 0,
          explain: ["Соқтығысу жиілігі аз өзгереді; негізгі әсер — e^(−Eₐ/RT) көбейткіші.", "Частота столкновений меняется мало; главный эффект — множитель e^(−Eₐ/RT).", "Collision frequency barely changes; the main effect is the factor e^(−Eₐ/RT)."] },
        { id: "q4", level: "res", type: "choice", q: ["Оқушы 30 °C-та C = 0,05, ал 20 °C-та C = 0,10 моль/л алып, уақыттар бірдей шықты деп «температура әсер етпейді» деген қорытынды жасады. Дұрыс па?", "Ученик взял C = 0,05 при 30 °C и C = 0,10 моль/л при 20 °C, получил одинаковое время и сделал вывод «температура не влияет». Верно ли это?", "A student used C = 0.05 at 30 °C and C = 0.10 mol/L at 20 °C, got the same time and concluded “temperature has no effect”. Is that right?"],
          opts: [["Жоқ: бір мезгілде екі фактор өзгерді, олардың әсері бір-бірін теңестірді", "Нет: менялись сразу два фактора, и их влияния компенсировали друг друга", "No: two factors changed at once and their effects cancelled out"], ["Иә, уақыттар бірдей", "Да, время одинаковое", "Yes, the times are equal"]], correct: 0,
          explain: ["Деректер қарама-қайшы емес, тәжірибе дұрыс жоспарланбаған: бір фактордан басқаның бәрі тұрақты болуы керек.", "Данные не противоречивы — опыт неверно спланирован: все факторы, кроме одного, должны быть постоянны.", "The data aren't contradictory — the experiment was badly planned: everything except one factor must be held constant."] },
        { id: "q5", level: "res", type: "open", q: ["Ферментпен жүретін реакцияда температураны 80 °C-қа көтерсе, Вант-Гофф ережесі орындала ма? Неге?", "Выполнится ли правило Вант-Гоффа для ферментативной реакции при нагреве до 80 °C? Почему?", "Would Van 't Hoff's rule hold for an enzyme reaction heated to 80 °C? Why?"],
          explain: ["Жоқ: ақуыз денатурацияланып, фермент белсенділігін жоғалтады — ереженің қолданылу шегі бар.", "Нет: белок денатурирует, фермент теряет активность — у правила есть границы применимости.", "No: the protein denatures and the enzyme loses activity — the rule has limits of applicability."] }
      ],
      conclusionHint: ["Температура мен жылдамдық арасындағы тәуелділікті, γ мәнін және оның себебін жазыңыз.", "Запишите зависимость скорости от температуры, значение γ и причину.", "Write how rate depends on temperature, your value of γ and the reason."],
      explain: ["<p>Қыздырғанда бөлшектердің орташа жылдамдығы аз өседі, бірақ энергиясы Eₐ-дан жоғары бөлшектер үлесі экспоненциалды артады. Сондықтан әр 10 °C-та жылдамдық шамамен екі есе артады.</p>", "<p>При нагревании средняя скорость частиц растёт мало, но доля частиц с энергией выше Eₐ увеличивается экспоненциально. Поэтому на каждые 10 °C скорость растёт примерно вдвое.</p>", "<p>Heating barely changes the average particle speed, but the share of particles above Eₐ rises exponentially. That is why the rate roughly doubles every 10 °C.</p>"]
    },
    {
      id: "k-surface", no: "L3", grade: 10, kind: "lab", level: "adv", minutes: 30, minRuns: 2, mode: function () { return "chips"; },
      title: ["Беттің ауданының реакция жылдамдығына әсері", "Влияние площади поверхности на скорость реакции", "Effect of surface area on reaction rate"],
      topic: ["Химиялық кинетика · гетерогенді реакциялар", "Химическая кинетика · гетерогенные реакции", "Chemical kinetics · heterogeneous reactions"],
      goal: ["Мәрмәр кесектері мен ұнтағының HCl-мен әрекеттесу жылдамдығын салыстырып, бет ауданының әсерін және масса сақталу заңын тексеру.", "Сравнить скорость реакции кусков и порошка мрамора с HCl, проверить влияние площади поверхности и закон сохранения массы.", "Compare how fast marble lumps and powder react with HCl, and check the effect of surface area and the law of conservation of mass."],
      theory: ["<p>CaCO₃ + 2HCl → CaCl₂ + H₂O + CO₂↑. Реакция фазалар шекарасында жүреді: затты ұсақтағанда жанасу беті көбейеді. Ашық колбада CO₂ ұшып кетеді — таразы көрсеткіші азаяды; жабық колбада масса сақталады.</p>", "<p>CaCO₃ + 2HCl → CaCl₂ + H₂O + CO₂↑. Реакция идёт на границе фаз: при измельчении площадь контакта растёт. В открытой колбе CO₂ улетает — показания весов уменьшаются; в закрытой колбе масса сохраняется.</p>", "<p>CaCO₃ + 2HCl → CaCl₂ + H₂O + CO₂↑. The reaction takes place at the phase boundary, so grinding increases the contact area. In an open flask CO₂ escapes and the balance reading drops; in a sealed flask the mass stays constant.</p>"],
      safety: ["<p>Виртуалды тәжірибе. Нақты жағдайда HCl — күйдіргіш; көзілдірік пен қолғап міндетті. Жабық ыдыста газ қысымы артады — оны тек мұғалім көрсетеді.</p>", "<p>Виртуальный опыт. В реальности HCl — едкое вещество; очки и перчатки обязательны. В закрытом сосуде растёт давление газа — такой опыт показывает только учитель.</p>", "<p>Virtual experiment. In reality HCl is corrosive; goggles and gloves are required. Gas pressure builds up in a sealed vessel, so only the teacher may demonstrate that version.</p>"],
      model: { type: ["Есептік модель (оқу коэффициенттері)", "Расчётная модель (учебные коэффициенты)", "Computational model (teaching coefficients)"], notes: [
        ["dn/dt = −k·S·[HCl]; бөлшектер шар тәрізді, біркелкі кішірейеді: S = S₀·(m/m₀)^(2/3).", "dn/dt = −k·S·[HCl]; частицы — шары, равномерно уменьшаются: S = S₀·(m/m₀)^(2/3).", "dn/dt = −k·S·[HCl]; particles are spheres that shrink evenly: S = S₀·(m/m₀)^(2/3)."],
        ["Бөлшек радиусы: кесек 4 мм, түйіршік 1 мм, ұнтақ 0,05 мм; кальциттің тығыздығы 2,71 г/см³.", "Радиус частиц: кусок 4 мм, гранула 1 мм, порошок 0,05 мм; плотность кальцита 2,71 г/см³.", "Particle radius: lump 4 mm, granule 1 mm, powder 0.05 mm; calcite density 2.71 g/cm³."],
        ["Стехиометрия мен масса сақталуы дәл есептеледі; k — оқу коэффициенті. HCl көлемі 50 мл, 20 °C.", "Стехиометрия и сохранение массы рассчитываются точно; k — учебный коэффициент. Объём HCl 50 мл, 20 °C.", "Stoichiometry and mass conservation are exact; k is a teaching coefficient. HCl volume 50 mL, 20 °C."],
        ["Модельдеу 30 минутпен шектелген.", "Моделирование ограничено 30 минутами.", "The simulation is limited to 30 minutes."]] },
      equipment: [["Колба, 250 мл", "Колба, 250 мл", "Flask, 250 mL"], ["Электрондық таразы", "Электронные весы", "Electronic balance"], ["Мәрмәр (CaCO₃): кесек, түйіршік, ұнтақ", "Мрамор (CaCO₃): куски, гранулы, порошок", "Marble (CaCO₃): lumps, granules, powder"], ["HCl ерітіндісі, 50 мл", "Раствор HCl, 50 мл", "HCl solution, 50 mL"], ["Тығын (жабық колба үшін)", "Пробка (для закрытой колбы)", "Stopper (for the sealed flask)"]],
      controls: [
        { id: "size", type: "select", value: "chunk", label: ["CaCO₃ түрі", "Форма CaCO₃", "Form of CaCO₃"], options: [{ v: "chunk", t: ["Кесектер (4 мм)", "Куски (4 мм)", "Lumps (4 mm)"] }, { v: "grain", t: ["Түйіршіктер (1 мм)", "Гранулы (1 мм)", "Granules (1 mm)"] }, { v: "powder", t: ["Ұнтақ (0,05 мм)", "Порошок (0,05 мм)", "Powder (0.05 mm)"] }] },
        { id: "m0", type: "range", min: 0.5, max: 2, step: 0.5, value: 1, dec: 1, label: ["CaCO₃ массасы", "Масса CaCO₃", "Mass of CaCO₃"], unit: G },
        { id: "C", type: "range", min: 0.5, max: 2, step: 0.5, value: 1, dec: 1, label: ["HCl концентрациясы", "Концентрация HCl", "HCl concentration"], unit: MOL },
        { id: "closed", type: "check", value: false, label: ["Колба жабық (тығынмен)", "Колба закрыта (пробкой)", "Flask sealed (stopper)"] }
      ],
      simulate: function (p) { return M.marble(p); },
      summary: function (p, r) { return { mCO2: +r.mCO2.toFixed(4), t90: r.t90, complete: r.complete, limiting: r.limiting, massEnd: +r.massEnd.toFixed(2) }; },
      columns: function () { return [L("CaCO₃ түрі", "Форма CaCO₃", "CaCO₃ form"), L("m(CaCO₃), г", "m(CaCO₃), г", "m(CaCO₃), g"), L("C(HCl), моль/л", "C(HCl), моль/л", "C(HCl), mol/L"), L("Колба", "Колба", "Flask"), L("m(CO₂), г", "m(CO₂), г", "m(CO₂), g"), L("t₉₀, с", "t₉₀, с", "t₉₀, s"), L("Шектеуші зат", "Лимитирующий реагент", "Limiting reagent")]; },
      row: function (p, r) {
        var sz = { chunk: ["кесек", "куски", "lumps"], grain: ["түйіршік", "гранулы", "granules"], powder: ["ұнтақ", "порошок", "powder"] }[p.size];
        var lim = r.limiting === "CaCO3" ? "CaCO₃" : r.limiting === "HCl" ? "HCl" : L("30 мин ішінде аяқталмады", "не завершилась за 30 мин", "not finished in 30 min");
        return [u(sz), f(+p.m0, 1), f(+p.C, 1), p.closed ? L("жабық", "закрыта", "sealed") : L("ашық", "открыта", "open"), f(r.mCO2, 3), r.t90 == null || !r.complete ? "> 1800" : f(r.t90, 0), lim];
      },
      metric: function (p, r) { return { label: ["90 % CO₂ бөліну уақыты", "Время выделения 90 % CO₂", "Time to release 90% of the CO₂"], value: r.complete ? r.t90 : Infinity, text: r.complete ? f(r.t90, 0) + u(S) : "> 1800" + u(S) }; },
      chart: { kind: "curves", title: ["Бөлінген CO₂ массасы — уақыт", "Масса выделившегося CO₂ — время", "Mass of CO₂ released vs time"], y: function (p, r, t) { return r.lost(t); }, xLabel: ["t, с", "t, с", "t, s"], yLabel: ["m(CO₂), г", "m(CO₂), г", "m(CO₂), g"] },
      viewNote: ["Таразы колбаның, мәрмәрдің және қышқылдың жалпы массасын көрсетеді.", "Весы показывают общую массу колбы, мрамора и кислоты.", "The balance shows the total mass of flask, marble and acid."],
      prediction: { q: ["Бірдей массадағы мәрмәр ұнтағы мен кесектерінің қайсысы HCl-мен тезірек әрекеттеседі?", "Что быстрее прореагирует с HCl при одинаковой массе: порошок или куски мрамора?", "For the same mass, which reacts faster with HCl: marble powder or lumps?"],
        opts: [["Ұнтақ", "Порошок", "Powder"], ["Кесектер", "Куски", "Lumps"], ["Бірдей", "Одинаково", "The same"]], correct: 0 },
      questions: [
        { id: "q1", level: "base", type: "num", q: ["1-тәжірибе: теңдеу бойынша бөлінетін CO₂-нің ең көп массасын есептеңіз.", "Опыт 1: рассчитайте по уравнению максимальную массу CO₂.", "Run 1: use the equation to calculate the maximum mass of CO₂."],
          unit: ["г", "г", "g"], dec: 3, tol: 0.02, answer: function (st) {
            var r = st.runs[0]; if (!r) return null;
            return Math.min(r.p.m0 / M.MARBLE.M, r.p.C * M.MARBLE.Vacid / 1000 / 2) * M.MARBLE.MCO2;
          }, explain: ["n(CaCO₃) = m/100,09; n(HCl) = C·0,05 л; HCl екі есе көп жұмсалады. Шектеуші зат бойынша n(CO₂) × 44,01.", "n(CaCO₃) = m/100,09; n(HCl) = C·0,05 л; HCl расходуется вдвое больше. По лимитирующему реагенту n(CO₂) × 44,01.", "n(CaCO₃) = m/100.09; n(HCl) = C·0.05 L; twice as much HCl is used. From the limiting reagent, n(CO₂) × 44.01."] },
        { id: "q2", level: "base", type: "choice", q: ["Жабық колбада таразы көрсеткіші неге өзгермейді?", "Почему в закрытой колбе показания весов не меняются?", "Why does the balance reading stay the same with a sealed flask?"],
          opts: [["Масса сақталу заңы: CO₂ ыдыстан шықпайды", "Закон сохранения массы: CO₂ не покидает сосуд", "Conservation of mass: the CO₂ cannot leave"], ["Реакция жүрмейді", "Реакция не идёт", "No reaction takes place"], ["CO₂-нің массасы жоқ", "У CO₂ нет массы", "CO₂ has no mass"]], correct: 0,
          explain: ["Жабық жүйеде реакцияға дейінгі және кейінгі масса тең.", "В закрытой системе масса до и после реакции одинакова.", "In a closed system the mass before and after the reaction is the same."] },
        { id: "q3", level: "adv", type: "choice", q: ["Ұнтақ кесектерге қарағанда неге тезірек әрекеттеседі?", "Почему порошок реагирует быстрее кусков?", "Why does powder react faster than lumps?"],
          opts: [["Жанасу беті үлкен, бір уақытта көп бөлшек соқтығысады", "Больше поверхность контакта — одновременно сталкивается больше частиц", "Larger contact surface, so more particles collide at once"], ["Ұнтақтың химиялық құрамы басқа", "У порошка другой состав", "The powder has a different composition"], ["Ұнтақ Eₐ-ны төмендетеді", "Порошок снижает Eₐ", "Powder lowers Eₐ"]], correct: 0,
          explain: ["Бірдей массада r 80 есе кіші болса, бет ауданы 80 есе үлкен.", "При той же массе и радиусе в 80 раз меньше площадь в 80 раз больше.", "For the same mass, a radius 80 times smaller gives 80 times more surface."] },
        { id: "q4", level: "res", type: "choice", q: ["2 г CaCO₃ және 0,5 моль/л HCl алғанда мәрмәрдің бір бөлігі әрекеттеспей қалды. Неге?", "При 2 г CaCO₃ и 0,5 моль/л HCl часть мрамора осталась. Почему?", "With 2 g CaCO₃ and 0.5 mol/L HCl, some marble was left over. Why?"],
          opts: [["HCl жетпеді — ол шектеуші зат", "Не хватило HCl — она лимитирующий реагент", "There was not enough HCl — it is the limiting reagent"], ["Реакция тым баяу", "Реакция слишком медленная", "The reaction is too slow"], ["Мәрмәр еріп кетпейді", "Мрамор не растворяется", "Marble does not dissolve"]], correct: 0,
          explain: ["n(HCl) = 0,025 моль тек 0,0125 моль (1,25 г) CaCO₃-пен әрекеттеседі.", "n(HCl) = 0,025 моль реагирует лишь с 0,0125 моль (1,25 г) CaCO₃.", "n(HCl) = 0.025 mol reacts with only 0.0125 mol (1.25 g) of CaCO₃."] },
        { id: "q5", level: "res", type: "open", q: ["Неге көмір шаңы немесе ұн жарылуы мүмкін? Осы тәжірибемен байланыстырыңыз.", "Почему угольная пыль или мука могут взрываться? Свяжите с этим опытом.", "Why can coal dust or flour explode? Link it to this experiment."],
          explain: ["Ұсақ бөлшектердің бет ауданы өте үлкен — тотығу бір сәтте жүріп, жылу мен газ күрт бөлінеді.", "У мелких частиц огромная площадь поверхности — окисление идёт почти мгновенно с резким выделением тепла и газа.", "Fine particles have a huge surface area, so oxidation is almost instant and releases heat and gas suddenly."] }
      ],
      conclusionHint: ["Бет ауданының әсері және масса сақталуы туралы деректерге сүйеніп қорытынды жазыңыз.", "Сделайте вывод о влиянии площади поверхности и о сохранении массы, опираясь на данные.", "Write a data-based conclusion about the effect of surface area and conservation of mass."],
      explain: ["<p>Гетерогенді реакция тек бетте жүреді: ұнтақтың беті кесектерден ондаған есе үлкен, сондықтан CO₂ тез бөлінеді. Бөлінетін CO₂ мөлшері бет ауданына емес, шектеуші затқа тәуелді.</p>", "<p>Гетерогенная реакция идёт только на поверхности: у порошка она в десятки раз больше, чем у кусков, поэтому CO₂ выделяется быстро. Количество CO₂ зависит не от площади, а от лимитирующего реагента.</p>", "<p>A heterogeneous reaction happens only at the surface. Powder has tens of times more surface than lumps, so CO₂ comes off quickly. How much CO₂ forms depends on the limiting reagent, not on the surface area.</p>"]
    },
    {
      id: "k-cat", no: "L4", grade: 10, kind: "lab", level: "base", minutes: 25, minRuns: 2, mode: function () { return "gas"; },
      title: ["Катализатордың реакция жылдамдығына әсері", "Влияние катализатора на скорость реакции", "Effect of a catalyst on reaction rate"],
      topic: ["Химиялық кинетика · катализ", "Химическая кинетика · катализ", "Chemical kinetics · catalysis"],
      goal: ["H₂O₂ ыдырауының жылдамдығын катализаторсыз, MnO₂-мен және каталаза ферментімен салыстыру.", "Сравнить скорость разложения H₂O₂ без катализатора, с MnO₂ и с ферментом каталазой.", "Compare how fast H₂O₂ decomposes without a catalyst, with MnO₂ and with the enzyme catalase."],
      theory: ["<p>2H₂O₂ → 2H₂O + O₂↑, ΔH = −98 кДж/моль H₂O₂. Катализатор активтендіру энергиясы төмен жаңа жол ашады, бірақ ΔH-ты өзгертпейді және реакция соңында өзгеріссіз қалады. Бөлінген O₂ көлемі газ шприцімен өлшенеді.</p>", "<p>2H₂O₂ → 2H₂O + O₂↑, ΔH = −98 кДж/моль H₂O₂. Катализатор открывает путь с меньшей энергией активации, не меняет ΔH и в конце реакции остаётся неизменным. Объём выделившегося O₂ измеряют газовым шприцем.</p>", "<p>2H₂O₂ → 2H₂O + O₂↑, ΔH = −98 kJ per mol of H₂O₂. A catalyst opens a pathway with lower activation energy, leaves ΔH unchanged and is itself unchanged at the end. The volume of O₂ released is measured with a gas syringe.</p>"],
      safety: ["<p>Виртуалды тәжірибе. 3 % H₂O₂ терімен жанасқанда ағартады; концентрлі H₂O₂ қауіпті. Көзілдірік міндетті.</p>", "<p>Виртуальный опыт. 3 % H₂O₂ отбеливает кожу при контакте; концентрированный H₂O₂ опасен. Очки обязательны.</p>", "<p>Virtual experiment. 3% H₂O₂ bleaches skin on contact; concentrated H₂O₂ is dangerous. Goggles are required.</p>"],
      model: { type: ["Есептік модель (оқу коэффициенттері)", "Расчётная модель (учебные коэффициенты)", "Computational model (teaching coefficients)"], notes: [
        ["H₂O₂ бойынша 1-рет: C = C₀·e^(−kt). 10 мл ерітінді, 20 °C, 1 атм; Vₘ = 24,05 л/моль.", "1-й порядок по H₂O₂: C = C₀·e^(−kt). 10 мл раствора, 20 °C, 1 атм; Vₘ = 24,05 л/моль.", "First order in H₂O₂: C = C₀·e^(−kt). 10 mL of solution, 20 °C, 1 atm; Vₘ = 24.05 L/mol."],
        ["k мәндері — оқу мәндері (катализаторсыз 2·10⁻⁷, MnO₂ 0,012, каталаза 0,04 с⁻¹). Нақты k катализатор мөлшеріне де тәуелді.", "Значения k — учебные (без катализатора 2·10⁻⁷, MnO₂ 0,012, каталаза 0,04 с⁻¹). Реальная k зависит и от количества катализатора.", "The k values are teaching values (none 2·10⁻⁷, MnO₂ 0.012, catalase 0.04 s⁻¹). Real k also depends on the amount of catalyst."],
        ["Энергетикалық профильдегі Eₐ — жуық әдеби мәндер: 75 / 58 / 23 кДж/моль.", "Eₐ на энергетическом профиле — приблизительные литературные значения: 75 / 58 / 23 кДж/моль.", "The Eₐ values on the energy profile are approximate literature values: 75 / 58 / 23 kJ/mol."]] },
      equipment: [["Колба", "Колба", "Flask"], ["Газ шприцы, 120 мл", "Газовый шприц, 120 мл", "Gas syringe, 120 mL"], ["H₂O₂ ерітіндісі, 10 мл", "Раствор H₂O₂, 10 мл", "H₂O₂ solution, 10 mL"], ["MnO₂ ұнтағы", "Порошок MnO₂", "MnO₂ powder"], ["Шикі картоп тілімі (каталаза)", "Ломтик сырого картофеля (каталаза)", "Slice of raw potato (catalase)"]],
      controls: [
        { id: "cat", type: "select", value: "none", label: ["Катализатор", "Катализатор", "Catalyst"], options: [{ v: "none", t: ["Жоқ", "Нет", "None"] }, { v: "mno2", t: ["MnO₂", "MnO₂", "MnO₂"] }, { v: "catalase", t: ["Каталаза (картоп)", "Каталаза (картофель)", "Catalase (potato)"] }] },
        { id: "C0", type: "range", min: 0.3, max: 1.5, step: 0.1, value: 0.9, dec: 1, label: ["H₂O₂ концентрациясы", "Концентрация H₂O₂", "H₂O₂ concentration"], unit: MOL }
      ],
      simulate: function (p) { return M.peroxide(p); },
      summary: function (p, r) { return { V60: +r.V60.toFixed(2), Vmax: +r.Vmax.toFixed(1), half: isFinite(r.half) ? +r.half.toFixed(1) : null }; },
      columns: function () { return [L("Катализатор", "Катализатор", "Catalyst"), L("C(H₂O₂), моль/л", "C(H₂O₂), моль/л", "C(H₂O₂), mol/L"), L("V(O₂) 60 с-та, мл", "V(O₂) за 60 с, мл", "V(O₂) at 60 s, mL"), L("t½, с", "t½, с", "t½, s")]; },
      row: function (p, r) {
        var c = { none: ["жоқ", "нет", "none"], mno2: ["MnO₂", "MnO₂", "MnO₂"], catalase: ["каталаза", "каталаза", "catalase"] }[p.cat];
        return [u(c), f(+p.C0, 1), f(r.V60, 1), r.half > 1e5 ? "> 10⁵" : f(r.half, 1)];
      },
      metric: function (p, r) { return { label: ["60 с ішінде бөлінген O₂", "O₂ за 60 с", "O₂ released in 60 s"], value: r.V60, text: f(r.V60, 1) + u(ML) }; },
      chart: { kind: "curves", title: ["O₂ көлемі — уақыт", "Объём O₂ — время", "O₂ volume vs time"], y: function (p, r, t) { return r.V(t); }, xLabel: ["t, с", "t, с", "t, s"], yLabel: ["V(O₂), мл", "V(O₂), мл", "V(O₂), mL"] },
      extra: function (p) {
        var Ea = M.H2O2.Ea, cur = Ea[p.cat], dH = 98, X0 = 40, X1 = 420, Y0 = 200, s = 1.4;
        function y(e) { return Y0 - 60 - e * s; }
        function path(e) { return "M" + X0 + " " + y(0) + " L110 " + y(0) + " C170 " + y(0) + " 190 " + y(e) + " 230 " + y(e) + " C270 " + y(e) + " 290 " + y(-dH) + " 350 " + y(-dH) + " L" + X1 + " " + y(-dH); }
        var g = '<h3>' + L("Энергетикалық профиль", "Энергетический профиль", "Energy profile") + '</h3><div class="chart"><svg viewBox="0 0 460 230" role="img" aria-label="' + L("Энергетикалық профиль", "Энергетический профиль", "Energy profile") + '">';
        ["none", "mno2", "catalase"].forEach(function (k) {
          var on = k === p.cat;
          g += '<path d="' + path(Ea[k]) + '" fill="none" stroke="' + (on ? "var(--accent)" : "var(--border)") + '" stroke-width="' + (on ? 3.5 : 2) + '"' + (on ? "" : ' stroke-dasharray="5 5"') + "/>";
        });
        g += '<line x1="230" x2="230" y1="' + y(0) + '" y2="' + y(cur) + '" stroke="var(--c-ab)" stroke-width="2"/>';
        g += '<text x="238" y="' + ((y(0) + y(cur)) / 2) + '" class="ax-t" style="fill:var(--c-ab)">Eₐ ≈ ' + cur + L(" кДж/моль", " кДж/моль", " kJ/mol") + "</text>";
        g += '<line x1="390" x2="390" y1="' + y(0) + '" y2="' + y(-dH) + '" stroke="var(--ok)" stroke-width="2"/><text x="396" y="' + ((y(0) + y(-dH)) / 2) + '" class="ax-t" style="fill:var(--ok)">ΔH = −98</text>';
        g += '<text x="' + X0 + '" y="' + (y(0) - 8) + '" class="ax">H₂O₂</text><text x="' + X1 + '" y="' + (y(-dH) - 8) + '" class="ax" text-anchor="end">H₂O + ½O₂</text></svg></div>';
        return g + '<p class="muted small">' + L("Үзік сызықтар — басқа жолдар. ΔH барлық жағдайда бірдей.", "Пунктир — другие пути. ΔH во всех случаях одинаков.", "Dashed lines show the other pathways. ΔH is the same in every case.") + "</p>";
      },
      viewNote: ["Көпіршіктер саны есептелген жылдамдыққа пропорционал.", "Число пузырьков пропорционально рассчитанной скорости.", "The number of bubbles is proportional to the calculated rate."],
      prediction: { q: ["MnO₂ қосқанда 60 секундта бөлінетін O₂ көлемі және ең соңындағы O₂ көлемі қалай өзгереді?", "Как изменятся объём O₂ за 60 секунд и итоговый объём O₂ при добавлении MnO₂?", "How will the O₂ volume after 60 s and the final O₂ volume change when MnO₂ is added?"],
        opts: [["60 с-тағы көлем артады, соңғы көлем өзгермейді", "Объём за 60 с вырастет, итоговый не изменится", "The 60 s volume rises; the final volume is unchanged"], ["Екеуі де артады", "Оба вырастут", "Both rise"], ["Ештеңе өзгермейді", "Ничего не изменится", "Nothing changes"]], correct: 0 },
      questions: [
        { id: "q1", level: "base", type: "num", q: ["1-тәжірибе: H₂O₂ толық ыдырағанда бөлінетін O₂ көлемін есептеңіз (10 мл ерітінді, Vₘ = 24,05 л/моль).", "Опыт 1: рассчитайте объём O₂ при полном разложении H₂O₂ (10 мл раствора, Vₘ = 24,05 л/моль).", "Run 1: calculate the O₂ volume for complete decomposition of the H₂O₂ (10 mL of solution, Vₘ = 24.05 L/mol)."],
          unit: ["мл", "мл", "mL"], dec: 1, tol: 0.02, answer: function (st) { var r = st.runs[0]; return r ? r.p.C0 * 0.01 / 2 * M.VM20 * 1000 : null; },
          explain: ["n(H₂O₂) = C·V; n(O₂) = n(H₂O₂)/2; V = n·Vₘ.", "n(H₂O₂) = C·V; n(O₂) = n(H₂O₂)/2; V = n·Vₘ.", "n(H₂O₂) = C·V; n(O₂) = n(H₂O₂)/2; V = n·Vₘ."] },
        { id: "q2", level: "base", type: "choice", q: ["Реакциядан кейін MnO₂ массасы қалай өзгереді?", "Как изменится масса MnO₂ после реакции?", "How does the mass of MnO₂ change after the reaction?"],
          opts: [["Өзгермейді", "Не изменится", "It does not change"], ["Азаяды", "Уменьшится", "It decreases"], ["Артады", "Увеличится", "It increases"]], correct: 0,
          explain: ["Катализатор реакцияда жұмсалмайды.", "Катализатор в реакции не расходуется.", "A catalyst is not used up in the reaction."] },
        { id: "q3", level: "adv", type: "choice", q: ["Катализатор ΔH-ты өзгерте ме?", "Меняет ли катализатор ΔH?", "Does a catalyst change ΔH?"],
          opts: [["Жоқ — тек Eₐ-ны төмендетеді", "Нет — только снижает Eₐ", "No — it only lowers Eₐ"], ["Иә, ΔH азаяды", "Да, ΔH уменьшается", "Yes, ΔH decreases"]], correct: 0,
          explain: ["ΔH бастапқы және соңғы күйлерге ғана тәуелді.", "ΔH зависит только от начального и конечного состояний.", "ΔH depends only on the initial and final states."] },
        { id: "q4", level: "res", type: "choice", q: ["Картопты қайнатып, содан кейін H₂O₂-ге салса не болады?", "Что будет, если картофель сначала сварить, а потом положить в H₂O₂?", "What happens if the potato is boiled first and then put into the H₂O₂?"],
          opts: [["Ыдырау баяулайды: фермент денатурацияланған", "Разложение замедлится: фермент денатурирован", "Decomposition slows down: the enzyme is denatured"], ["Одан да тездейді", "Ускорится ещё сильнее", "It speeds up even more"], ["Ештеңе өзгермейді", "Ничего не изменится", "Nothing changes"]], correct: 0,
          explain: ["Каталаза — ақуыз; қыздырғанда оның құрылымы бұзылады. Бұл модельде есептелмейді — бұл тұжырым теорияға сүйенеді.", "Каталаза — белок; при нагревании её структура разрушается. В этой модели это не рассчитывается — вывод опирается на теорию.", "Catalase is a protein; heating destroys its structure. This model does not calculate that — the conclusion rests on theory."] },
        { id: "q5", level: "res", type: "open", q: ["Нақты катализаторлардың тиімділігін әділ салыстыру үшін қандай шарттарды бірдей ұстау керек?", "Какие условия нужно сохранить одинаковыми, чтобы честно сравнить эффективность катализаторов?", "Which conditions must be kept the same to compare catalysts fairly?"],
          explain: ["H₂O₂ концентрациясы мен көлемі, температура, катализатордың массасы мен бет ауданы, өлшеу уақыты.", "Концентрация и объём H₂O₂, температура, масса и площадь поверхности катализатора, время измерения.", "H₂O₂ concentration and volume, temperature, catalyst mass and surface area, measurement time."] }
      ],
      conclusionHint: ["Катализатор жылдамдыққа және өнімнің соңғы мөлшеріне қалай әсер ететінін деректермен жазыңыз.", "Опишите с данными, как катализатор влияет на скорость и на итоговое количество продукта.", "Describe, with data, how the catalyst affects the rate and the final amount of product."],
      explain: ["<p>Катализатор Eₐ-сы төмен жол ұсынады, сондықтан O₂ әлдеқайда тез бөлінеді. Соңғы O₂ көлемі тек H₂O₂ мөлшеріне тәуелді — катализатор тепе-теңдікті де, ΔH-ты да өзгертпейді.</p>", "<p>Катализатор даёт путь с меньшей Eₐ, поэтому O₂ выделяется гораздо быстрее. Итоговый объём O₂ зависит только от количества H₂O₂ — катализатор не меняет ни равновесие, ни ΔH.</p>", "<p>The catalyst offers a lower-Eₐ pathway, so O₂ comes off much faster. The final O₂ volume depends only on the amount of H₂O₂ — the catalyst changes neither the equilibrium nor ΔH.</p>"]
    },
    {
      id: "k-data", no: "L5", grade: 10, kind: "data", level: "adv", minutes: 20, minRuns: 0, mode: function () { return "gas"; },
      title: ["Тәжірибе деректері бойынша жылдамдықты анықтау", "Определение скорости реакции по экспериментальным данным", "Finding the reaction rate from experimental data"],
      topic: ["Химиялық кинетика · деректерді өңдеу", "Химическая кинетика · обработка данных", "Chemical kinetics · data processing"],
      goal: ["«Концентрация — уақыт» кестесі бойынша орташа жылдамдықты есептеп, оның өзгерісін түсіндіру.", "По таблице «концентрация — время» вычислить средние скорости и объяснить их изменение.", "Calculate average rates from a concentration–time table and explain how they change."],
      theory: ["<p>Орташа жылдамдық v = −ΔC/Δt = (C₁ − C₂)/(t₂ − t₁). Бастапқы зат жұмсалған сайын жылдамдық азаяды. 1-ретті реакцияда ln C уақытқа сызықты тәуелді.</p>", "<p>Средняя скорость v = −ΔC/Δt = (C₁ − C₂)/(t₂ − t₁). По мере расходования исходного вещества скорость уменьшается. Для реакции 1 порядка ln C линейно зависит от времени.</p>", "<p>Average rate v = −ΔC/Δt = (C₁ − C₂)/(t₂ − t₁). As the reactant is used up, the rate falls. For a first-order reaction, ln C depends linearly on time.</p>"],
      safety: ["<p>Бұл жұмыс тек деректермен жүреді.</p>", "<p>Работа выполняется только с данными.</p>", "<p>This task uses data only.</p>"],
      model: { type: ["Есептік модель бойынша жасалған деректер", "Данные, рассчитанные по модели", "Data generated from a model"], notes: [
        ["Деректер H₂O₂ ыдырауының 1-ретті моделі бойынша есептелген (C₀ және k әр нұсқада әртүрлі), 3 таңбаға дейін дөңгелектелген. Бұл нақты өлшеу емес.", "Данные рассчитаны по модели 1 порядка для разложения H₂O₂ (C₀ и k в каждом варианте свои), округлены до 3 знаков. Это не реальные измерения.", "The data are calculated from a first-order model of H₂O₂ decomposition (C₀ and k differ per version) and rounded to 3 decimals. They are not real measurements."]] },
      equipment: [["Деректер кестесі", "Таблица данных", "Data table"], ["Калькулятор", "Калькулятор", "Calculator"]],
      controls: [], simulate: function () { return { ok: false }; },
      dataNote: ["Әр аралық үшін орташа жылдамдықты есептеңіз (үтір де, нүкте де болады). «Жаңа деректер» басқа нұсқа береді.", "Вычислите среднюю скорость для каждого интервала (можно с запятой или точкой). «Новые данные» дадут другой вариант.", "Calculate the average rate for each interval (comma or dot both work). “New data” gives another version."],
      prediction: { q: ["Уақыт өткен сайын орташа жылдамдық қалай өзгереді деп ойлайсыз?", "Как, по-вашему, будет меняться средняя скорость со временем?", "How do you expect the average rate to change over time?"],
        opts: [["Азаяды", "Уменьшаться", "It will decrease"], ["Тұрақты болады", "Оставаться постоянной", "It will stay constant"], ["Артады", "Увеличиваться", "It will increase"]], correct: 0 },
      questions: [
        { id: "q1", level: "base", type: "choice", q: ["Орташа жылдамдық неге азаяды?", "Почему средняя скорость уменьшается?", "Why does the average rate fall?"],
          opts: [["H₂O₂ концентрациясы азаяды", "Уменьшается концентрация H₂O₂", "The H₂O₂ concentration decreases"], ["Температура төмендейді", "Падает температура", "The temperature drops"], ["Катализатор жұмсалады", "Расходуется катализатор", "The catalyst is used up"]], correct: 0,
          explain: ["Жылдамдық бастапқы зат концентрациясына тәуелді.", "Скорость зависит от концентрации исходного вещества.", "The rate depends on the reactant concentration."] },
        { id: "q2", level: "adv", type: "num", q: ["Алғашқы аралық бойынша k = ln(C₀/C₁)/Δt мәнін есептеңіз.", "По первому интервалу вычислите k = ln(C₀/C₁)/Δt.", "From the first interval, calculate k = ln(C₀/C₁)/Δt."],
          unit: ["с⁻¹", "с⁻¹", "s⁻¹"], dec: 4, tol: 0.05, answer: function (st) { var D = NCLabModels.dataset(st.dataSeed); return Math.log(D.rows[0][1] / D.rows[1][1]) / (D.rows[1][0] - D.rows[0][0]); },
          explain: ["1-ретті реакцияда C = C₀·e^(−kt), сондықтан k = ln(C₀/C)/t.", "Для 1 порядка C = C₀·e^(−kt), поэтому k = ln(C₀/C)/t.", "For first order C = C₀·e^(−kt), so k = ln(C₀/C)/t."] },
        { id: "q3", level: "adv", type: "choice", q: ["Реакция 1-ретті екенін қалай тексеруге болады?", "Как проверить, что реакция первого порядка?", "How can you check that the reaction is first order?"],
          opts: [["ln C — t графигі түзу болуы керек", "График ln C от t должен быть прямой", "A graph of ln C against t should be a straight line"], ["C — t графигі түзу болуы керек", "График C от t должен быть прямой", "A graph of C against t should be a straight line"], ["Жылдамдық тұрақты болуы керек", "Скорость должна быть постоянной", "The rate should be constant"]], correct: 0,
          explain: ["C — t түзуі 0-ретке, ln C — t түзуі 1-ретке тән.", "Прямая C от t — признак 0 порядка, прямая ln C от t — 1 порядка.", "A straight C–t line points to zero order; a straight ln C–t line points to first order."] },
        { id: "q4", level: "res", type: "choice", q: ["Осы кестеден активтендіру энергиясын табуға бола ма?", "Можно ли по этой таблице найти энергию активации?", "Can you find the activation energy from this table?"],
          opts: [["Жоқ: деректер бір температурада алынған", "Нет: данные получены при одной температуре", "No: the data were taken at a single temperature"], ["Иә, k арқылы", "Да, через k", "Yes, via k"]], correct: 0,
          explain: ["Eₐ үшін кемінде екі температурадағы k керек (Аррениус теңдеуі).", "Для Eₐ нужна k хотя бы при двух температурах (уравнение Аррениуса).", "Eₐ needs k at two or more temperatures (Arrhenius equation)."] },
        { id: "q5", level: "res", type: "open", q: ["Есептеулеріңіздің дұрыстығын қалай тексересіз?", "Как вы проверите правильность своих расчётов?", "How would you check that your calculations are right?"],
          explain: ["Мысалы: бірліктерді тексеру, жылдамдық уақыт өте азаюы керек, k әр аралықта шамамен бірдей шығуы керек.", "Например: проверить единицы; скорость должна уменьшаться со временем; k на разных интервалах должна получаться примерно одинаковой.", "For example: check the units; the rate should fall over time; k should come out about the same on every interval."] }
      ],
      conclusionHint: ["Жылдамдық қалай өзгергенін, неге солай болатынын және реакция реті туралы не айтуға болатынын жазыңыз.", "Напишите, как менялась скорость, почему, и что можно сказать о порядке реакции.", "Write how the rate changed, why, and what you can say about the reaction order."],
      explain: ["<p>Бастапқы зат жұмсалған сайын концентрация, демек жылдамдық та азаяды. 1-ретті реакцияда k тұрақты, ал әр бірдей уақыт аралығында концентрация бірдей есе кемиді.</p>", "<p>По мере расходования вещества концентрация, а значит и скорость, уменьшается. Для 1 порядка k постоянна, а за равные промежутки концентрация убывает в одно и то же число раз.</p>", "<p>As the reactant is used up, its concentration — and therefore the rate — falls. In a first-order reaction k is constant and the concentration drops by the same factor in equal time intervals.</p>"],
      viewNote: ["", "", ""]
    },
    {
      id: "k-research", no: "L6", grade: 10, kind: "research", level: "res", minutes: 40, minRuns: 4, mode: function (p) { return p.sys === "thio" ? "cross" : p.sys === "h2o2" ? "gas" : "chips"; },
      title: ["Жылдамдық факторларын кешенді зерттеу", "Комплексное исследование факторов скорости реакции", "Investigating the factors that affect reaction rate"],
      topic: ["Химиялық кинетика · зерттеу", "Химическая кинетика · исследование", "Chemical kinetics · investigation"],
      goal: ["Реакциялық жүйе мен факторды өзіңіз таңдап, тәжірибелер сериясын жоспарлау, нәтижелерді салыстыру және дәлелді қорытынды жасау.", "Самостоятельно выбрать реакционную систему и фактор, спланировать серию опытов, сравнить результаты и сделать обоснованный вывод.", "Choose a reaction system and a factor yourself, plan a series of runs, compare the results and draw a justified conclusion."],
      theory: ["<p>Әділ тәжірибе: бір уақытта тек бір фактор өзгереді, қалғандары тұрақты. Әр реакцияның өз кинетикалық заңдылығы бар — бір жүйеде алынған тәуелділікті басқасына автоматты түрде тасымалдауға болмайды.</p>", "<p>Честный эксперимент: одновременно меняется только один фактор, остальные постоянны. У каждой реакции своя кинетическая закономерность — зависимость, полученную на одной системе, нельзя автоматически переносить на другую.</p>", "<p>A fair test changes only one factor at a time and keeps the rest constant. Each reaction has its own kinetics, so a dependence found for one system cannot simply be carried over to another.</p>"],
      safety: ["<p>Барлық тәжірибелер — виртуалды. Нақты зертханада әр жүйенің қауіпсіздік ережелері L1–L4 жұмыстарында берілген.</p>", "<p>Все опыты — виртуальные. Правила безопасности для каждой системы в реальной лаборатории приведены в работах L1–L4.</p>", "<p>All experiments are virtual. Real-lab safety rules for each system are given in labs L1–L4.</p>"],
      model: { type: ["Есептік модельдер (оқу коэффициенттері)", "Расчётные модели (учебные коэффициенты)", "Computational models (teaching coefficients)"], notes: [["L1–L4 жұмыстарындағы модельдер қолданылады — олардың шектеулері сол жұмыстарда сипатталған.", "Используются модели из работ L1–L4 — их ограничения описаны там.", "The models from labs L1–L4 are used; their limitations are described there."]] },
      equipment: [["L1–L4 жұмыстарының жабдығы", "Оборудование работ L1–L4", "Equipment from labs L1–L4"]],
      controls: [
        { id: "sys", type: "select", value: "thio", label: ["Реакциялық жүйе", "Реакционная система", "Reaction system"], options: [{ v: "thio", t: ["Na₂S₂O₃ + HCl", "Na₂S₂O₃ + HCl", "Na₂S₂O₃ + HCl"] }, { v: "h2o2", t: ["H₂O₂ ыдырауы", "Разложение H₂O₂", "H₂O₂ decomposition"] }, { v: "marble", t: ["CaCO₃ + HCl", "CaCO₃ + HCl", "CaCO₃ + HCl"] }] },
        { id: "C", type: "range", min: 0.03, max: 0.15, step: 0.01, value: 0.1, dec: 2, label: ["C(Na₂S₂O₃)", "C(Na₂S₂O₃)", "C(Na₂S₂O₃)"], unit: MOL, show: function (p) { return p.sys === "thio"; } },
        { id: "T", type: "range", min: 10, max: 60, step: 5, value: 20, dec: 0, label: ["Температура", "Температура", "Temperature"], unit: ["°C", "°C", "°C"], show: function (p) { return p.sys === "thio"; } },
        { id: "cat", type: "select", value: "none", label: ["Катализатор", "Катализатор", "Catalyst"], options: [{ v: "none", t: ["Жоқ", "Нет", "None"] }, { v: "mno2", t: ["MnO₂", "MnO₂", "MnO₂"] }, { v: "catalase", t: ["Каталаза", "Каталаза", "Catalase"] }], show: function (p) { return p.sys === "h2o2"; } },
        { id: "C0", type: "range", min: 0.3, max: 1.5, step: 0.1, value: 0.9, dec: 1, label: ["C(H₂O₂)", "C(H₂O₂)", "C(H₂O₂)"], unit: MOL, show: function (p) { return p.sys === "h2o2"; } },
        { id: "size", type: "select", value: "grain", label: ["CaCO₃ түрі", "Форма CaCO₃", "Form of CaCO₃"], options: [{ v: "chunk", t: ["Кесектер", "Куски", "Lumps"] }, { v: "grain", t: ["Түйіршіктер", "Гранулы", "Granules"] }, { v: "powder", t: ["Ұнтақ", "Порошок", "Powder"] }], show: function (p) { return p.sys === "marble"; } },
        { id: "m0", type: "range", min: 0.5, max: 2, step: 0.5, value: 1, dec: 1, label: ["m(CaCO₃)", "m(CaCO₃)", "m(CaCO₃)"], unit: G, show: function (p) { return p.sys === "marble"; } },
        { id: "Ch", type: "range", min: 0.5, max: 2, step: 0.5, value: 1, dec: 1, label: ["C(HCl)", "C(HCl)", "C(HCl)"], unit: MOL, show: function (p) { return p.sys === "marble"; } }
      ],
      simulate: function (p) {
        if (p.sys === "thio") return M.thiosulfate({ C: p.C, T: p.T });
        if (p.sys === "h2o2") return M.peroxide({ C0: p.C0, cat: p.cat });
        return M.marble({ m0: p.m0, C: p.Ch, size: p.size, closed: false });
      },
      summary: function (p, r) { var m = this.metric(p, r); return { metric: isFinite(m.value) ? +m.value.toFixed(3) : null }; },
      columns: function () { return [L("Жүйе", "Система", "System"), L("Шарттар", "Условия", "Conditions"), L("Нәтиже", "Результат", "Result")]; },
      row: function (p, r) {
        var cond = p.sys === "thio" ? "C = " + fmt(+p.C, 2) + ", t = " + p.T + " °C" : p.sys === "h2o2" ? "C₀ = " + fmt(+p.C0, 1) + ", " + L("кат.: ", "кат.: ", "cat.: ") + p.cat : "m = " + fmt(+p.m0, 1) + L(" г, ", " г, ", " g, ") + "C = " + fmt(+p.Ch, 1) + ", " + p.size;
        var sys = { thio: "Na₂S₂O₃ + HCl", h2o2: "H₂O₂", marble: "CaCO₃ + HCl" }[p.sys];
        return [sys, cond, this.metric(p, r).text];
      },
      metric: function (p, r) {
        if (p.sys === "thio") return { label: ["Крест жоғалу уақыты", "Время исчезновения креста", "Time for the cross to vanish"], value: r.t, text: "t = " + fmt(r.t, 1) + u(S) };
        if (p.sys === "h2o2") return { label: ["60 с ішіндегі O₂", "O₂ за 60 с", "O₂ in 60 s"], value: r.V60, text: "V₆₀ = " + fmt(r.V60, 1) + u(ML) };
        return { label: ["90 % CO₂ уақыты", "Время 90 % CO₂", "Time to 90% CO₂"], value: r.complete ? r.t90 : Infinity, text: r.complete ? "t₉₀ = " + fmt(r.t90, 0) + u(S) : "t₉₀ > 1800" + u(S) };
      },
      chart: { kind: "curves", title: ["Әрекеттесу барысы (0–1)", "Ход реакции (0–1)", "Reaction progress (0–1)"], y: function (p, r, t) { return r.progress(t); }, xLabel: ["t, с", "t, с", "t, s"], yLabel: ["Үлес", "Доля", "Fraction"] },
      viewNote: ["Жүйені ауыстырсаңыз, көрініс те ауысады. Тәжірибелерді «Екі тәжірибені салыстыру» бөлімінде тексеріңіз.", "При смене системы меняется и вид. Проверяйте опыты в блоке «Сравнение двух опытов».", "Switching the system switches the view too. Check your runs in “Compare two runs”."],
      prediction: { q: ["Қай фактор таңдалған жүйеде жылдамдыққа ең күшті әсер етеді деп ойлайсыз? Жоспарыңызды «Неге» өрісіне жазыңыз.", "Какой фактор, по-вашему, сильнее всего влияет на скорость в выбранной системе? Запишите план в поле «Почему».", "Which factor do you think affects the rate most in your chosen system? Write your plan in the “Why” box."],
        opts: [["Температура", "Температура", "Temperature"], ["Концентрация", "Концентрация", "Concentration"], ["Беттің ауданы / катализатор", "Площадь поверхности / катализатор", "Surface area / catalyst"], ["Жүйеге байланысты — тәжірибе көрсетеді", "Зависит от системы — покажет опыт", "It depends on the system — the experiment will show"]], correct: 3 },
      questions: [
        { id: "q1", level: "base", type: "choice", q: ["Әділ салыстыру үшін екі тәжірибеде нешеу шарт өзгеруі керек?", "Сколько условий должно отличаться в двух опытах для честного сравнения?", "How many conditions should differ between two runs for a fair comparison?"],
          opts: [["Біреуі ғана", "Только одно", "Only one"], ["Екеуі", "Два", "Two"], ["Бәрі", "Все", "All of them"]], correct: 0,
          explain: ["Тек бір фактор өзгерсе, нәтиженің айырмашылығын сол факторға жатқызуға болады.", "Только тогда различие в результате можно приписать этому фактору.", "Only then can the difference in results be attributed to that factor."] },
        { id: "q2", level: "adv", type: "choice", q: ["Оқушы: «Na₂S₂O₃ жүйесінде C екі есе артқанда жылдамдық 2 есе артты, сондықтан CaCO₃ + HCl жүйесінде де HCl концентрациясы екі есе артса, 2 есе артады». Дұрыс па?", "Ученик: «В системе Na₂S₂O₃ при удвоении C скорость выросла в 2 раза, значит в системе CaCO₃ + HCl при удвоении C(HCl) тоже вырастет в 2 раза». Верно ли?", "A student says: “Doubling C doubled the rate for Na₂S₂O₃, so doubling C(HCl) will also double the rate for CaCO₃ + HCl.” Is that right?"],
          opts: [["Жоқ — әр жүйенің өз заңдылығын тексеру керек", "Нет — закономерность каждой системы нужно проверять отдельно", "No — each system's behaviour must be checked separately"], ["Иә, бұл әмбебап заң", "Да, это универсальный закон", "Yes, it is a universal law"]], correct: 0,
          explain: ["Бұл — негізсіз жалпылау. Гетерогенді жүйеде бет ауданы мен шектеуші зат та әсер етеді.", "Это неправомерное обобщение. В гетерогенной системе влияют ещё площадь поверхности и лимитирующий реагент.", "That is an unjustified generalisation. In a heterogeneous system the surface area and limiting reagent also matter."] },
        { id: "q3", level: "res", type: "choice", q: ["Деректер: A тәжірибесі — 20 °C, C = 0,10, t = 30 с; B тәжірибесі — t = 15 с, шарттары жазылмаған. «Температура жылдамдықты 2 есе арттырды» деген қорытынды жасауға бола ма?", "Данные: опыт A — 20 °C, C = 0,10, t = 30 с; опыт B — t = 15 с, условия не записаны. Можно ли сделать вывод «температура ускорила реакцию в 2 раза»?", "Data: run A — 20 °C, C = 0.10, t = 30 s; run B — t = 15 s, conditions not recorded. Can you conclude “temperature doubled the rate”?"],
          opts: [["Жоқ — деректер жеткіліксіз", "Нет — данных недостаточно", "No — the data are insufficient"], ["Иә", "Да", "Yes"]], correct: 0,
          explain: ["B тәжірибесінің шарттары белгісіз: жылдамдыққа температура да, концентрация да әсер етуі мүмкін.", "Условия опыта B неизвестны: на скорость могли повлиять и температура, и концентрация.", "Run B's conditions are unknown; temperature or concentration could have caused the change."] },
        { id: "q4", level: "res", type: "open", q: ["Зерттеу жоспарыңызды сипаттаңыз: қай фактор, қандай мәндер, нені тұрақты ұстадыңыз және неге?", "Опишите план исследования: какой фактор, какие значения, что держали постоянным и почему?", "Describe your plan: which factor, which values, what you kept constant and why?"],
          explain: ["Жоспарда өзгеретін фактор, тұрақты шарттар, тәжірибелер саны және өлшенетін шама болуы керек.", "В плане должны быть изменяемый фактор, постоянные условия, число опытов и измеряемая величина.", "The plan should state the variable factor, the controlled conditions, the number of runs and what was measured."] },
        { id: "q5", level: "res", type: "open", q: ["Нәтижеңізге қаншалықты сенуге болады? Қандай шектеулер бар (модель, тәжірибе саны)?", "Насколько можно доверять результату? Какие есть ограничения (модель, число опытов)?", "How far can you trust your result? What are the limitations (model, number of runs)?"],
          explain: ["Мысалы: модель жеңілдетілген, коэффициенттері оқу мақсатында алынған; нақты тәжірибеде қайталау мен өлшеу қателігін бағалау керек.", "Например: модель упрощена, коэффициенты учебные; в реальном опыте нужны повторы и оценка погрешности.", "For example: the model is simplified with teaching coefficients; a real experiment needs repeats and an error estimate."] }
      ],
      conclusionHint: ["Қай факторды зерттегеніңізді, қандай тәуелділік алғаныңызды және оны қай тәжірибелер растайтынын жазыңыз.", "Напишите, какой фактор исследовали, какую зависимость получили и какие опыты её подтверждают.", "Write which factor you investigated, what dependence you found and which runs support it."],
      explain: ["<p>Зерттеуде маңыздысы — басқару айнымалылары: бір фактор өзгереді, қалғаны тұрақты. Салыстыру блогы бірнеше шарт өзгерген жұптарды ескертеді.</p>", "<p>Главное в исследовании — контроль переменных: меняется один фактор, остальные постоянны. Блок сравнения предупреждает о парах, где изменилось несколько условий.</p>", "<p>The key to an investigation is controlling variables: change one factor and keep the rest constant. The comparison panel warns about pairs where several conditions changed.</p>"]
    }
  ];

  // Запланированные темы других классов (не карточки, а план разработки).
  var planned = [
    { grade: 7, items: [["Қоспаларды бөлу (ас тұзын тазарту)", "Разделение смесей (очистка соли)", "Separating mixtures (purifying salt)"], ["Физикалық және химиялық құбылыстар", "Физические и химические явления", "Physical and chemical changes"], ["Индикаторлар: қышқылдық және сілтілік орта", "Индикаторы: кислая и щелочная среда", "Indicators: acidic and alkaline solutions"], ["Мырыштың тұз қышқылымен әрекеттесуі; сутекті анықтау", "Цинк и соляная кислота; обнаружение водорода", "Zinc and hydrochloric acid; testing for hydrogen"], ["Карбонаттардың қышқылдармен әрекеттесуі", "Реакции карбонатов с кислотами", "Carbonates reacting with acids"]] },
    { grade: 8, items: [["Массалық үлесі берілген ерітінді дайындау", "Приготовление раствора заданной массовой доли", "Making a solution of given mass fraction"], ["Ерігіштік және температура", "Растворимость и температура", "Solubility and temperature"], ["Оксидтердің қасиеттері", "Свойства оксидов", "Properties of oxides"], ["Экзо- және эндотермиялық үдерістер", "Экзо- и эндотермические процессы", "Exothermic and endothermic processes"]] },
    { grade: 9, items: [["Электролиттер және электр өткізгіштік", "Электролиты и электропроводность", "Electrolytes and conductivity"], ["Ион алмасу реакциялары", "Реакции ионного обмена", "Ion-exchange reactions"], ["Иондарға сапалық реакциялар (белгісіз үлгі)", "Качественные реакции на ионы (неизвестный образец)", "Qualitative tests for ions (unknown sample)"], ["Тотығу-тотықсыздану реакциялары", "Окислительно-восстановительные реакции", "Redox reactions"]] },
    { grade: 11, items: [["Химиялық тепе-теңдік және оның ығысуы", "Химическое равновесие и его смещение", "Chemical equilibrium and its shift"], ["Электролиз", "Электролиз", "Electrolysis"], ["Органикалық қосылыстарға сапалық реакциялар", "Качественные реакции органических соединений", "Qualitative tests for organic compounds"]] }
  ];

  return { VERSION: "1.0.0", list: list, planned: planned };
})();
