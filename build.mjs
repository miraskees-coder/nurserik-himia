// Жинау: src/ бөліктерінен статикалық беттер жасайды (GitHub Pages үшін).
// Мәтін белгісі: ⟦қазақша‖русский‖english⟧ → data-i="N" + I18N.ru[N], I18N.en[N].
// Атрибутта: aria-label="⟦…‖…‖…⟧" → data-ia, title → data-it, placeholder → data-ip.
// Әр беттің өз I18N массиві бар; индекстер бет ішінде ғана мәнді.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const src = (f) => readFileSync(join(root, "src", f), "utf8");

const SITE_JS = ["site/site.js"];
const PAGES = [
  {
    out: "index.html", base: "./", shell: "site/home.html",
    css: ["site/site.css"], js: [...SITE_JS, "site/hero-gas.js"]
  },
  {
    out: "research/index.html", base: "../", shell: "site/research.html",
    css: ["site/site.css"], js: SITE_JS
  },
  {
    out: "trainer/index.html", base: "../", shell: "site/trainer.html",
    css: ["site/site.css", "trainer/trainer.css"], js: [...SITE_JS, "trainer/engine.js", "trainer/trainer.js"]
  },
  {
    out: "kinetics/index.html", base: "../", shell: "kinetics/shell.html",
    slides: ["slides-1.html", "slides-2.html", "slides-3.html", "slides-4.html"].map((f) => "kinetics/" + f),
    css: ["kinetics/style.css"],
    js: ["core.js", "charts.js", "chamber.js", "calcs.js", "lab.js", "quiz.js", "appendix.js"].map((f) => "kinetics/" + f)
  }
];

const KZ = /[әғқңөұүһіӘҒҚҢӨҰҮҺІ]/;
const CYR = /[Ѐ-ӿ]/;
const attrMap = { "aria-label": "ia", title: "it", placeholder: "ip" };
let failed = false;

for (const page of PAGES) {
  const ru = [], en = [], errors = [];
  const add = (body, where) => {
    const parts = body.split("‖");
    if (parts.length !== 3) {
      errors.push(`${where}: ${parts.length} бөлік: ${body.slice(0, 80)}`);
      while (parts.length < 3) parts.push(parts[0]);
    }
    const [k, r, e] = parts.map((s) => s.trim());
    if (KZ.test(r)) errors.push(`RU ішінде қазақ әрпі: ${r.slice(0, 90)}`);
    if (CYR.test(e)) errors.push(`EN ішінде кириллица: ${e.slice(0, 90)}`);
    ru.push(r);
    en.push(e);
    return { i: ru.length - 1, k };
  };

  let html = src(page.shell)
    .replace("<!--HEADER-->", () => (page.slides ? "" : src("site/header.html")))
    .replace("<!--FOOTER-->", () => (page.slides ? "" : src("site/footer.html")))
    .replace("/*CSS*/", () => page.css.map(src).join("\n"))
    .replace("<!--SLIDES-->", () => (page.slides || []).map(src).join("\n"))
    .replace(/\{\{BASE\}\}/g, page.base);

  html = html.replace(/\s(aria-label|title|placeholder)="⟦([^⟧]*)⟧"/g, (m, attr, body) => {
    const { i, k } = add(body, attr);
    return ` ${attr}="${k.replace(/"/g, "&quot;")}" data-${attrMap[attr]}="${i}"`;
  });
  // Элементтің жалғыз мазмұны болса, data-i сол элементке қойылады.
  html = html.replace(/<([a-zA-Z][\w-]*)\b([^<>]*)>\s*⟦([^⟧]*)⟧\s*<\/\1>/g, (m, tag, attrs, body) => {
    const { i, k } = add(body, tag);
    return `<${tag}${attrs} data-i="${i}">${k}</${tag}>`;
  });
  html = html.replace(/⟦([^⟧]*)⟧/g, (m, body) => {
    const { i, k } = add(body, "span");
    return `<span data-i="${i}">${k}</span>`;
  });

  const i18n = JSON.stringify({ ru, en }).replace(/<\//g, "<\\/");
  html = html.replace("/*JS*/", () => `var I18N = ${i18n};\n` + page.js.map(src).join("\n"));

  if (errors.length) {
    console.error(`${page.out}: жинау қателері:\n` + errors.join("\n"));
    failed = true;
    continue;
  }
  mkdirSync(dirname(join(root, page.out)), { recursive: true });
  writeFileSync(join(root, page.out), html);
  console.log(`${page.out}: ${(html.length / 1024).toFixed(0)} KB, ${ru.length} аударма жолы`);
}
if (failed) process.exit(1);
