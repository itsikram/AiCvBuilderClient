// Serves the built site (dist/) as a Node.js app, for hosts that run `npm start` instead of
// serving static files through Apache. Mirrors the rules scripts/prerender.mjs writes to
// dist/.htaccess: clean URLs for prerendered pages, the SPA shell for app routes, real 404s,
// and the same caching and security headers. No dependencies, so `npm start` needs only Node.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const port = process.env.PORT || 3000;
const dist = path.join(path.dirname(fileURLToPath(import.meta.url)), "dist");

const APP_ROUTE = /^\/(dashboard|admin|login|register|forgot-password|reset-password|verify-email|r)(\/.*)?$/;
// Blog posts published since the last build
const NEW_BLOG_POST = /^\/(bn\/)?blog\/[A-Za-z0-9-]+$/;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".pdf": "application/pdf",
};
const COMPRESSIBLE = new Set([".html", ".js", ".mjs", ".css", ".json", ".webmanifest", ".xml", ".txt", ".svg"]);

// The build writes the CSP (including the API origin) into .htaccess; reuse it so both stay in sync
const csp = (() => {
  try {
    return fs.readFileSync(path.join(dist, ".htaccess"), "utf8").match(/Content-Security-Policy "([^"]+)"/)?.[1];
  } catch {
    return undefined;
  }
})();

const SECURITY_HEADERS = {
  ...(csp && { "Content-Security-Policy": csp }),
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Frame-Options": "SAMEORIGIN",
  "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
};

const isFile = (file) => {
  try {
    return fs.statSync(file).isFile();
  } catch {
    return false;
  }
};

/** Maps a URL path to a file in dist/, never outside it */
const resolve = (urlPath) => {
  const file = path.join(dist, path.normalize(urlPath));
  return file === dist || file.startsWith(dist + path.sep) ? file : null;
};

const cacheControl = (urlPath, ext) =>
  urlPath.startsWith("/assets/")
    ? "public, max-age=31536000, immutable"
    : !ext || [".html", ".json", ".xml", ".txt"].includes(ext)
      ? "no-cache"
      : "public, max-age=86400";

const send = (req, res, file, status = 200, extraHeaders = {}) => {
  const ext = path.extname(file).toLowerCase();
  const gzip = COMPRESSIBLE.has(ext) && /\bgzip\b/.test(req.headers["accept-encoding"] || "");
  res.writeHead(status, {
    ...SECURITY_HEADERS,
    "Content-Type": TYPES[ext] || "application/octet-stream",
    "Cache-Control": cacheControl(req.url, path.extname(req.url.split("?")[0])),
    Vary: "Accept-Encoding",
    ...(gzip && { "Content-Encoding": "gzip" }),
    ...extraHeaders,
  });
  if (req.method === "HEAD") return res.end();
  const stream = fs.createReadStream(file);
  (gzip ? stream.pipe(zlib.createGzip()) : stream).pipe(res);
};

const redirect = (res, location) => {
  res.writeHead(301, { Location: location });
  res.end();
};

const server = http.createServer((req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { Allow: "GET, HEAD" });
    return res.end();
  }

  const [rawPath, query] = req.url.split(/\?(.*)/s);
  let urlPath;
  try {
    urlPath = decodeURIComponent(rawPath);
  } catch {
    urlPath = null;
  }
  const file = urlPath && resolve(urlPath);
  if (!file) {
    res.writeHead(400);
    return res.end();
  }
  const search = query ? `?${query}` : "";

  if (isFile(file)) return send(req, res, file);

  // "/about/" -> "/about"
  if (urlPath.length > 1 && urlPath.endsWith("/")) return redirect(res, rawPath.replace(/\/+$/, "") + search);

  // Prerendered pages: "/about" -> /about/index.html
  const page = path.join(file, "index.html");
  if (isFile(page)) return send(req, res, page);

  // Client-rendered app sections and shared CVs: SPA shell, kept out of the index
  if (APP_ROUTE.test(urlPath)) return send(req, res, path.join(dist, "spa.html"), 200, { "X-Robots-Tag": "noindex" });
  if (NEW_BLOG_POST.test(urlPath)) return send(req, res, path.join(dist, "spa.html"));

  const notFound = path.join(dist, "404.html");
  if (isFile(notFound)) return send(req, res, notFound, 404);
  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Not found");
});

if (!isFile(path.join(dist, "index.html"))) {
  console.warn("dist/index.html is missing; run `npm run build` before `npm start`");
}

server.listen(port, () => {
  console.log(`AI CV Builder BD site running on port ${port}`);
});
