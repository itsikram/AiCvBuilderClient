// Writes static HTML for every public marketing route so crawlers and social
// previews get full content without running JavaScript.
//
// Also writes sitemap.xml, robots.txt and the Apache .htaccess, and prerenders head
// tags for published blog posts (fetched from the API), so dist/ can be uploaded to
// any static host (cPanel) with no server-side rendering.
//
// Run after `vite build` and `vite build --ssr src/entry-server.tsx --outDir dist-ssr`.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { loadEnv } from "vite";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const env = { ...loadEnv(process.env.MODE || "production", root, "VITE_"), ...process.env };
const dist = path.join(root, "dist");
const ssrEntry = path.join(root, "dist-ssr", "entry-server.js");

// spa.html is the untouched Vite shell once a previous run has overwritten index.html
const shellFile = fs.existsSync(path.join(dist, "spa.html")) ? "spa.html" : "index.html";
const template = fs.readFileSync(path.join(dist, shellFile), "utf8");
if (!template.includes("<!--head:start-->")) {
  throw new Error("dist/index.html has no <!--head:start--> marker; was it already prerendered?");
}

// Unrendered shell for app routes (dashboard, editor, auth); .htaccess falls back to it.
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

const siteUrl = (
  env.VITE_SITE_URL ||
  env.VITE_APP_URL ||
  env.SITE_URL ||
  env.CLIENT_URL ||
  "https://aicvbuilderbd.online"
).replace(/\/+$/, "");
// Live API, forced (must match API_URL in src/lib/api.ts).
const apiUrl = "https://ownwl9o5ma.c39.airoapp.ai/api/v1";
const xmlEscape = (value) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Preload the body font for the page's language, so text doesn't re-render (and
// move the LCP) when it swaps in. Bangla pages also show Latin text.
const assetFiles = fs.readdirSync(path.join(dist, "assets"));
const fontFile = (pattern) => assetFiles.find((f) => pattern.test(f));
const FONT_PRELOADS = {
  en: [fontFile(/^inter-latin-wght-normal-.*\.woff2$/)],
  bn: [fontFile(/^hind-siliguri-bengali-400-normal-.*\.woff2$/), fontFile(/^inter-latin-wght-normal-.*\.woff2$/)],
};
const fontPreloads = (lang) =>
  (FONT_PRELOADS[lang] ?? FONT_PRELOADS.en)
    .filter(Boolean)
    .map((file) => `<link rel="preload" href="/assets/${file}" as="font" type="font/woff2" crossorigin>`)
    .join("\n    ");

/**
 * `initialData` is the API data the page was rendered with; it is embedded as JSON
 * (not executable, so the CSP allows it) and seeds the client cache before hydration.
 * `lenient` turns length problems into warnings, for admin-written blog posts.
 */
function writePage(url, outFile, { html, head, lang }, { initialData, lenient = false } = {}) {
  if (!head) throw new Error(`${url} rendered no <SEO> head data`);
  // Inline scripts would be blocked by the CSP and break hydration
  if (/<script(?![^>]*application\/ld\+json)[^>]*>/.test(html) || html.includes("<template")) {
    throw new Error(`${url} prerendered with inline scripts; something suspended on the second pass, or the content has <script>`);
  }
  if (lenient) {
    const before = problems.length;
    checkLengths(url, head);
    problems.splice(before).forEach((msg) => console.warn(`warn  ${msg}`));
  } else {
    checkLengths(url, head);
  }
  const data = initialData
    ? `\n    <script type="application/json" id="prerender-data">${JSON.stringify(initialData).replace(/</g, "\\u003c")}</script>`
    : "";
  const page = template
    .replace(/<html lang="[^"]*">/, `<html lang="${lang === "bn" ? "bn-BD" : "en-BD"}">`)
    .replace("<!--head:start-->", `${fontPreloads(lang)}\n    <!--head:start-->`)
    .replace(/<!--head:start-->[\s\S]*?<!--head:end-->/, `<!--head:start-->\n${headHtml(head)}\n    <!--head:end-->`)
    .replace('<div id="root"></div>', `<div id="root">${html}</div>${data}`);
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, page);
}

// Some public pages show API data (plans, templates, blog posts). It is fetched here
// and the pages are prerendered with it, so crawlers get the full content and links.
// Posts published after this build still load (.htaccess falls back to the SPA shell)
// but only reach the sitemap and get static HTML on the next build.
async function getJson(urlPath) {
  const res = await fetch(`${apiUrl}${urlPath}`, { signal: AbortSignal.timeout(60_000) });
  if (!res.ok) throw new Error(`GET ${urlPath}: HTTP ${res.status}`);
  return (await res.json()).data;
}

// Base path -> [react-query key, API path] pairs, matching the useQuery calls in each page
const PAGE_DATA = {
  "/pricing": () => [[["plans"], "/payments/plans"]],
  "/templates": () => [[["templates"], "/templates"]],
  "/blog": (lang) => [[["blogs", lang], `/blogs?language=${lang}`]],
};

const apiAvailable = /^https?:\/\//.test(apiUrl);
if (!apiAvailable) console.warn(`warn  VITE_API_URL (${apiUrl}) is not absolute; prerendering without API data`);

/** API data for a public page, or undefined (the page then prerenders its loading state). */
async function fetchPageData(basePath, lang) {
  if (!apiAvailable || !PAGE_DATA[basePath]) return undefined;
  try {
    return await Promise.all(PAGE_DATA[basePath](lang).map(async ([key, apiPath]) => [key, await getJson(apiPath)]));
  } catch (error) {
    console.warn(`warn  ${lang} ${basePath}: could not fetch API data (${error.message}); prerendering without it`);
    return undefined;
  }
}

async function fetchBlogPosts() {
  if (!apiAvailable) return [];
  try {
    const summaries = [];
    for (let page = 1; page <= 100; page++) {
      const data = await getJson(`/blogs?page=${page}`);
      summaries.push(...data.blogs);
      if (!data.blogs.length || summaries.length >= data.total) break;
    }
    const posts = [];
    for (const summary of summaries) {
      if (!/^[a-z0-9-]+$/i.test(summary.slug)) continue;
      posts.push(await getJson(`/blogs/${summary.slug}`));
    }
    return posts;
  } catch (error) {
    console.warn(`warn  could not fetch blog posts from ${apiUrl} (${error.message}); skipping blog prerender`);
    return [];
  }
}

const today = new Date().toISOString().slice(0, 10);
const manifest = [];

for (const url of PRERENDER_ROUTES) {
  const basePath = url.replace(/^\/bn(?=\/|$)/, "") || "/";
  const lang = url === "/bn" || url.startsWith("/bn/") ? "bn" : "en";
  const initialData = await fetchPageData(basePath, lang);
  const result = await render(url, initialData);
  const outFile = url === "/" ? path.join(dist, "index.html") : path.join(dist, url.slice(1), "index.html");
  writePage(url, outFile, result, { initialData });
  manifest.push({ path: url, lang: result.lang, lastmod: GUIDE_DATES[basePath] ?? today });
  console.log(`prerendered ${url}`);
}

const routesByBase = new Map();
for (const route of manifest) {
  const base = route.path.replace(/^\/bn(?=\/|$)/, "") || "/";
  const entry = routesByBase.get(base) ?? { lastmod: route.lastmod };
  entry[route.lang] = route.path;
  if (route.lastmod > entry.lastmod) entry.lastmod = route.lastmod;
  routesByBase.set(base, entry);
}

const sitemapUrls = [];
for (const entry of routesByBase.values()) {
  const alternates = entry.en && entry.bn
    ? [
        `<xhtml:link rel="alternate" hreflang="en-BD" href="${xmlEscape(`${siteUrl}${entry.en}`)}"/>`,
        `<xhtml:link rel="alternate" hreflang="bn-BD" href="${xmlEscape(`${siteUrl}${entry.bn}`)}"/>`,
        `<xhtml:link rel="alternate" hreflang="x-default" href="${xmlEscape(`${siteUrl}${entry.en}`)}"/>`,
      ].map((link) => `
    ${link}`).join("")
    : "";
  for (const route of [entry.en, entry.bn]) {
    if (!route) continue;
    sitemapUrls.push(
      `  <url>
    <loc>${xmlEscape(`${siteUrl}${route}`)}</loc>
    <lastmod>${xmlEscape(entry.lastmod)}</lastmod>${alternates}
  </url>`
    );
  }
}

let blogCount = 0;
for (const post of await fetchBlogPosts()) {
  const urlPath = `${post.language === "bn" ? "/bn" : ""}/blog/${post.slug}`;
  const initialData = [[["blog", post.slug], post]];
  try {
    const result = await render(urlPath, initialData);
    writePage(urlPath, path.join(dist, urlPath.slice(1), "index.html"), result, { initialData, lenient: true });
  } catch (error) {
    console.warn(`warn  skipped ${urlPath}: ${error.message}`);
    continue;
  }
  blogCount++;
  const lastmod = new Date(post.updatedAt || post.publishedAt || Date.now()).toISOString().slice(0, 10);
  const image = post.coverImage
    ? `
    <image:image><image:loc>${xmlEscape(post.coverImage)}</image:loc></image:image>`
    : "";
  sitemapUrls.push(`  <url>
    <loc>${xmlEscape(`${siteUrl}${urlPath}`)}</loc>
    <lastmod>${lastmod}</lastmod>${image}
  </url>`);
  console.log(`prerendered ${urlPath}`);
}

// The stylesheet only changes how browsers display the file; crawlers ignore it.
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${sitemapUrls.join("\n")}\n</urlset>\n`;
fs.writeFileSync(path.join(dist, "sitemap.xml"), sitemap);
fs.writeFileSync(path.join(dist, "sitemap.xsl"), sitemapXsl());

fs.writeFileSync(
  path.join(dist, "robots.txt"),
  ["User-agent: *", "Disallow: /dashboard", "Disallow: /admin", "Disallow: /r/", "Allow: /", "", `Sitemap: ${siteUrl}/sitemap.xml`, ""].join("\n")
);

fs.writeFileSync(path.join(dist, ".htaccess"), htaccess());

// A page for unknown URLs, served with HTTP 404 by the .htaccess ErrorDocument.
writePage("/404", path.join(dist, "404.html"), await render("/__not-found__"));

fs.writeFileSync(path.join(dist, "prerender-manifest.json"), JSON.stringify({ generatedAt: today, routes: manifest }, null, 2));

if (problems.length) {
  console.error(`\nSEO length check failed:\n${problems.map((p) => `  - ${p}`).join("\n")}`);
  process.exit(1);
}
console.log(`\nPrerendered ${manifest.length} routes + 404.`);

/** Renders sitemap.xml as a readable table in browsers (which otherwise flatten it to text). */
function sitemapXsl() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:s="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
<xsl:output method="html" encoding="UTF-8" indent="yes"/>
<xsl:template match="/">
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="robots" content="noindex"/>
<title>XML Sitemap</title>
<style>
body{font:14px/1.5 system-ui,sans-serif;margin:2rem;color:#1f2937}
h1{font-size:1.4rem}
table{border-collapse:collapse;width:100%}
th,td{text-align:left;padding:.45rem .6rem;border-bottom:1px solid #e5e7eb;vertical-align:top}
th{background:#f3f4f6}
a{color:#2563eb;text-decoration:none}
small{color:#6b7280}
</style>
</head>
<body>
<h1>XML Sitemap</h1>
<p><xsl:value-of select="count(s:urlset/s:url)"/> URLs. This page is for people; search engines read the XML.</p>
<table>
<tr><th>URL</th><th>Languages</th><th>Last modified</th></tr>
<xsl:for-each select="s:urlset/s:url">
<tr>
<td><a href="{s:loc}"><xsl:value-of select="s:loc"/></a></td>
<td><small><xsl:for-each select="xhtml:link"><xsl:value-of select="@hreflang"/><xsl:if test="position() != last()">, </xsl:if></xsl:for-each></small></td>
<td><xsl:value-of select="s:lastmod"/></td>
</tr>
</xsl:for-each>
</table>
</body>
</html>
</xsl:template>
</xsl:stylesheet>
`;
}

/** Apache rules for cPanel: clean URLs, SPA fallback, real 404s, caching and security headers. */
function htaccess() {
  const site = new URL(siteUrl);
  const apiOrigin = /^https?:\/\//.test(apiUrl) ? new URL(apiUrl).origin : "";
  const apexHost = site.hostname.replace(/^www\./, "").replace(/\./g, "\\.");
  const appRoutes = "dashboard|admin|login|register|forgot-password|reset-password|verify-email|r";
  const csp = [
    "default-src 'self'",
    "script-src 'self' https://www.googletagmanager.com https://accounts.google.com/gsi/client",
    ["connect-src 'self'", apiOrigin, "https://accounts.google.com https://www.googletagmanager.com https://*.google-analytics.com https://*.analytics.google.com"]
      .filter(Boolean)
      .join(" "),
    "img-src 'self' data: blob: https:",
    "style-src 'self' 'unsafe-inline' https://accounts.google.com/gsi/style",
    "font-src 'self' data:",
    "frame-src https://accounts.google.com",
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'self'",
    "upgrade-insecure-requests",
  ].join("; ");

  const httpsRules =
    site.protocol === "https:"
      ? `
  # http -> https (also behind a TLS-terminating proxy) and www -> apex
  RewriteCond %{HTTPS} !=on
  RewriteCond %{HTTP:X-Forwarded-Proto} !=https
  RewriteRule ^ ${siteUrl}%{REQUEST_URI} [R=301,L]
  RewriteCond %{HTTP_HOST} ^www\\.${apexHost}$ [NC]
  RewriteRule ^ ${siteUrl}%{REQUEST_URI} [R=301,L]
`
      : "";

  return `# Generated by scripts/prerender.mjs at build time; edit the script, not this file.
# If the host answers every request with HTTP 500, its AllowOverride forbids Options:
# delete the Options line.
Options -MultiViews -Indexes
DirectoryIndex index.html
AddType application/xml .xml .xsl
AddDefaultCharset UTF-8
ErrorDocument 404 /404.html

# Canonical URLs have no trailing slash; stop Apache adding one to prerendered folders
<IfModule mod_dir.c>
  DirectorySlash Off
</IfModule>

<IfModule mod_rewrite.c>
  RewriteEngine On
${httpsRules}
  # "/about/" -> "/about"
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteRule ^(.+)/$ /$1 [R=301,L]

  # Prerendered pages: "/about" -> /about/index.html
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteCond %{REQUEST_FILENAME}/index.html -f
  RewriteRule ^(.+)$ /$1/index.html [L]

  RewriteCond %{REQUEST_FILENAME} -f
  RewriteRule ^ - [L]

  # Client-rendered app sections and shared CVs: SPA shell, kept out of the index
  RewriteRule ^(${appRoutes})(/.*)?$ /spa.html [E=NOINDEX:1,L]

  # Blog posts published since the last build
  RewriteRule ^(bn/)?blog/[A-Za-z0-9-]+$ /spa.html [L]

  # Anything else falls through to ErrorDocument 404
</IfModule>

<IfModule mod_headers.c>
  Header always set Content-Security-Policy "${csp}"
  Header always set X-Content-Type-Options "nosniff"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
  Header always set X-Frame-Options "SAMEORIGIN"
  Header always set Cross-Origin-Opener-Policy "same-origin-allow-popups"
  Header set X-Robots-Tag "noindex" env=NOINDEX
  Header set X-Robots-Tag "noindex" env=REDIRECT_NOINDEX

  # Hashed build assets never change; pages and data revalidate; the rest is cached a day
  <If "%{REQUEST_URI} =~ m#^/assets/#">
    Header set Cache-Control "public, max-age=31536000, immutable"
  </If>
  <ElseIf "%{REQUEST_URI} =~ m#(\\.(html|json|xml|txt)|/[^.]*)$#">
    Header set Cache-Control "no-cache"
  </ElseIf>
  <Else>
    Header set Cache-Control "public, max-age=86400"
  </Else>
</IfModule>

<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css text/plain text/xml application/javascript application/json application/xml image/svg+xml
</IfModule>
`;
}
