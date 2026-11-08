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
  personal details, references, declaration), drag-to-reorder sections and 40+ templates.
- **AI tools** (Gemini, via the API): write or improve the objective and summary, polish job duties,
  suggest skills, tailor a CV to a job post (match score, missing keywords, edits you accept one by one),
  grammar check, translate a CV between English and Bangla, cover letters, ATS check, and import an old
  CV from PDF, Word or pasted text (including LinkedIn).
- **AI career coach** (`/dashboard/coach`): a chat that knows the chosen CV and target job, answers
  career questions (CV, LinkedIn, salary, interviews, jobs abroad) and proposes CV changes the user
  applies with one click. The chat stays in the browser tab only (sessionStorage, cleared on logout).
- **AI interview coach** (`/dashboard/interview`): likely interview questions (mixed, behavioural,
  technical, HR or a Bangladeshi viva board) with model answers from the CV, scored feedback on the
  user's practice answers, and follow-up questions to practise next.
- **PDF export**: "Download PDF" builds an A4 PDF file in the browser from the same rendering as the
  preview (`src/lib/resume/pdf.ts`), so it looks exactly like the preview, Bangla included, and its pages
  break where the preview's "Page N ends here" lines show (`src/lib/resume/pages.ts`). The pages carry an
  invisible text layer for English text, so it can be selected and read by ATS. Printing is still offered.
- **Free tools and pages** (prerendered, English and Bangla): photo & signature resizer for Teletalk-style forms
  (`/photo-signature-resizer`, in the browser, nothing uploaded), marriage biodata maker (`/marriage-biodata-maker`,
  PDF made in the browser), job circulars (`/jobs`, written in Admin → Job circulars, with JobPosting data), and
  privacy, terms and refund pages.
- **Earning** (`/dashboard/billing`, `/dashboard/shop`): 7-day, 30-day and 1-year Premium passes that stack and don't
  auto-renew, a free trial, access codes for organisations, invite rewards, and one-time extras (watermark-free PDF
  credit, AI pack, employer CV screening at `/dashboard/screening`, and services an admin delivers).
- **Admin panel** (`/admin`): **analytics** (`/admin/analytics`: revenue, sign-ups, active users, CVs, AI use
  and trials against the previous period, trend charts, the sign-up-to-paid funnel, what sells, CSV export),
  **SEO & keywords** (`/admin/seo`: Google Search Console searches and pages, quick wins, a keyword tracker and
  keyword ideas from users' CVs), users and plans, bKash payment review, **user activity**
  (`/admin/activity`: sign-ups, logins, CVs, AI use, purchase requests and payments, filterable by user
  and type), page content, menus, templates, blog, and settings, where admins pick who gets email
  notifications (new user, purchase request, new CV) and can **send a test email**.

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
| `VITE_GOOGLE_CLIENT_ID` | Optional Google Sign-In web client ID. Admin → Settings → Google Sign-In overrides it; with neither, the "Sign in/up with Google" buttons are hidden |
| `VITE_GA_MEASUREMENT_ID` | Optional GA4 ID, loaded only after analytics consent |
| `VITE_ADSENSE_CLIENT`, `VITE_ADSENSE_SLOT` | Optional AdSense publisher ID (`ca-pub-…`) and ad slot: ads on guides and job pages after consent; the build adds `ads.txt` and the CSP hosts |

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
  the page shows embedded for hydration: the Admin → Page Content text (hero, menu, footer, about,
  contact and pricing copy) on every page, plus plans, templates or the blog list where shown
- prerenders published blog posts and job circulars fetched from the API
- writes `sitemap.xml`, `robots.txt`, `404.html`, `spa.html` and an Apache `.htaccess` (its
  Content-Security-Policy allows the inline theme script in `index.html` by hash)
- adds a font preload for each page's language

The API must be reachable during the build for API-backed pages and blog posts to be complete; if it is
not, the build still succeeds and logs warnings. **Rebuild after publishing new posts or editing Page
Content.** Visitors see page-content edits straight away (the page re-checks it in the background), but
the static HTML that Google indexes keeps the old text until the next build, and the page visibly
switches from the old text to the new one when it loads.

Nothing on a public page should change after it loads, or visitors see content jump and crawlers index
text that differs from what people read. So: put any API data a public page renders into the prerender
(`PAGE_DATA` in `scripts/prerender.mjs`), keep the provider tree in `src/App.tsx` fixed, and show
visitor-specific UI (sign-in state, theme) only after hydration with `useHydrated`.

Note: `vite preview` serves `/some-page` (no trailing slash) from the root `index.html`, which causes a
harmless hydration warning locally. Apache serves `/some-page/index.html` via the generated `.htaccess`.

## Deploy

See [docs/GROWTH_PLAYBOOK.md](docs/GROWTH_PLAYBOOK.md) for what to switch on to start earning, and
[docs/DEPLOY_GODADDY.md](docs/DEPLOY_GODADDY.md) for the full GoDaddy (cPanel) guide and
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
