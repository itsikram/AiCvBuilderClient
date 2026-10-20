# AI CV Builder BD — Frontend

React 19 + Vite + TypeScript frontend for [aicvbuilderbd.online](https://aicvbuilderbd.online).
The API is a separate repository (`ai-resume-builder`) hosted on Render.

## Development

```bash
npm install
cp .env.example .env
npm run dev
```

The app runs at http://localhost:5173. With `VITE_API_URL=/api/v1` the Vite dev server
proxies `/api` to the API on http://localhost:5000 (override with `API_PROXY_TARGET`),
so run the API repo's `npm run dev` alongside it.

## Environment

| Variable | Purpose |
|----------|---------|
| `VITE_API_URL` | API base URL. Absolute in production (`.env.production`), `/api/v1` in dev |
| `VITE_SITE_URL` | Canonical public origin for canonical, hreflang, Open Graph and sitemap URLs |
| `VITE_GOOGLE_CLIENT_ID` | Optional Google Sign-In web client ID |
| `VITE_GA_MEASUREMENT_ID` | Optional GA4 ID, loaded only after analytics consent |

## Build

```bash
npm run build
```

This type-checks, builds the SPA, then `scripts/prerender.mjs`:

- prerenders every public marketing page (English and Bangla) to static HTML
- fetches published blog posts from `VITE_API_URL` and writes their head tags
- writes `sitemap.xml`, `robots.txt`, `404.html`, `spa.html` and an Apache `.htaccess`

The API must be reachable during the build for blog posts to be included; if it is not,
the build still succeeds and logs a warning. Rebuild after publishing new posts so they
reach the sitemap (they still load before that via the SPA fallback).

## Deploy to cPanel

1. `npm run build`
2. Upload the **contents** of `dist/` to `public_html/` (include the hidden `.htaccess`;
   enable "Show Hidden Files" in File Manager)
3. Make sure the API's `SITE_URL` is this site's origin (CORS) and, since the API is on
   another site, `COOKIE_SAME_SITE=none`

The generated `.htaccess` needs `mod_rewrite` and `mod_headers` (enabled on standard cPanel
hosts). It redirects http/www to the canonical https origin, serves prerendered pages at
clean URLs, falls back to `spa.html` for the dashboard/auth/shared-CV routes, returns a
real 404 for unknown URLs, sets cache headers and the Content-Security-Policy (with the
API origin in `connect-src`).
