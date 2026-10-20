# SEO launch checklist: aicvbuilderbd.online

Work through this after the site is live on `https://aicvbuilderbd.online` (see `DEPLOY_GODADDY.md`).
Items marked **(you)** need your Google/Microsoft account; nothing here can be automated from the repo.

## 0. Pre-flight (5 minutes)

- [ ] `https://aicvbuilderbd.online/` loads, and `http://`, `http://www.` and `https://www.` each 301 to it.
      Test with `curl -I http://www.aicvbuilderbd.online/`; the response must be `301` with a `Location:` header pointing at the https apex.
- [ ] `https://aicvbuilderbd.online/robots.txt` lists the sitemap and blocks `/api/`, `/dashboard`, `/admin` and `/r/`.
- [ ] `https://aicvbuilderbd.online/sitemap.xml` lists 26 page URLs (13 English + 13 Bangla) plus published blog posts.
- [ ] A random URL such as `/this-does-not-exist` returns **HTTP 404**, not 200.
- [ ] View the source of `/bn/cv-format-bangladesh`: it should have Bangla text inside `<div id="root">`, `<html lang="bn-BD">`,
      a canonical link, and three `hreflang` links (en-BD, bn-BD, x-default).
- [ ] Validate structured data: run the home page and one guide through https://validator.schema.org/ and
      https://search.google.com/test/rich-results. Expect Organization, WebSite, WebApplication, FAQPage,
      BreadcrumbList, Article and HowTo with no errors. Google currently shows FAQ and HowTo rich results only for
      a few site types, so the markup is still valid even if no rich result appears.

## 1. Google Search Console: domain property via DNS TXT (you)

1. Open https://search.google.com/search-console and choose **Add property → Domain**, then enter `aicvbuilderbd.online`.
2. Google shows a TXT record like `google-site-verification=abc123…`. Copy it.
3. In GoDaddy, go to **My Products → Domains → aicvbuilderbd.online → DNS → Add New Record**, then set:
   - Type `TXT`, Name `@`, Value the string you copied, TTL `1 hour`.
4. Wait 5–60 minutes, then click **Verify**. A domain property covers http/https and www/apex together.
5. **Sitemaps → Add a new sitemap**: enter `sitemap.xml` and submit. Within a few days the status should read "Success" with 26+ URLs discovered.
6. **URL Inspection**: inspect `https://aicvbuilderbd.online/` and `https://aicvbuilderbd.online/bn`, then click **Request indexing** for each.
   Repeat for the 3–4 most important guides (cv-format-bangladesh, fresher-cv-format and their `/bn` twins).
7. **Settings → International targeting** is retired. Language targeting comes from the hreflang tags, which are already in place.
8. After 2–4 weeks, check **Pages** (indexing errors), **Core Web Vitals** and **Performance → Queries**, filtered to country = Bangladesh.

## 2. Bing Webmaster Tools (you)

1. Go to https://www.bing.com/webmasters and choose **Import from Google Search Console**. This copies the
   verification and sitemap in one step.
2. Bing also feeds DuckDuckGo and several Android assistants, so it is worth the two minutes.

## 3. Google Business Profile (you, optional)

Only create one if you have a real business address or service area in Bangladesh you're willing to show.
1. Go to https://business.google.com and add the business **AI CV Builder BD**.
2. Choose the category **Software company** or **Career guidance service**, and set the service area to **Bangladesh**
   (you can hide the street address).
3. Add the website, the support email, the logo (`public/icon-512.png`) and the cover image (`public/og-image.jpg`).
4. Verify (by postcard, phone or video, depending on what Google offers).

## 4. Google Analytics 4 (consent-friendly)

1. **(you)** At https://analytics.google.com, go to **Admin → Create property → Web stream** for `https://aicvbuilderbd.online`.
   Copy the measurement ID (`G-XXXXXXXXXX`).
2. Put it in `.env.production` as `VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX`, then rebuild (`npm run build`).
   A measurement ID is public by design; it is not a secret.
3. Behaviour: GA4 does **not** load until the visitor clicks **Accept** in the cookie banner (`ConsentBanner.tsx`). The choice is saved
   in `localStorage`. Page views are sent on every client-side route change, and IP anonymisation is on.
4. In GA4, mark `sign_up` and `file_download` as key events once you add them. Link GA4 to Search Console
   (**Admin → Product links**).

## 5. Content and internal links (ongoing)

- [ ] Every new blog post: one primary keyword from `SEO_KEYWORDS.md`, a title of 60 characters or fewer, a meta description of 155 or fewer,
      and links to the builder and to 2–3 guides. Write Bangla posts with the language set to `bn`, so they're served at `/bn/blog/…`.
- [ ] Update the guide dates (`src/content/guides/meta.ts → updated`) when you make meaningful edits.
- [ ] Watch Search Console for queries with many impressions but low CTR, and rewrite those titles and descriptions.

## 6. Backlink ideas for the Bangladesh market

Earn links by being useful; don't buy them.

- **University career offices** (DU, BUET, NSU, BRAC, AIUB, DIU, SUST, CU, RU, JU, KU and more) maintain "career resources" pages,
  and several already link to CV guides. Email them the Bangla and English CV-format guides as a free resource for students.
- **Student clubs and career fairs**: offer a free "CV clinic" session at a university career club and ask to be listed as a resource.
- **Bangla career journalism**: Jago News (jago-jobs), Jugantor (job-seek), Daily Star Bangla (youth/career) and Prothom Alo
  run CV-advice articles. Pitch an original data piece, for example "What 500 anonymised fresher CVs got wrong", built from
  aggregated, consented, anonymised data only.
- **Facebook groups** (job circular, BCS prep and fresher groups): share specific guides when they answer a question in the thread. No spam.
- **YouTube and TikTok career creators in Bangladesh**: give them the builder to demo; creators usually link in descriptions.
- **Bangladesh startup and tool directories**: Future Startup, BASIS member listings, Product Hunt (with a Bangla-first angle),
  AlternativeTo (as an alternative to Canva, Zety and Kickresume for BD users).
- **Q&A**: answer CV questions on Quora (English and Bangla spaces) and Reddit r/bangladesh, linking only where it helps.
- **Free tools**: a printable "CV checklist" PDF and a GPA-to-CGPA explainer page attract natural links from teachers and coaching centres.

## 7. Lighthouse scores (mobile, landing page)

Recorded during Phase 7 verification; see the table below.

| Page | Performance | Accessibility | Best Practices | SEO | Notes |
|---|---|---|---|---|---|
| `/` (mobile) | _pending_ | _pending_ | _pending_ | _pending_ | |
