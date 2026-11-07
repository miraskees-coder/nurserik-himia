/* ================= Реакция камерасы ================= */
safe("chamber", function () {
  var cv = $("camCanvas"), ctx = cv.getContext("2d");
  var gcv = $("camGraph"), gctx = gcv.getContext("2d");
  var inT = $("camT"), inP = $("camP"), inN = $("camN"), inCat = $("camCat");
  var SLIDE = Nav.slides.indexOf($("s2"));

  var COLORS = { A: "#3CC8FF", B: "#FFB547", AB: "#FF4D97", K: "#9AA3C7" };
  var MASS = { A: 1, B: 1, AB: 2, K: 4 };
  var st = { T: 20, p: 1, N: 20, cat: false, paused: false };
  var committed = { T: 20, p: 1, N: 20 };
  var parts = [], flashes = [], sprites = {};
  var W = 0, H = 0, dpr = 1, box = { l: 0, r: 0, b: 0, top: 0 }, pistonY = 0, R = 7, S = 60;
  var simTime = 0, reactTimes = [], collTimes = [], abColl = 0, abEff = 0, formed = 0;
  var history = [], marks = [], lastHist = -1, lastUi = -1;
  var running = false, raf = 0, lastTs = 0, ready = false, done = false;
  var change = { type: "intro" };

  function EA() { return st.cat ? 3.5 : 7; }
  function sigma2() { return 1 + st.T / 25; }
  function gauss() { var u = 1 - Math.random(), v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
  function radius(type) { return type === "AB" ? R * 1.3 : type === "K" ? R * 1.25 : R; }
  function pistonTarget() { return box.b - (box.b - box.top) / st.p; }

  /* ---------- Өлшемдер ---------- */
  function layout() {
    var w = cv.clientWidth, h = cv.clientHeight;
    if (w < 60 || h < 60) return false;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    var old = W ? { l: box.l, r: box.r, b: box.b, top: box.top } : null;
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    W = w; H = h;
    box.l = 16; box.r = W - 16; box.b = H - 24; box.top = 74;
    R = Math.max(4, Math.min(7.5, (box.r - box.l) / 62));
    S = (box.r - box.l) / 5;
    if (old && parts.length) {
      var kx = (box.r - box.l) / (old.r - old.l), ky = (box.b - box.top) / (old.b - old.top);
      parts.forEach(function (q) { q.x = box.l + (q.x - old.l) * kx; q.y = box.b - (old.b - q.y) * ky; q.r = radius(q.type); });
      pistonY = box.b - (old.b - pistonY) * ky;
    } else {
      pistonY = pistonTarget();
    }
    makeSprites();
    var gw = gcv.clientWidth, gh = gcv.clientHeight;
    if (gw > 0 && gh > 0) { gcv.width = Math.round(gw * dpr); gcv.height = Math.round(gh * dpr); }
    return true;
  }

  function makeSprites() {
    ["A", "B", "AB", "K"].forEach(function (t) {
      var r = radius(t), size = Math.ceil(r * 6), c = document.createElement("canvas");
      c.width = c.height = Math.ceil(size * dpr);
      var g = c.getContext("2d");
      g.scale(dpr, dpr);
      var m = size / 2;
      if (t !== "K") {
        var glow = g.createRadialGradient(m, m, r * 0.6, m, m, r * 3);
        glow.addColorStop(0, hexA(COLORS[t], 0.55));
        glow.addColorStop(1, hexA(COLORS[t], 0));
        g.fillStyle = glow;
        g.fillRect(0, 0, size, size);
        var core = g.createRadialGradient(m - r * 0.35, m - r * 0.4, r * 0.1, m, m, r);
        core.addColorStop(0, "#FFFFFF");
        core.addColorStop(0.35, COLORS[t]);
        core.addColorStop(1, shade(COLORS[t], 0.55));
        g.fillStyle = core;
        g.beginPath(); g.arc(m, m, r, 0, Math.PI * 2); g.fill();
      } else {
        g.beginPath();
        for (var i = 0; i < 6; i++) {
          var a = Math.PI / 6 + i * Math.PI / 3;
          g[i ? "lineTo" : "moveTo"](m + r * Math.cos(a), m + r * Math.sin(a));
        }
        g.closePath();
        var hg = g.createLinearGradient(m - r, m - r, m + r, m + r);
        hg.addColorStop(0, "#C9CFE6"); hg.addColorStop(1, "#5E6788");
        g.fillStyle = hg; g.fill();
        g.strokeStyle = "rgba(255,255,255,.5)"; g.lineWidth = 1; g.stroke();
        g.fillStyle = "#1A2142"; g.font = "700 " + Math.round(r * 1.1) + "px Unbounded, system-ui"; g.textAlign = "center"; g.textBaseline = "middle";
        g.fillText("K", m, m + 0.5);
      }
      sprites[t] = { c: c, size: size };
    });
  }
  function hexA(hex, a) {
    var n = parseInt(hex.slice(1), 16);
    return "rgba(" + (n >> 16) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")";
  }
  function shade(hex, k) {
    var n = parseInt(hex.slice(1), 16);
    return "rgb(" + Math.round((n >> 16) * k) + "," + Math.round(((n >> 8) & 255) * k) + "," + Math.round((n & 255) * k) + ")";
  }

  /* ---------- Бөлшектер ---------- */
  function addParticle(type) {
    var r = radius(type), s = Math.sqrt(sigma2() / MASS[type]);
    var top = Math.max(pistonY, pistonTarget());
    for (var tries = 0; tries < 60; tries++) {
      var x = box.l + r + Math.random() * (box.r - box.l - 2 * r);
      var y = top + r + Math.random() * Math.max(1, box.b - top - 2 * r);
      var ok = parts.every(function (q) { var dx = q.x - x, dy = q.y - y; return dx * dx + dy * dy > (q.r + r + 1) * (q.r + r + 1); });
      if (ok || tries === 59) {
        parts.push({ type: type, x: x, y: y, vx: gauss() * s, vy: gauss() * s, r: r, m: MASS[type] });
        return;
      }
    }
  }
  function spawn() {
    parts = []; flashes = [];
    pistonY = pistonTarget();
    for (var i = 0; i < st.N; i++) { addParticle("A"); addParticle("B"); }
    if (st.cat) addCatalyst();
    simTime = 0; reactTimes = []; collTimes = []; abColl = 0; abEff = 0; formed = 0;
    history = [{ t: 0, n: 0 }]; marks = []; lastHist = 0; done = false;
  }
  function addCatalyst() { for (var i = 0; i < 6; i++) addParticle("K"); }
  function removeCatalyst() { parts = parts.filter(function (q) { return q.type !== "K"; }); }
  function countType(t) { var n = 0; parts.forEach(function (q) { if (q.type === t) n++; }); return n; }

  /* ---------- Физика ---------- */
  function step(dt) {
    simTime += dt;
    var target = pistonTarget();
    pistonY += (target - pistonY) * Math.min(1, dt * 1.2);
    var i, j, a, b, n = parts.length;
    for (i = 0; i < n; i++) {
      a = parts[i];
      a.x += a.vx * S * dt; a.y += a.vy * S * dt;
      if (a.x < box.l + a.r) { a.x = box.l + a.r; a.vx = Math.abs(a.vx); }
      if (a.x > box.r - a.r) { a.x = box.r - a.r; a.vx = -Math.abs(a.vx); }
      if (a.y > box.b - a.r) { a.y = box.b - a.r; a.vy = -Math.abs(a.vy); }
      if (a.y < pistonY + a.r) { a.y = pistonY + a.r; a.vy = Math.abs(a.vy); }
    }
    var born = [];
    for (i = 0; i < n; i++) {
      a = parts[i];
      if (a.dead) continue;
      for (j = i + 1; j < n; j++) {
        b = parts[j];
        if (b.dead) continue;
        var dx = b.x - a.x, dy = b.y - a.y, rr = a.r + b.r, d2 = dx * dx + dy * dy;
        if (d2 >= rr * rr || d2 === 0) continue;
        var d = Math.sqrt(d2), nx = dx / d, ny = dy / d;
        var rvx = a.vx - b.vx, rvy = a.vy - b.vy, vn = rvx * nx + rvy * ny;
        // Бөлшектерді бір-бірінен ажырату.
        var over = rr - d, wa = b.m / (a.m + b.m), wb = a.m / (a.m + b.m);
        a.x -= nx * over * wa; a.y -= ny * over * wa;
        b.x += nx * over * wb; b.y += ny * over * wb;
        if (vn <= 0) continue;
        collTimes.push(simTime);
        var pair = (a.type === "A" && b.type === "B") || (a.type === "B" && b.type === "A");
        if (pair) {
          abColl++;
          if (0.5 * (rvx * rvx + rvy * rvy) > EA()) {
            a.dead = b.dead = true;
            abEff++; formed++;
            reactTimes.push(simTime);
            var cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2;
            born.push({ type: "AB", x: cx, y: cy, vx: (a.vx + b.vx) / 2, vy: (a.vy + b.vy) / 2, r: radius("AB"), m: 2 });
            flashes.push({ x: cx, y: cy, t: 0, cat: st.cat });
            break;
          }
        }
        // Серпімді соқтығысу.
        var J = 2 * vn / (1 / a.m + 1 / b.m);
        a.vx -= J / a.m * nx; a.vy -= J / a.m * ny;
        b.vx += J / b.m * nx; b.vy += J / b.m * ny;
      }
    }
    if (born.length) parts = parts.filter(function (q) { return !q.dead; }).concat(born);
    // Термостат: орташа кинетикалық энергия σ²-қа ұмтылады.
    var ke = 0;
    parts.forEach(function (q) { ke += 0.5 * q.m * (q.vx * q.vx + q.vy * q.vy); });
    if (parts.length && ke > 0) {
      var want = sigma2() * parts.length;
      var lam = Math.sqrt(Math.max(0.5, Math.min(1.5, 1 + dt / 0.4 * (want / ke - 1))));
      parts.forEach(function (q) { q.vx *= lam; q.vy *= lam; });
    }
    flashes.forEach(function (f) { f.t += dt; });
    flashes = flashes.filter(function (f) { return f.t < 0.6; });
    while (reactTimes.length && simTime - reactTimes[0] > 3) reactTimes.shift();
    while (collTimes.length && simTime - collTimes[0] > 1) collTimes.shift();
    if (simTime - lastHist >= 0.25) {
      lastHist = simTime;
      history.push({ t: simTime, n: formed });
      while (history.length && simTime - history[0].t > 60) history.shift();
    }
    if (!done && (countType("A") === 0 || countType("B") === 0)) { done = true; explain(); }
  }

  /* ---------- Сурет салу ---------- */
  function draw() {
    if (!W) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    var heat = st.T / 100;
    var rC = Math.round(47 + (255 - 47) * heat), gC = Math.round(123 + (138 - 123) * heat), bC = Math.round(255 + (42 - 255) * heat);
    var heatCol = "rgb(" + rC + "," + gC + "," + bC + ")";
    var glow = ctx.createLinearGradient(0, box.b, 0, box.b - (box.b - box.top) * 0.6);
    glow.addColorStop(0, "rgba(" + rC + "," + gC + "," + bC + ",.28)");
    glow.addColorStop(1, "rgba(" + rC + "," + gC + "," + bC + ",0)");
    ctx.fillStyle = glow;
    ctx.fillRect(box.l, pistonY, box.r - box.l, box.b - pistonY);

    // Құйрықтар.
    ctx.lineCap = "round";
    parts.forEach(function (q) {
      var k = 0.07;
      ctx.strokeStyle = hexA(COLORS[q.type], 0.28);
      ctx.lineWidth = q.r * 1.1;
      ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(q.x - q.vx * S * k, q.y - q.vy * S * k); ctx.stroke();
    });
    parts.forEach(function (q) {
      var sp = sprites[q.type];
      if (sp) ctx.drawImage(sp.c, q.x - sp.size / 2, q.y - sp.size / 2, sp.size, sp.size);
    });
    flashes.forEach(function (f) {
      var k = f.t / 0.6, col = f.cat ? "160,143,255" : "255,77,151";
      var rad = R * (1.5 + k * 5);
      var g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, rad);
      g.addColorStop(0, "rgba(255,255,255," + (0.9 * (1 - k)) + ")");
      g.addColorStop(0.35, "rgba(" + col + "," + (0.7 * (1 - k)) + ")");
      g.addColorStop(1, "rgba(" + col + ",0)");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(f.x, f.y, rad, 0, Math.PI * 2); ctx.fill();
    });

    // Түбі (қыздырғыш) және шыны қабырғалар.
    ctx.fillStyle = heatCol;
    ctx.fillRect(box.l - 4, box.b, box.r - box.l + 8, 6);
    ctx.strokeStyle = "rgba(200,215,255,.55)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(box.l - 2, box.top - 30); ctx.lineTo(box.l - 2, box.b + 2); ctx.lineTo(box.r + 2, box.b + 2); ctx.lineTo(box.r + 2, box.top - 30);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,.12)";
    ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(box.l + 8, box.top); ctx.lineTo(box.l + 8, box.b - 20); ctx.stroke();

    // Поршень.
    var pg = ctx.createLinearGradient(0, pistonY - 14, 0, pistonY);
    pg.addColorStop(0, "#8F98BE"); pg.addColorStop(1, "#4A5380");
    ctx.fillStyle = "#6B739A";
    ctx.fillRect((box.l + box.r) / 2 - 6, 0, 12, pistonY - 14);
    ctx.fillStyle = pg;
    ctx.fillRect(box.l, pistonY - 14, box.r - box.l, 14);
    ctx.fillStyle = "rgba(255,255,255,.35)";
    ctx.fillRect(box.l, pistonY - 14, box.r - box.l, 2);
    var label = L("поршень: p = ", "поршень: p = ", "piston: p = ") + fmt(st.p, 1) + L(" атм", " атм", " atm");
    ctx.font = "600 13px 'Golos Text', system-ui";
    var tw = ctx.measureText(label).width + 20, lx = (box.l + box.r) / 2 + 14, ly = Math.max(8, pistonY - 44);
    ctx.fillStyle = "rgba(18,24,49,.85)";
    roundRect(lx, ly, tw, 24, 12); ctx.fill();
    ctx.strokeStyle = "rgba(160,143,255,.6)"; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = "#E8ECFA"; ctx.textBaseline = "middle"; ctx.textAlign = "left";
    ctx.fillText(label, lx + 10, ly + 12.5);
    ctx.textAlign = "right";
    ctx.fillStyle = "rgba(166,175,206,.9)";
    ctx.font = "600 12px 'Golos Text', system-ui";
    ctx.fillText(fmt(st.T) + " °C", box.r - 6, box.b - 10);
  }
  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r); ctx.closePath();
  }

  function drawGraph() {
    var w = gcv.clientWidth, h = gcv.clientHeight;
    if (!w || !h) return;
    if (gcv.width !== Math.round(w * dpr)) { gcv.width = Math.round(w * dpr); gcv.height = Math.round(h * dpr); }
    gctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    gctx.clearRect(0, 0, w, h);
    var pad = 8, t1 = Math.max(20, simTime), t0 = Math.max(0, t1 - 60), maxN = Math.max(5, st.N);
    function gx(t) { return pad + (t - t0) / (t1 - t0) * (w - 2 * pad); }
    function gy(n) { return h - pad - n / maxN * (h - 2 * pad); }
    gctx.strokeStyle = "rgba(166,175,206,.18)"; gctx.lineWidth = 1;
    [0.25, 0.5, 0.75, 1].forEach(function (f) { gctx.beginPath(); gctx.moveTo(pad, gy(maxN * f)); gctx.lineTo(w - pad, gy(maxN * f)); gctx.stroke(); });
    gctx.strokeStyle = "rgba(160,143,255,.45)"; gctx.setLineDash([3, 3]);
    marks.forEach(function (m) { if (m >= t0) { gctx.beginPath(); gctx.moveTo(gx(m), pad); gctx.lineTo(gx(m), h - pad); gctx.stroke(); } });
    gctx.setLineDash([]);
    if (history.length > 1) {
      gctx.strokeStyle = "#FF4D97"; gctx.lineWidth = 2.5; gctx.beginPath();
      history.forEach(function (p, i) { if (p.t >= t0) gctx[i ? "lineTo" : "moveTo"](gx(p.t), gy(p.n)); });
      gctx.stroke();
    }
    gctx.fillStyle = "rgba(166,175,206,.9)"; gctx.font = "11px 'Golos Text', system-ui"; gctx.textAlign = "left"; gctx.textBaseline = "top";
    gctx.fillText(L("макс. ", "макс. ", "max ") + maxN, pad + 2, pad);
  }

  function updateStats() {
    var win = Math.min(3, Math.max(0.5, simTime));
    $("camRate").textContent = fmt(reactTimes.length / win, 1);
    $("camAB").textContent = String(formed);
    $("camColl").textContent = fmt(collTimes.length / Math.min(1, Math.max(0.25, simTime)), 0);
    $("camEff").textContent = abColl ? pct(abEff / abColl) : "—";
  }

  /* ---------- Энергетикалық төбе ---------- */
  function drawHill() {
    var base = 92, k = 9, prod = 104;
    function hill(ea) {
      var top = base - ea * k;
      return "M10 " + base + " L70 " + base + " C110 " + base + " 120 " + top + " 150 " + top + " C180 " + top + " 190 " + prod + " 230 " + prod + " L290 " + prod;
    }
    var mean = 2 * sigma2(), my = Math.max(20, base - mean * k);
    var g = '<svg viewBox="0 0 300 124" role="img" aria-label="' + esc(L("Энергетикалық төбе", "Энергетический барьер", "Energy hill")) + '">';
    g += '<path d="' + hill(7) + '" fill="none" stroke="var(--accent)" stroke-width="3"' + (st.cat ? ' stroke-opacity=".35"' : "") + "/>";
    if (st.cat) g += '<path d="' + hill(3.5) + '" fill="none" stroke="var(--p-a)" stroke-width="3" stroke-dasharray="6 4"/>';
    g += '<line x1="10" x2="290" y1="' + my + '" y2="' + my + '" stroke="var(--p-b)" stroke-width="1.5" stroke-dasharray="3 3"/>';
    g += svgText(292, my - 4, L("орташа соқтығысу энергиясы ≈ ", "средняя энергия столкновения ≈ ", "mean collision energy ≈ ") + fmt(mean, 1), "ax-label", ' text-anchor="end" style="fill:var(--p-b);font-size:11px"');
    var top = base - EA() * k;
    g += svgText(150, top - 6, "Eₐ = " + fmt(EA(), 1), "ax-title", ' text-anchor="middle" style="font-size:12px"');
    g += svgText(12, base + 14, "A + B", "ax-label", ' style="font-size:11px"');
    g += svgText(288, prod + 14, "AB", "ax-label", ' text-anchor="end" style="font-size:11px"');
    g += "</svg>";
    $("camHill").innerHTML = g;
  }

  /* ---------- Түсініктеме ---------- */
  function explain() {
    var c = change, txt = "";
    if (c.type === "intro") {
      txt = L("Ыдыста <b>A</b> (көк) және <b>B</b> (сары) бөлшектері қозғалып жүр. Олардың соқтығысу энергиясы Eₐ-дан асса, <b>AB</b> өнімі түзіліп, жарқыл шығады. Температураны, қысымды немесе катализаторды өзгертіп көріңіз.",
        "В сосуде движутся частицы <b>A</b> (голубые) и <b>B</b> (жёлтые). Если энергия их столкновения больше Eₐ, образуется продукт <b>AB</b> и видна вспышка. Попробуйте изменить температуру, давление или включить катализатор.",
        "Particles <b>A</b> (blue) and <b>B</b> (yellow) move in the vessel. When their collision energy exceeds Eₐ, the product <b>AB</b> forms with a flash. Try changing the temperature or pressure, or switch on the catalyst.");
    } else if (c.type === "T") {
      var up = c.to > c.from;
      txt = up
        ? L("<b>Температура " + fmt(c.from) + " → " + fmt(c.to) + " °C көтерілді.</b> Бөлшектер жылдамырақ қозғалады: соқтығысулар жиілейді, ең бастысы — энергиясы Eₐ-дан асатын соқтығысулар үлесі артады. Сондықтан өнім тезірек түзіледі, ыдыстың түбі қызара түседі.",
            "<b>Температура повышена " + fmt(c.from) + " → " + fmt(c.to) + " °C.</b> Частицы движутся быстрее: столкновения чаще, а главное — растёт доля столкновений с энергией выше Eₐ. Поэтому продукт образуется быстрее, дно сосуда становится горячим.",
            "<b>Temperature raised " + fmt(c.from) + " → " + fmt(c.to) + " °C.</b> Particles move faster: collisions become more frequent and, above all, a larger share of them exceed Eₐ. So the product forms faster and the bottom of the vessel glows hot.")
        : L("<b>Температура " + fmt(c.from) + " → " + fmt(c.to) + " °C төмендеді.</b> Бөлшектер баяулайды: энергиясы Eₐ-дан асатын соқтығысулар азаяды, сондықтан реакция баяулайды, ыдыстың түбі көгереді.",
            "<b>Температура понижена " + fmt(c.from) + " → " + fmt(c.to) + " °C.</b> Частицы замедляются: столкновений с энергией выше Eₐ становится меньше, поэтому реакция идёт медленнее, дно сосуда синеет.",
            "<b>Temperature lowered " + fmt(c.from) + " → " + fmt(c.to) + " °C.</b> Particles slow down: fewer collisions exceed Eₐ, so the reaction slows and the bottom of the vessel turns blue.");
    } else if (c.type === "p") {
      var k = c.to / c.from, down = k > 1, f = fmt(down ? k : 1 / k, 2);
      txt = down
        ? L("<b>Қысым " + fmt(c.from, 1) + " → " + fmt(c.to, 1) + " атм.</b> Поршень төмен түсіп, көлем " + f + " есе азайды. Бөлшектер тығыз орналасты — концентрация артып, соқтығысу саны өсті. Бір соқтығысудың тиімді болу ықтималдығы өзгерген жоқ, бірақ жылдамдық артады.",
            "<b>Давление " + fmt(c.from, 1) + " → " + fmt(c.to, 1) + " атм.</b> Поршень опустился, объём уменьшился в " + f + " " + razWord(k) + ". Частицы теснее — концентрация выросла, столкновений стало больше. Вероятность того, что одно столкновение эффективно, не изменилась, но скорость растёт.",
            "<b>Pressure " + fmt(c.from, 1) + " → " + fmt(c.to, 1) + " atm.</b> The piston moved down and the volume shrank " + f + "×. Particles are packed closer: concentration and the number of collisions went up. The chance that a single collision is effective is unchanged, but the rate increases.")
        : L("<b>Қысым " + fmt(c.from, 1) + " → " + fmt(c.to, 1) + " атм.</b> Поршень көтеріліп, көлем " + f + " есе артты. Концентрация азайып, соқтығысулар сирейді, сондықтан реакция баяулайды.",
            "<b>Давление " + fmt(c.from, 1) + " → " + fmt(c.to, 1) + " атм.</b> Поршень поднялся, объём увеличился в " + f + " " + razWord(1 / k) + ". Концентрация упала, столкновения реже, поэтому реакция замедляется.",
            "<b>Pressure " + fmt(c.from, 1) + " → " + fmt(c.to, 1) + " atm.</b> The piston rose and the volume grew " + f + "×. Concentration fell and collisions became rarer, so the reaction slows down.");
    } else if (c.type === "N") {
      var more = c.to > c.from;
      txt = L("<b>Бөлшектер саны " + c.from + " → " + c.to + ".</b> Бірдей көлемде бөлшектер " + (more ? "көбейді — концентрация артып, соқтығысулар жиіледі, жылдамдық өседі." : "азайды — концентрация кеміп, соқтығысулар сиреді, жылдамдық төмендейді.") + " Модель жаңа бөлшектермен қайта басталды.",
        "<b>Число частиц " + c.from + " → " + c.to + ".</b> В том же объёме частиц " + (more ? "стало больше — концентрация выросла, столкновения чаще, скорость растёт." : "стало меньше — концентрация упала, столкновения реже, скорость снижается.") + " Модель перезапущена с новыми частицами.",
        "<b>Number of particles " + c.from + " → " + c.to + ".</b> In the same volume there are now " + (more ? "more particles: higher concentration, more frequent collisions, a faster rate." : "fewer particles: lower concentration, rarer collisions, a slower rate.") + " The model restarted with new particles.");
    } else if (c.type === "cat") {
      txt = c.on
        ? L("<b>Катализатор қосылды.</b> Сұр K бөлшектері реакцияға жаңа жол ашады: Eₐ 7-ден 3,5-ке төмендеді (тауды айналмай, туннельден өткендей). Енді баяу бөлшектердің соқтығысуы да тиімді — тиімді үлес күрт өсті, жарқылдар күлгін.",
            "<b>Катализатор включён.</b> Серые частицы K открывают новый путь реакции: Eₐ снизилась с 7 до 3,5 (как туннель вместо перевала). Теперь эффективны и столкновения медленных частиц — доля эффективных резко выросла, вспышки фиолетовые.",
            "<b>Catalyst on.</b> The grey K particles open a new reaction path: Eₐ drops from 7 to 3.5 (like a tunnel instead of a mountain pass). Now even slow particles collide effectively, so the effective share jumps and the flashes turn purple.")
        : L("<b>Катализатор алынды.</b> Eₐ қайтадан 7-ге тең, тек жылдам бөлшектердің соқтығысуы ғана тиімді — реакция баяулады.",
            "<b>Катализатор убран.</b> Eₐ снова равна 7, эффективны только столкновения быстрых частиц — реакция замедлилась.",
            "<b>Catalyst removed.</b> Eₐ is back to 7, so only collisions of fast particles are effective and the reaction slows down.");
    } else if (c.type === "reset") {
      txt = L("<b>Модель қайта басталды.</b> Барлық A және B бөлшектері жаңадан орналасты, есептегіштер нөлденді.",
        "<b>Модель перезапущена.</b> Все частицы A и B расставлены заново, счётчики обнулены.",
        "<b>Model restarted.</b> All A and B particles have been placed again and the counters reset.");
    }
    if (done) txt += "<br>" + L("A немесе B толық жұмсалды — реакция аяқталды. «Қайта бастау» батырмасын басыңыз.",
      "A или B израсходованы полностью — реакция закончилась. Нажмите «Начать заново».",
      "A or B has been used up completely, so the reaction is over. Press “Restart”.");
    $("camExplain").innerHTML = txt;
  }

  function newPhase(c) {
    change = c;
    abColl = 0; abEff = 0;
    marks.push(simTime);
    explain();
    updateStats();
  }

  /* ---------- Басқару ---------- */
  function syncLabels() {
    $("camTv").textContent = fmt(st.T) + " °C";
    $("camPv").textContent = fmt(st.p, 1) + L(" атм", " атм", " atm");
    $("camNv").textContent = String(st.N);
    var k = fmt(st.p, 1);
    $("camVhint").textContent = st.p === 1
      ? L("V = V₀ — бастапқы көлем", "V = V₀ — исходный объём", "V = V₀ — initial volume")
      : L("V = V₀ / " + k + " — көлем " + k + " есе азайды", "V = V₀ / " + k + " — объём уменьшился в " + k + " " + razWord(st.p), "V = V₀ / " + k + " — volume is " + k + "× smaller");
    $("camPause").textContent = st.paused ? L("Жалғастыру", "Продолжить", "Resume") : L("Тоқтату", "Пауза", "Pause");
  }

  inT.addEventListener("input", function () { st.T = +inT.value; syncLabels(); drawHill(); if (!running) draw(); });
  inT.addEventListener("change", function () {
    if (st.T !== committed.T) { newPhase({ type: "T", from: committed.T, to: st.T }); committed.T = st.T; }
  });
  inP.addEventListener("input", function () { st.p = Math.round(+inP.value * 10) / 10; syncLabels(); if (!running) draw(); });
  inP.addEventListener("change", function () {
    if (st.p !== committed.p) { newPhase({ type: "p", from: committed.p, to: st.p }); committed.p = st.p; }
  });
  inN.addEventListener("input", function () { st.N = +inN.value; syncLabels(); });
  inN.addEventListener("change", function () {
    if (st.N !== committed.N) {
      var from = committed.N;
      committed.N = st.N;
      if (ready) spawn();
      newPhase({ type: "N", from: from, to: st.N });
      if (!running) { draw(); drawGraph(); }
    }
  });
  inCat.addEventListener("change", function () {
    st.cat = inCat.checked;
    if (ready) { if (st.cat) addCatalyst(); else removeCatalyst(); }
    drawHill();
    newPhase({ type: "cat", on: st.cat });
    if (!running) draw();
  });
  $("camPause").addEventListener("click", function () { st.paused = !st.paused; syncLabels(); control(); });
  $("camReset").addEventListener("click", function () {
    if (ready) spawn();
    newPhase({ type: "reset" });
    marks = [];
    if (!running) { draw(); drawGraph(); }
  });

  /* ---------- Цикл ---------- */
  function frame(ts) {
    raf = 0;
    if (!running) return;
    var dt = lastTs ? Math.min(0.05, (ts - lastTs) / 1000) : 1 / 60;
    lastTs = ts;
    var sub = Math.max(1, Math.ceil(dt / (1 / 240)));
    for (var i = 0; i < sub; i++) step(dt / sub);
    draw();
    if (simTime - lastUi > 0.2) { lastUi = simTime; updateStats(); drawGraph(); }
    raf = requestAnimationFrame(frame);
  }
  function ensureReady() {
    if (!ready) {
      if (!layout()) return false;
      spawn();
      ready = true;
    }
    return true;
  }
  function control() {
    var want = Nav.cur === SLIDE && !st.paused && !document.hidden;
    if (want) {
      if (!ensureReady()) { setTimeout(control, 100); return; }
      if (!running) { running = true; lastTs = 0; if (!raf) raf = requestAnimationFrame(frame); }
    } else {
      running = false;
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      if (ready && Nav.cur === SLIDE) { draw(); drawGraph(); }
    }
  }

  document.addEventListener("slidechange", control);
  document.addEventListener("visibilitychange", control);
  window.addEventListener("resize", function () {
    if (Nav.cur !== SLIDE || !ready) return;
    if (layout()) { draw(); drawGraph(); }
  });
  onLang(function () { syncLabels(); drawHill(); explain(); if (ready && !running && Nav.cur === SLIDE) { draw(); drawGraph(); } });

  syncLabels();
  drawHill();
  explain();
  updateStats();
  control();
});
