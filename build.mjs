// Жинау: src/ бөліктерінен бір index.html жасайды.
// Мәтін белгісі: ⟦қазақша‖русский‖english⟧ → data-i="N" + I18N.ru[N], I18N.en[N].
// Атрибутта: aria-label="⟦…‖…‖…⟧" → data-ia, title → data-it, placeholder → data-ip.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const src = (f) => readFileSync(join(root, "src", f), "utf8");

const slideFiles = ["slides-1.html", "slides-2.html", "slides-3.html", "slides-4.html"];
const jsFiles = ["core.js", "charts.js", "chamber.js", "calcs.js", "lab.js", "quiz.js", "appendix.js"];

let html = src("shell.html")
  .replace("/*CSS*/", () => src("style.css"))
  .replace("<!--SLIDES-->", () => slideFiles.map(src).join("\n"));

const ru = [], en = [];
const errors = [];
const KZ = /[әғқңөұүһіӘҒҚҢӨҰҮҺІ]/;
const CYR = /[Ѐ-ӿ]/;

function add(body, where) {
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
}

const attrMap = { "aria-label": "ia", title: "it", placeholder: "ip" };
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
const js = `var I18N = ${i18n};\n` + jsFiles.map(src).join("\n");
html = html.replace("/*JS*/", () => js);

if (errors.length) {
  console.error("Жинау қателері:\n" + errors.join("\n"));
  process.exit(1);
}
writeFileSync(join(root, "index.html"), html);
console.log(`index.html: ${(html.length / 1024).toFixed(0)} KB, ${ru.length} аударма жолы`);
