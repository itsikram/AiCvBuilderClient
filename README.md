# AI CV Builder BD — Frontend

React 19 + Vite + TypeScript frontend for [aicvbuilderbd.online](https://aicvbuilderbd.online), a free
Bangla/English CV builder for Bangladeshi job seekers. The API is a separate repository
([itsikram/AiCvBuilderServer](https://github.com/itsikram/AiCvBuilderServer)).

## What's in it

- **Public site** (prerendered to static HTML in English and Bangla, `/` and `/bn/...`): landing page,
  CV guides (CV format, fresher CV, government job CV, bdjobs format, biodata, cover letter, CV tips),
  templates, pricing, blog, about and contact. Per-page titles, descriptions, canonical, hreflang,
  Open Graph and JSON-LD.
- **CV editor** (`/dashboard/resumes/:id`): three steps (Basics, Education & work, Finish), autosave,
  a CV strength score, live A4 preview beside the form (or an Edit/Preview toggle on phones),
  Bangladeshi sections (career objective, SSC/HSC/Honours/Masters with GPA/CGPA, training,
  personal details, references, declaration), drag-to-reorder sections and 30+ templates.
- **AI tools** (Gemini, via the API): write or improve the objective and summary, polish job duties,
  suggest skills, tailor a CV to a job post (match score, missing keywords, edits you accept one by one),
  grammar check, translate a CV between English and Bangla, cover letters, ATS check, and import an old
  CV from PDF, Word or pasted text (including LinkedIn).
- **PDF export**: "Download PDF" prints the same markup as the preview ("Save as PDF"), so the PDF matches
  the preview and Bangla text is shaped correctly. A server-made PDF is offered as a quick download for
  English CVs.

## Development

```bash
npm install
cp .env.example .env
npm run dev
```

The app runs at http://localhost:5173. With `VITE_API_URL=/api/v1` the Vite dev server proxies `/api`
to the API on http://localhost:5000 (override with `API_PROXY_TARGET`), so run the API repo's
`npm run dev` alongside it.

| Script | What it does |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | i18n key check, type-check, SPA build, SSR build, prerender (see below) |
| `npm run lint` | ESLint (no warnings or errors expected) |
| `npm run check:i18n` | Fails if `en.json` and `bn.json` don't have the same keys |
| `npm run preview` | Serve `dist/` locally |

## Environment

| Variable | Purpose |
|----------|---------|
| `VITE_API_URL` | API base URL. Absolute in production (`.env.production`), `/api/v1` in dev |
| `VITE_SITE_URL` | Canonical public origin for canonical, hreflang, Open Graph and sitemap URLs |
| `VITE_GOOGLE_CLIENT_ID` | Optional Google Sign-In web client ID |
| `VITE_GA_MEASUREMENT_ID` | Optional GA4 ID, loaded only after analytics consent |

No secrets belong in these files: everything prefixed `VITE_` ends up in the public JavaScript.

## Translations

UI strings live in `src/i18n/locales/{en,bn}.json`. Each language is loaded as its own chunk on first use,
and there is no fallback language, so every key must exist in both files; `npm run build` checks this.
CV headings (`cv.*`) follow the CV's own language, not the UI language.

## Build

```bash
npm run build
```

This type-checks, builds the SPA, then `scripts/prerender.mjs`:

- prerenders every public marketing page (English and Bangla) to static HTML, with the API data
  (plans, templates, blog list) the page shows, embedded for hydration
- prerenders published blog posts fetched from `VITE_API_URL`
- writes `sitemap.xml`, `robots.txt`, `404.html`, `spa.html` and an Apache `.htaccess`
- adds a font preload for each page's language

The API must be reachable during the build for API-backed pages and blog posts to be complete; if it is
not, the build still succeeds and logs warnings. Rebuild after publishing new posts.

Note: `vite preview` serves `/some-page` (no trailing slash) from the root `index.html`, which causes a
harmless hydration warning locally. Apache serves `/some-page/index.html` via the generated `.htaccess`.

## Deploy

See [docs/DEPLOY_GODADDY.md](docs/DEPLOY_GODADDY.md) for the full GoDaddy (cPanel) guide and
[docs/SEO_LAUNCH_CHECKLIST.md](docs/SEO_LAUNCH_CHECKLIST.md) for Search Console, sitemap and
Lighthouse. In short:

1. `npm run build`
2. Upload the **contents** of `dist/` to `public_html/` (include the hidden `.htaccess`;
   enable "Show Hidden Files" in File Manager)
3. Make sure the API's `SITE_URL` is this site's origin (CORS) and, since the API is on
   another site, `COOKIE_SAME_SITE=none`

The generated `.htaccess` needs `mod_rewrite` and `mod_headers` (enabled on standard cPanel hosts).
It redirects http/www to the canonical https origin, serves prerendered pages at clean URLs, falls back
to `spa.html` for the dashboard/auth/shared-CV routes, returns a real 404 for unknown URLs, sets cache
headers and the Content-Security-Policy (with the API origin in `connect-src`).
