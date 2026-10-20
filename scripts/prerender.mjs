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

const siteUrl = (
  env.VITE_SITE_URL ||
  env.VITE_APP_URL ||
  env.SITE_URL ||
  env.CLIENT_URL ||
  "https://aicvbuilderbd.online"
).replace(/\/+$/, "");
const apiUrl = (env.VITE_API_URL || "/api/v1").replace(/\/+$/, "");
const SITE_NAME = "AI CV Builder BD";
const xmlEscape = (value) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
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
      ].join("")
    : "";
  for (const route of [entry.en, entry.bn]) {
    if (!route) continue;
    sitemapUrls.push(
      `<url><loc>${xmlEscape(`${siteUrl}${route}`)}</loc><lastmod>${xmlEscape(entry.lastmod)}</lastmod>${alternates}</url>`
    );
  }
}
// Blog posts are client-rendered; give each one real head tags for crawlers and link previews.
// Posts published after this build still load (.htaccess falls back to the SPA shell)
// but only reach the sitemap on the next build.
async function fetchPublishedPosts() {
  if (!/^https?:\/\//.test(apiUrl)) {
    console.warn(`warn  VITE_API_URL (${apiUrl}) is not absolute; skipping blog prerender`);
    return [];
  }
  const posts = [];
  try {
    for (let page = 1; page <= 100; page++) {
      const res = await fetch(`${apiUrl}/blogs?page=${page}`, { signal: AbortSignal.timeout(60_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { data } = await res.json();
      posts.push(...data.blogs);
      if (!data.blogs.length || posts.length >= data.total) break;
    }
  } catch (error) {
    console.warn(`warn  could not fetch blog posts from ${apiUrl} (${error.message}); skipping blog prerender`);
  }
  return posts;
}

function blogHead(post, canonical) {
  const title = post.metaTitle || post.title;
  const description = post.metaDescription || post.excerpt || "";
  const image = post.coverImage || `${siteUrl}/og-image.jpg`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description,
    mainEntityOfPage: canonical,
    image,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: { "@type": "Organization", name: SITE_NAME, url: siteUrl },
    publisher: { "@id": `${siteUrl}/#organization` },
  };
  return [
    `<title data-prerender>${escapeText(title)}</title>`,
    `<meta data-prerender name="description" content="${escapeAttr(description)}" />`,
    `<meta data-prerender name="robots" content="index, follow, max-image-preview:large" />`,
    `<link data-prerender rel="canonical" href="${escapeAttr(canonical)}" />`,
    `<meta data-prerender property="og:title" content="${escapeAttr(title)}" />`,
    `<meta data-prerender property="og:description" content="${escapeAttr(description)}" />`,
    `<meta data-prerender property="og:url" content="${escapeAttr(canonical)}" />`,
    `<meta data-prerender property="og:type" content="article" />`,
    `<meta data-prerender property="og:image" content="${escapeAttr(image)}" />`,
    `<meta data-prerender property="og:site_name" content="${SITE_NAME}" />`,
    `<meta data-prerender name="twitter:card" content="summary_large_image" />`,
    `<script data-prerender type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, "\\u003c")}</script>`,
  ]
    .map((line) => `    ${line}`)
    .join("\n");
}

const posts = await fetchPublishedPosts();
for (const post of posts) {
  if (!/^[a-z0-9-]+$/i.test(post.slug)) continue;
  const lang = post.language === "bn" ? "bn" : "en";
  const urlPath = `${lang === "bn" ? "/bn" : ""}/blog/${post.slug}`;
  const canonical = `${siteUrl}${urlPath}`;
  const page = template
    .replace(/<html lang="[^"]*">/, `<html lang="${lang === "bn" ? "bn-BD" : "en-BD"}">`)
    .replace(/<!--head:start-->[\s\S]*?<!--head:end-->/, `<!--head:start-->\n${blogHead(post, canonical)}\n    <!--head:end-->`);
  const outFile = path.join(dist, urlPath.slice(1), "index.html");
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, page);
  const lastmod = new Date(post.updatedAt || post.publishedAt || Date.now()).toISOString().slice(0, 10);
  sitemapUrls.push(`<url><loc>${xmlEscape(canonical)}</loc><lastmod>${lastmod}</lastmod></url>`);
}
if (posts.length) console.log(`prerendered ${posts.length} blog posts`);

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${sitemapUrls.join("\n")}\n</urlset>\n`;
fs.writeFileSync(path.join(dist, "sitemap.xml"), sitemap);

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
  # http -> https and www -> apex
  RewriteCond %{HTTPS} off [OR]
  RewriteCond %{HTTP_HOST} ^www\\.${apexHost}$ [NC]
  RewriteRule ^ ${siteUrl}%{REQUEST_URI} [R=301,L]
`
      : "";

  return `# Generated by scripts/prerender.mjs at build time; edit the script, not this file.
Options -MultiViews -Indexes
DirectoryIndex index.html
DirectorySlash Off
ErrorDocument 404 /404.html

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
