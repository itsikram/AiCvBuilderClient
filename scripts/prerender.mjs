// Writes static HTML for every public marketing route so crawlers and social
// previews get full content without running JavaScript.
//
// Run after `vite build` and `vite build --ssr src/entry-server.tsx --outDir dist-ssr`.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const ssrEntry = path.join(root, "dist-ssr", "entry-server.js");

// spa.html is the untouched Vite shell once a previous run has overwritten index.html
const shellFile = fs.existsSync(path.join(dist, "spa.html")) ? "spa.html" : "index.html";
const template = fs.readFileSync(path.join(dist, shellFile), "utf8");
if (!template.includes("<!--head:start-->")) {
  throw new Error("dist/index.html has no <!--head:start--> marker; was it already prerendered?");
}

// Unrendered shell for app routes (dashboard, editor, auth), served by the API server.
fs.writeFileSync(path.join(dist, "spa.html"), template);

const { render, PRERENDER_ROUTES, GUIDE_DATES } = await import(pathToFileURL(ssrEntry).href);

const escapeAttr = (value) =>
  String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escapeText = (value) => String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// React prop names -> HTML attribute names
const attrName = (name) => (name === "hrefLang" ? "hreflang" : name);

function headHtml(head) {
  const lines = [`<title data-prerender>${escapeText(head.title)}</title>`];
  for (const { tag, attrs } of head.tags) {
    const rendered = Object.entries(attrs)
      .map(([key, value]) => `${attrName(key)}="${escapeAttr(value)}"`)
      .join(" ");
    lines.push(`<${tag} data-prerender ${rendered} />`);
  }
  return lines.map((line) => `    ${line}`).join("\n");
}

const problems = [];
function checkLengths(url, head) {
  if (head.noIndex) return;
  const description = head.tags.find((t) => t.attrs.name === "description")?.attrs.content ?? "";
  // Google truncates by pixel width; Bangla glyphs are wider, so only warn there.
  const strict = head.lang === "en";
  if (head.title.length > 60) {
    const msg = `${url}: title is ${head.title.length} chars (max 60): ${head.title}`;
    strict ? problems.push(msg) : console.warn(`warn  ${msg}`);
  }
  if (description.length > 155) {
    const msg = `${url}: description is ${description.length} chars (max 155)`;
    strict ? problems.push(msg) : console.warn(`warn  ${msg}`);
  }
}

function writePage(url, outFile, { html, head, lang }) {
  if (!head) throw new Error(`${url} rendered no <SEO> head data`);
  // Inline scripts would be blocked by the CSP and break hydration
  if (/<script(?![^>]*application\/ld\+json)[^>]*>/.test(html) || html.includes("<template")) {
    throw new Error(`${url} prerendered with inline Suspense scripts; something suspended on the second pass`);
  }
  checkLengths(url, head);
  const page = template
    .replace(/<html lang="[^"]*">/, `<html lang="${lang === "bn" ? "bn-BD" : "en-BD"}">`)
    .replace(/<!--head:start-->[\s\S]*?<!--head:end-->/, `<!--head:start-->\n${headHtml(head)}\n    <!--head:end-->`)
    .replace('<div id="root"></div>', `<div id="root">${html}</div>`);
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, page);
}

const today = new Date().toISOString().slice(0, 10);
const manifest = [];

for (const url of PRERENDER_ROUTES) {
  const result = await render(url);
  const outFile = url === "/" ? path.join(dist, "index.html") : path.join(dist, url.slice(1), "index.html");
  writePage(url, outFile, result);
  const basePath = url.replace(/^\/bn(?=\/|$)/, "") || "/";
  manifest.push({ path: url, lang: result.lang, lastmod: GUIDE_DATES[basePath] ?? today });
  console.log(`prerendered ${url}`);
}

// A page for unknown URLs, served with HTTP 404 by the API server.
writePage("/404", path.join(dist, "404.html"), await render("/__not-found__"));

fs.writeFileSync(path.join(dist, "prerender-manifest.json"), JSON.stringify({ generatedAt: today, routes: manifest }, null, 2));

if (problems.length) {
  console.error(`\nSEO length check failed:\n${problems.map((p) => `  - ${p}`).join("\n")}`);
  process.exit(1);
}
console.log(`\nPrerendered ${manifest.length} routes + 404.`);
