// Chrome DevTools Protocol арқылы сайтты тексеру (сыртқы тәуелділіксіз).
// Іске қосу: node tests/browser.mjs [шығыс-қалта]   (алдымен: node build.mjs)
// Chrome 9333 портында ашық болса, сол қолданылады; әйтпесе тест өзі іске қосады.
import http from "node:http";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { spawn } from "node:child_process";
import { join, dirname, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = process.argv[2] || join(ROOT, "tests", "out");
mkdirSync(OUT, { recursive: true });
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 8765, DBG = 9333;

const server = http.createServer((req, res) => {
  if (req.url.startsWith("/frame.html")) {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end('<!doctype html><html><head><link rel="icon" href="data:,"></head><body style="margin:0"><iframe id="f" sandbox="allow-scripts" src="/kinetics/index.html#s4" style="width:1200px;height:760px;border:0"></iframe></body></html>');
    return;
  }
  try {
    let p = decodeURIComponent(req.url.split(/[?#]/)[0]).replace(/^\/nurserik-himia/, "");
    if (p.endsWith("/")) p += "index.html";
    const file = normalize(join(ROOT, p));
    if (!file.startsWith(normalize(ROOT))) throw new Error("outside");
    const body = readFileSync(file);
    const type = file.endsWith(".html") ? "text/html; charset=utf-8" : file.endsWith(".xml") ? "application/xml" : "text/plain; charset=utf-8";
    res.writeHead(200, { "content-type": type });
    res.end(body);
  } catch (e) { res.writeHead(404); res.end(); }
});
await new Promise((r) => server.listen(PORT, r));

let chrome = { kill() {} };
let alive = false;
try { await fetch(`http://127.0.0.1:${DBG}/json/version`); alive = true; } catch {}
if (!alive) chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${DBG}`, `--user-data-dir=${join(OUT, "prof")}`, "--no-first-run", "--no-default-browser-check", "--disable-gpu", "--disable-site-isolation-trials", "--disable-features=IsolateOrigins,site-per-process", "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ver;
for (let i = 0; i < 150; i++) { try { ver = await (await fetch(`http://127.0.0.1:${DBG}/json/version`)).json(); break; } catch { await sleep(200); } }

class CDP {
  constructor(url) { this.ws = new WebSocket(url); this.id = 0; this.p = new Map(); this.h = []; this.ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && this.p.has(m.id)) { const { res, rej } = this.p.get(m.id); this.p.delete(m.id); m.error ? rej(new Error(m.error.message)) : res(m.result); } else this.h.forEach((f) => f(m)); }; }
  open() { return new Promise((r) => (this.ws.onopen = r)); }
  send(method, params = {}) { const id = ++this.id; this.ws.send(JSON.stringify({ id, method, params })); return new Promise((res, rej) => this.p.set(id, { res, rej })); }
  on(f) { this.h.push(f); }
}

async function newPage() {
  let t;
  try { t = await (await fetch(`http://127.0.0.1:${DBG}/json/new?about:blank`, { method: "PUT" })).json(); }
  catch (e) { throw new Error("json/new: " + e.cause); }
  const c = new CDP(t.webSocketDebuggerUrl);
  await c.open();
  c.errors = [];
  c.contexts = [];
  c.on((m) => {
    if (m.method === "Runtime.exceptionThrown") c.errors.push("EXC: " + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text));
    if (m.method === "Runtime.consoleAPICalled" && (m.params.type === "error" || m.params.type === "warning")) c.errors.push(m.params.type.toUpperCase() + ": " + m.params.args.map((a) => a.value ?? a.description).join(" "));
    if (m.method === "Log.entryAdded" && m.params.entry.level === "error") c.errors.push("LOG: " + m.params.entry.text + " " + (m.params.entry.url || ""));
    if (m.method === "Runtime.executionContextCreated") c.contexts.push(m.params.context);
  });
  await c.send("Runtime.enable"); await c.send("Log.enable"); await c.send("Page.enable");
  return c;
}
async function ev(c, expr, contextId) {
  const r = await c.send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true, ...(contextId ? { contextId } : {}) });
  if (r.exceptionDetails) throw new Error("eval: " + (r.exceptionDetails.exception?.description || r.exceptionDetails.text));
  return r.result.value;
}
async function nav(c, url) { await c.send("Page.navigate", { url }); await sleep(1800); }
async function shot(c, name) { const r = await c.send("Page.captureScreenshot", { format: "png" }); writeFileSync(join(OUT, name + ".png"), Buffer.from(r.data, "base64")); }

const results = [];
const check = (name, ok, info = "") => { results.push(`${ok ? "PASS" : "FAIL"}  ${name}${info ? "  — " + info : ""}`); };

// Беттің ішінде орындалатын көмекшілер.
const H = `
  window.__dot = (n) => document.querySelectorAll('#dots .dot')[n-1].click();
  window.__act = () => document.querySelector('.slide.active').id;
  window.__set = (id, v) => { const e = document.getElementById(id); e.value = v; e.dispatchEvent(new Event('input', {bubbles:true})); };
  window.__lang = (l) => document.querySelector('.lang button[data-lang="'+l+'"]').click();
  window.__texts = () => {
    const out = [];
    const walk = (n) => {
      if (n.nodeType === 3) { const t = n.nodeValue.trim(); if (t) out.push(t); return; }
      if (n.nodeType !== 1) return;
      if (n.matches('script,style,[data-trilingual],.lang')) return;
      for (const a of ['aria-label','title','placeholder']) if (n.hasAttribute(a)) out.push('@'+a+': '+n.getAttribute(a));
      n.childNodes.forEach(walk);
    };
    walk(document.body);
    out.push('TITLE: ' + document.title);
    return out;
  };
  true;
`;

try {
  /* ---------- A. Компьютер ---------- */
  const a = await newPage();
  await a.send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
  await nav(a, `http://127.0.0.1:${PORT}/kinetics/index.html`);
  await ev(a, H);
  await shot(a, "d01-home");
  check("Ашылғанда консоль таза", a.errors.length === 0, a.errors.join(" | "));

  await ev(a, "__dot(15)");
  const at15 = await ev(a, "__act()");
  await ev(a, "__dot(3)");
  check("15 → 3 бір басумен", at15 === "s15" && (await ev(a, "__act()")) === "s3", at15 + " → " + (await ev(a, "__act()")));
  await ev(a, "document.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}))");
  check("→ пернесі", (await ev(a, "__act()")) === "s4");
  await ev(a, "document.dispatchEvent(new KeyboardEvent('keydown',{key:'PageUp',bubbles:true}))");
  check("PageUp пернесі", (await ev(a, "__act()")) === "s3");
  await ev(a, "document.querySelector('#s1 a[href=\"#s2\"]').click()");
  check("Ішкі #сілтеме → 2-слайд", (await ev(a, "__act()")) === "s2");
  check("location.hash өзгермеді", (await ev(a, "location.hash")) === "");
  await ev(a, "document.getElementById('menuBtn').click()");
  const menuOpen = await ev(a, "document.getElementById('menu').classList.contains('open')");
  await ev(a, "document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))");
  check("Мәзір Esc-пен жабылады", menuOpen && !(await ev(a, "document.getElementById('menu').classList.contains('open')")));

  // Камера.
  await sleep(700);
  const h1 = await ev(a, "document.getElementById('camCanvas').toDataURL().length + ':' + document.getElementById('camCanvas').toDataURL().slice(-200)");
  await sleep(600);
  const h2 = await ev(a, "document.getElementById('camCanvas').toDataURL().length + ':' + document.getElementById('camCanvas').toDataURL().slice(-200)");
  check("Камерада бөлшектер қозғалады", h1 !== h2);
  await ev(a, "(()=>{const t=document.getElementById('camT'); t.value=90; t.dispatchEvent(new Event('input')); t.dispatchEvent(new Event('change')); const c=document.getElementById('camCat'); c.checked=true; c.dispatchEvent(new Event('change'));})()");
  await sleep(2500);
  const camAB = await ev(a, "document.getElementById('camAB').textContent + ' AB, ' + document.getElementById('camColl').textContent + ' соқт/с, тиімді ' + document.getElementById('camEff').textContent");
  check("Камерада реакция жүреді (90 °C + катализатор)", parseInt(camAB) > 0, camAB);
  await shot(a, "d02-chamber");
  await ev(a, "__dot(1)");
  const f1 = await ev(a, "document.getElementById('camCanvas').toDataURL().length");
  await sleep(400);
  await ev(a, "__dot(2)");
  await ev(a, "__dot(1)");

  // Калькуляторлар.
  await ev(a, "__dot(9)");
  await ev(a, "__set('vhG','2,5'); __set('vhT1','20'); __set('vhT2','50')");
  const vh = await ev(a, "document.getElementById('vhRes').innerText");
  check("Вант-Гофф γ=2,5, ΔT=30 → 15,63", vh.includes("15,63"), vh.split("\n")[0]);
  await ev(a, "__set('arEa','50'); __set('arT1','25'); __set('arT2','35')");
  const ar = await ev(a, "document.getElementById('arRes').innerText");
  check("Аррениус 25 → 35 °C → 1,92", ar.includes("1,92"), ar.split("\n")[0]);
  await ev(a, "document.getElementById('arModeE').click(); __set('arR','2'); __set('arT1','27'); __set('arT2','37')");
  const arE = await ev(a, "document.getElementById('arRes').innerText");
  check("Аррениус Eₐ режимі (×2, 27→37 °C)", /53,6/.test(arE), arE.split("\n")[0]);
  await ev(a, "document.getElementById('arModeK').click(); __set('arT1','25'); __set('arT2','35')");
  await ev(a, "(()=>{const s=document.getElementById('maRx'); s.value='0'; s.dispatchEvent(new Event('change'));})(); __set('maC0','3'); __set('maC1','1'); __set('maP','1')");
  const ma = await ev(a, "document.getElementById('maRes').innerText");
  check("[NO] × 3 → 9", ma.split("\n")[0].includes("9 есе"), ma.split("\n")[0]);
  await ev(a, "__set('vhG','abc')");
  const bad = await ev(a, "document.getElementById('vhRes').classList.contains('err')");
  await ev(a, "__set('vhG','2.5')");
  check("Қате енгізу ұсталады, нүкте де қабылданады", bad && (await ev(a, "document.getElementById('vhRes').innerText")).includes("15,63"));
  await shot(a, "d09-calc");

  // Тест күйі.
  await ev(a, "__dot(14)");
  await ev(a, "document.querySelector('#quiz .q-opt').click()");
  await ev(a, "document.querySelector('#quiz [data-next]').click()");
  await ev(a, "document.querySelector('#quiz .q-opt').click()");
  const qkk = await ev(a, "document.querySelector('#quiz .ctrl-top').innerText");

  // Тілдер.
  const kkBefore = await ev(a, "JSON.stringify(__texts())");
  await ev(a, "__lang('ru')");
  await sleep(200);
  const ruTexts = await ev(a, "__texts()");
  const KZ = /[әғқңөұүһіӘҒҚҢӨҰҮҺІ]/;
  const ruBad = ruTexts.filter((t) => KZ.test(t));
  check("Орысшада қазақ әрпі жоқ", ruBad.length === 0, ruBad.slice(0, 8).join(" ‖ "));
  const qru = await ev(a, "document.querySelector('#quiz .ctrl-top').innerText");
  check("Тіл ауысқанда тест күйі сақталады", qru.includes("2 / 15") && qkk.includes("2 / 15") && qkk.replace(/\D/g, "") === qru.replace(/\D/g, ""), qkk.replace(/\n/g, " ") + " → " + qru.replace(/\n/g, " "));
  const vhRu = await ev(a, "document.getElementById('vhRes').innerText.split('\\n')[0]");
  const maRu = await ev(a, "document.getElementById('maRes').innerText.split('\\n')[0]");
  check("Орысша септеу", vhRu.includes("в 15,63 раза") && maRu.includes("в 9 раз"), vhRu + " | " + maRu);
  check("html lang=ru, title", (await ev(a, "document.documentElement.lang")) === "ru" && (await ev(a, "document.title")).startsWith("Скорость"));
  await ev(a, "__dot(15)");
  await shot(a, "d15-ru");

  await ev(a, "__lang('en')");
  await sleep(200);
  const enTexts = await ev(a, "__texts()");
  const enBad = enTexts.filter((t) => /[\u0400-\u04FF]/.test(t));
  check("Ағылшыншада кириллица жоқ", enBad.length === 0, enBad.slice(0, 8).join(" ‖ "));
  const vhEn = await ev(a, "document.getElementById('vhRes').innerText.split('\\n')[0]");
  const maEn = await ev(a, "document.getElementById('maRes').innerText.split('\\n')[0]");
  check("Ағылшынша «× faster» және нүкте", vhEn.includes("15.63× faster") && maEn.includes("9× faster"), vhEn + " | " + maEn);
  const vhInp = await ev(a, "document.getElementById('vhG').value");
  check("Енгізу өрісіндегі бөлгіш ауысты", vhInp === "2.5", vhInp);
  await ev(a, "__dot(4)");
  await shot(a, "d04-en");
  await ev(a, "__dot(6)");
  await shot(a, "d06-en");

  await ev(a, "__dot(14)");
  await ev(a, "__lang('kk')");
  await sleep(200);
  const kkAfter = await ev(a, "JSON.stringify(__texts())");
  if (kkBefore !== kkAfter) {
    const A = JSON.parse(kkBefore), B = JSON.parse(kkAfter);
    const diff = A.map((t, i) => (t !== B[i] ? t + " ≠ " + B[i] : null)).filter(Boolean).filter((d) => !/^\d|соқт|өнім/.test(d));
    check("Қазақшаға қайтқанда бәрі бастапқы күйде", diff.length === 0, diff.slice(0, 6).join(" ‖ "));
  } else check("Қазақшаға қайтқанда бәрі бастапқы күйде", true);
  check("Компьютерде консоль таза (барлық әрекеттен кейін)", a.errors.length === 0, a.errors.join(" | "));

  for (const n of [3, 5, 7, 8, 10, 11, 12, 13]) { await ev(a, `__dot(${n})`); await sleep(150); await shot(a, "d" + String(n).padStart(2, "0")); }

  /* ---------- B. Телефон 390 px ---------- */
  const b = await newPage();
  await b.send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await b.send("Emulation.setTouchEmulationEnabled", { enabled: true });
  await nav(b, `http://127.0.0.1:${PORT}/kinetics/index.html`);
  await ev(b, H);
  const over = [];
  for (let n = 1; n <= 15; n++) {
    await ev(b, `__dot(${n})`);
    await sleep(n === 2 ? 600 : 120);
    const m = await ev(b, `(()=>{const s=document.querySelector('.slide.active');
      const bad=[...s.querySelectorAll('*')].filter(e=>{const r=e.getBoundingClientRect(); if(!r.width) return false; if(e.closest('.table-wrap,.formula,.dots')) return false; return r.right>391||r.left<-1;}).slice(0,3).map(e=>e.tagName+'.'+e.className+' '+Math.round(e.getBoundingClientRect().right));
      return {doc:document.documentElement.scrollWidth, sw:s.scrollWidth, cw:s.clientWidth, bad};})()`);
    if (m.doc > 390 || m.sw > m.cw + 1 || m.bad.length) over.push(`s${n}: doc ${m.doc}, slide ${m.sw}/${m.cw} ${m.bad.join(", ")}`);
    if ([1, 2, 3, 6, 9, 12, 14].includes(n)) await shot(b, "m" + String(n).padStart(2, "0"));
  }
  check("390 px: көлденең асып кету жоқ", over.length === 0, over.join(" | "));
  // Саусақпен сырғыту.
  await ev(b, "__dot(5)");
  const sw = async (x0, x1, y) => {
    await b.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: x0, y }] });
    for (let k = 1; k <= 5; k++) await b.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x0 + (x1 - x0) * k / 5, y }] });
    await b.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await sleep(250);
  };
  await sw(330, 80, 200);
  check("Саусақпен сырғыту (солға → келесі)", (await ev(b, "__act()")) === "s6", await ev(b, "__act()"));
  check("Телефонда консоль таза", b.errors.length === 0, b.errors.join(" | "));

  /* ---------- C. iframe sandbox="allow-scripts" ---------- */
  const c = await newPage();
  await c.send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
  await nav(c, `http://127.0.0.1:${PORT}/frame.html`);
  await sleep(500);
  const tree = await c.send("Page.getFrameTree");
  const childId = tree.frameTree.childFrames?.[0]?.frame.id;
  const ctx = c.contexts.find((x) => x.auxData?.frameId === childId && x.auxData?.isDefault);
  if (!ctx) check("iframe контексті табылды", false, JSON.stringify(tree.frameTree.childFrames || []).slice(0, 200) + " ctx:" + c.contexts.map(x => JSON.stringify(x.auxData)).join(","));
  else {
    await ev(c, H, ctx.id);
    const start = await ev(c, "__act()", ctx.id);
    await ev(c, "document.getElementById('nextBtn').click()", ctx.id);
    const nxt = await ev(c, "__act()", ctx.id);
    await ev(c, "__dot(15)", ctx.id); await ev(c, "__dot(3)", ctx.id);
    const back = await ev(c, "__act()", ctx.id);
    await ev(c, "__lang('en')", ctx.id);
    const ttl = await ev(c, "document.querySelector('#s3 h2').textContent", ctx.id);
    check("iframe: hash оқылды (#s4) және слайдтар ауысады", start === "s4" && nxt === "s5" && back === "s3", `${start} → ${nxt} → ${back}`);
    check("iframe: тіл ауысады (localStorage жоқ болса да)", ttl.startsWith("Rate"), ttl);
    await ev(c, "__dot(2)", ctx.id);
    await sleep(800);
    await shot(c, "f02-iframe");
  }
  check("iframe ішінде консоль таза", c.errors.length === 0, c.errors.join(" | "));

  /* ---------- D. Платформа беттері ---------- */
  const d = await newPage();
  const KZd = /[әғқңөұүһіӘҒҚҢӨҰҮҺІ]/;
  const textsP = `(() => { const out = []; const walk = (n) => { if (n.nodeType === 3) { const t = n.nodeValue.trim(); if (t) out.push(t); return; } if (n.nodeType !== 1) return; if (n.matches('script,style,.lang-seg')) return; for (const a of ['aria-label','title','placeholder']) if (n.hasAttribute(a)) out.push('@'+a+': '+n.getAttribute(a)); n.childNodes.forEach(walk); }; walk(document.body); out.push('TITLE: '+document.title); return out; })()`;
  for (const [w, h] of [[1280, 800], [390, 844]]) {
    await d.send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: w < 500 ? 2 : 1, mobile: w < 500 });
    for (const pg of ["", "research/"]) {
      d.errors.length = 0;
      await nav(d, `http://127.0.0.1:${PORT}/nurserik-himia/${pg}`);
      const tag = `${pg || "home"} @${w}`;
      check(`Платформа ${tag}: консоль таза`, d.errors.length === 0, d.errors.join(" | "));
      const ov = await ev(d, `(()=>{const bad=[...document.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect(); if(!r.width||e.closest('.table-wrap')) return false; return r.right>innerWidth+1||r.left<-1;}).slice(0,3).map(e=>e.tagName+'.'+e.className); return {sw:document.documentElement.scrollWidth, bad};})()`);
      check(`Платформа ${tag}: көлденең асып кету жоқ`, ov.sw <= w && ov.bad.length === 0, JSON.stringify(ov));
      if (w === 1280) {
        await ev(d, "document.querySelector('.lang-seg [data-lang=\"ru\"]').click()");
        const ruBadP = (await ev(d, textsP)).filter((t) => KZd.test(t));
        check(`Платформа ${tag}: орысшада қазақ әрпі жоқ`, ruBadP.length === 0, ruBadP.slice(0, 5).join(" ‖ "));
        await ev(d, "document.querySelector('.lang-seg [data-lang=\"en\"]').click()");
        const enBadP = (await ev(d, textsP)).filter((t) => /[\u0400-\u04FF]/.test(t));
        check(`Платформа ${tag}: ағылшыншада кириллица жоқ`, enBadP.length === 0, enBadP.slice(0, 5).join(" ‖ "));
        await ev(d, "document.querySelector('.lang-seg [data-lang=\"kk\"]').click()");
        const links = await ev(d, "[...new Set([...document.querySelectorAll('a[href]')].map(a=>a.href).filter(h=>h.startsWith(location.origin)).map(h=>h.split('#')[0]))]");
        const broken = [];
        for (const u of links) { const r = await fetch(u); if (r.status !== 200) broken.push(r.status + " " + u); }
        check(`Платформа ${tag}: ішкі сілтемелер ашылады (${links.length})`, broken.length === 0, broken.join(" | "));
        await shot(d, "p-" + (pg ? "research" : "home") + "-ru-en-kk");
      } else await shot(d, "p-" + (pg ? "research" : "home") + "-m");
    }
  }
  await d.send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
  await nav(d, `http://127.0.0.1:${PORT}/nurserik-himia/`);
  await sleep(1500);
  const gas = await ev(d, "[document.getElementById('gasModel').textContent, document.getElementById('gasTheory').textContent]");
  check("Басты бет моделі: үлес есептеледі", gas[0] !== "—" && /5/.test(gas[1]), gas.join(" / "));
  await ev(d, "document.getElementById('prefsBtn').click(); document.querySelector('[data-theme-set=\"dark\"]').click()");
  const th = await ev(d, "document.documentElement.getAttribute('data-theme') + ' ' + getComputedStyle(document.body).backgroundColor");
  check("Тақырып ауысады (қараңғы)", th.startsWith("dark") && th.includes("15, 18, 34"), th);
  await shot(d, "p-home-dark");
  await ev(d, "document.querySelector('[data-theme-set=\"system\"]').click(); document.querySelector('[data-a11y=\"large\"]').click()");
  const fsz = await ev(d, "getComputedStyle(document.documentElement).fontSize");
  await ev(d, "document.querySelector('[data-a11y=\"large\"]').click()");
  check("Үлкен қаріп режимі", fsz === "19.5px", fsz);
  await nav(d, "about:blank");
  await nav(d, `http://127.0.0.1:${PORT}/nurserik-himia/#14`);
  const red = await ev(d, "location.pathname + ' ' + (document.querySelector('.slide.active')||{}).id");
  check("Ескі сілтеме /#14 → сабақтың 14-слайды", red.includes("/kinetics/") && red.endsWith("s14"), red);
  check("Платформа: консоль таза (барлық әрекеттен кейін)", d.errors.length === 0, d.errors.join(" | "));
} catch (e) {
  results.push("ERROR " + e.stack);
} finally {
  console.log(results.join("\n"));
  chrome.kill();
  server.close();
  process.exit(0);
}
