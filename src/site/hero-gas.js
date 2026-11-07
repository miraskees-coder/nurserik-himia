/* ================= Басты беттегі газ моделі =================
   2D серпімді дискілер, келтірілген бірліктер: m = 1, k·300 K = 1.
   2D жүйеде кинетикалық энергиясы E-ден үлкен бөлшектер үлесі = e^(−E/kT). */
safe("hero-gas", function () {
  var cv = $("gasCanvas"), ctx = cv.getContext("2d"), inT = $("gasT"), btn = $("gasPlay");
  var N = 70, EA = 3, W = 0, H = 0, dpr = 1, R = 6, S = 60;
  var parts = [], T = 300, share = null, running = false, visible = true, raf = 0, last = 0, tick = 0;
  var userPaused = reducedMotion();
  var col = {};

  function colors() {
    var cs = getComputedStyle(document.documentElement);
    col.a = cs.getPropertyValue("--c-a").trim() || "#0679B8";
    col.hot = cs.getPropertyValue("--c-ab").trim() || "#C8285F";
    col.wall = cs.getPropertyValue("--border").trim() || "#DCD9D0";
  }
  function gauss() { var u = 1 - Math.random(), v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
  function kT() { return T / 300; }

  function layout() {
    var w = cv.clientWidth, h = cv.clientHeight;
    if (w < 40 || h < 40) return false;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    var ow = W, oh = H;
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    W = w; H = h;
    R = Math.max(4, Math.min(7, Math.sqrt(W * H / N) / 8));
    S = Math.min(W, H) / 5;
    if (ow && parts.length) parts.forEach(function (p) { p.x *= W / ow; p.y *= H / oh; });
    return true;
  }
  function spawn() {
    parts = [];
    var s = Math.sqrt(kT());
    for (var i = 0; i < N; i++) {
      for (var t = 0; t < 40; t++) {
        var x = R + Math.random() * (W - 2 * R), y = R + Math.random() * (H - 2 * R);
        if (parts.every(function (q) { return (q.x - x) * (q.x - x) + (q.y - y) * (q.y - y) > 4.4 * R * R; })) break;
      }
      parts.push({ x: x, y: y, vx: gauss() * s, vy: gauss() * s });
    }
  }
  function step(dt) {
    var i, j, a, b;
    for (i = 0; i < N; i++) {
      a = parts[i];
      a.x += a.vx * S * dt; a.y += a.vy * S * dt;
      if (a.x < R) { a.x = R; a.vx = Math.abs(a.vx); } else if (a.x > W - R) { a.x = W - R; a.vx = -Math.abs(a.vx); }
      if (a.y < R) { a.y = R; a.vy = Math.abs(a.vy); } else if (a.y > H - R) { a.y = H - R; a.vy = -Math.abs(a.vy); }
    }
    for (i = 0; i < N; i++) {
      a = parts[i];
      for (j = i + 1; j < N; j++) {
        b = parts[j];
        var dx = b.x - a.x, dy = b.y - a.y, d2 = dx * dx + dy * dy;
        if (d2 >= 4 * R * R || d2 === 0) continue;
        var d = Math.sqrt(d2), nx = dx / d, ny = dy / d, over = (2 * R - d) / 2;
        a.x -= nx * over; a.y -= ny * over; b.x += nx * over; b.y += ny * over;
        var vn = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
        if (vn <= 0) continue;
        a.vx -= vn * nx; a.vy -= vn * ny; b.vx += vn * nx; b.vy += vn * ny;
      }
    }
    // Термостат: орташа энергия kT-ға баяу ұмтылады, таралу пішінін соқтығысулар қалыптастырады.
    var ke = 0;
    parts.forEach(function (p) { ke += 0.5 * (p.vx * p.vx + p.vy * p.vy); });
    var lam = Math.sqrt(Math.max(0.7, Math.min(1.3, 1 + dt / 0.6 * (kT() * N / ke - 1))));
    parts.forEach(function (p) { p.vx *= lam; p.vy *= lam; });
    var hot = 0;
    parts.forEach(function (p) { if (0.5 * (p.vx * p.vx + p.vy * p.vy) > EA) hot++; });
    var k = Math.min(1, dt / 2.5);
    share = share == null ? hot / N : share + (hot / N - share) * k;
  }
  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    parts.forEach(function (p) {
      var e = 0.5 * (p.vx * p.vx + p.vy * p.vy), hot = e > EA;
      ctx.globalAlpha = 0.25;
      ctx.strokeStyle = hot ? col.hot : col.a;
      ctx.lineWidth = R * 0.9; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * S * 0.06, p.y - p.vy * S * 0.06); ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillStyle = hot ? col.hot : col.a;
      ctx.beginPath(); ctx.arc(p.x, p.y, hot ? R * 1.15 : R, 0, Math.PI * 2); ctx.fill();
    });
  }
  function readouts() {
    $("gasTv").textContent = fmt(T) + L(" К", " К", " K");
    var pct = LANG === "en" ? "%" : " %";
    $("gasModel").textContent = share == null ? "—" : fmt(share * 100, 1) + pct;
    $("gasTheory").textContent = fmt(Math.exp(-EA / kT()) * 100, 1) + pct;
    btn.textContent = running ? L("Тоқтату", "Пауза", "Pause") : L("Іске қосу", "Запустить", "Play");
  }
  function frame(ts) {
    raf = 0;
    if (!running) return;
    var dt = last ? Math.min(0.05, (ts - last) / 1000) : 1 / 60;
    last = ts;
    var n = Math.ceil(dt / (1 / 180));
    for (var i = 0; i < n; i++) step(dt / n);
    draw();
    if (++tick % 10 === 0) readouts();
    raf = requestAnimationFrame(frame);
  }
  function control() {
    var want = !userPaused && visible && !document.hidden;
    if (want && !running) { running = true; last = 0; raf = requestAnimationFrame(frame); }
    if (!want && running) { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }
    readouts();
  }

  if (!layout()) return;
  colors();
  spawn();
  for (var i = 0; i < 240; i++) step(1 / 60);
  draw();
  inT.addEventListener("input", function () { T = +inT.value; readouts(); });
  btn.addEventListener("click", function () { userPaused = running; control(); });
  document.addEventListener("visibilitychange", control);
  document.addEventListener("prefschange", function () { colors(); draw(); });
  try { window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function () { colors(); draw(); }); } catch (e) {}
  window.addEventListener("resize", function () { if (layout()) draw(); });
  try {
    new IntersectionObserver(function (en) { visible = en[0].isIntersecting; control(); }).observe(cv);
  } catch (e) {}
  onLang(readouts);
  control();
});
