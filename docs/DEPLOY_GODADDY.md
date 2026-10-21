# Deploying AI CV Builder BD on GoDaddy Deluxe (cPanel)

A step-by-step guide for **https://aicvbuilderbd.online**. You don't need to be a server expert; follow the
steps in order. Commands in grey boxes are typed on your own computer unless the step says otherwise.

The project has two parts:

| Part | Repository | What it is | Where it runs |
|---|---|---|---|
| Website (frontend) | `aicvbuilderbd-client` | Static files (HTML, JS, CSS) | GoDaddy `public_html` |
| API (backend) | `AiCvBuilderServer` | Node.js + Express app | Render (recommended) **or** GoDaddy's "Setup Node.js App" |
| Database | — | MongoDB | MongoDB Atlas (free tier) |

## What shared hosting can and can't do

Be clear about these limits before you start:

- **GoDaddy Deluxe is shared cPanel hosting.** It serves static files very well, which is all the website
  needs. Running a Node.js app depends on whether your cPanel shows **Setup Node.js App** (under
  *Software*). Many GoDaddy shared plans don't include it. If you don't see it, use **Option A** (API on
  Render). If you do, you can use **Option B** (API on cPanel), but Option A is still simpler to update.
- **MongoDB can't run on shared hosting.** Use MongoDB Atlas (free M0 cluster).
- **Redis isn't available.** That's fine: the API uses an in-memory cache when `REDIS_URL` is empty.
- **Shared hosting has little memory.** Always build on your own computer and upload the result; don't run
  `npm run build` on the server.

Recommended setup (used in the rest of this guide):

```
https://aicvbuilderbd.online      -> GoDaddy public_html (static site)
https://api.aicvbuilderbd.online  -> the API (Render, or cPanel Node.js App)
MongoDB Atlas (Mumbai or Singapore)
```

Putting the API on a subdomain of your own domain keeps the login cookie "same-site", so it works in
Safari and in browsers that block third-party cookies.

---

## Step 0. Before you start: rotate every secret

An old commit in the public GitHub repository `itsikram/AiCvBuilderServer` contains a `.env` file. Treat
everything that was in it as public, and create **new** values before going live:

1. **Gemini keys**: in https://aistudio.google.com/apikey delete all old keys and create new ones.
2. **MongoDB**: in Atlas, *Database Access* → edit the database user → *Edit Password* (or create a new user
   and delete the old one).
3. **JWT secrets**: generate two new ones (see step 3). Everyone gets logged out once; that's expected.
4. **Cloudinary**: in the Cloudinary console, regenerate the API secret.
5. **pdftxt.dev**: regenerate the key if you use it.
6. Remove the old commit from GitHub: delete and re-create the repository (simplest), or ask GitHub Support
   to purge the cached commit. Deleting is permanent, so do it only after you've pushed the current code
   somewhere safe.

Never put these values in code, in `.env.production`, in commits or in chat. They go only into the host's
environment-variable screens (Render dashboard or cPanel).

---

## Step 1. Domain DNS (GoDaddy → My Products → DNS)

If the domain and the hosting are both at GoDaddy, the `@` record usually already points at your hosting.
Check these records:

| Type | Name | Value | Purpose |
|---|---|---|---|
| A | `@` | your hosting IP (cPanel → *Server Information* → *Shared IP Address*) | the website |
| CNAME | `www` | `@` | www redirects to the apex |
| CNAME | `api` | your Render host, e.g. `aicvbuilderbd-server.onrender.com` | **Option A** only |
| TXT | `@` | the `google-site-verification=...` value from Search Console | see SEO checklist |

For **Option B**, don't add the `api` CNAME; instead create the subdomain in cPanel (*Domains* → *Create
A New Domain* → `api.aicvbuilderbd.online`), which adds the DNS record for you.

DNS changes usually take 5–30 minutes, sometimes up to a few hours.

## Step 2. HTTPS certificates

- **Website**: cPanel → *Security* → *SSL/TLS Status* → tick `aicvbuilderbd.online` and
  `www.aicvbuilderbd.online` → *Run AutoSSL*. It's free and renews itself.
- Then cPanel → *Domains* → turn on **Force HTTPS Redirect** for the domain. (The site's `.htaccess` also
  redirects http → https and www → apex, so either is enough; both is fine.)
- **API on Render**: Render issues the certificate automatically once the `api` CNAME resolves.
- **API on cPanel**: include `api.aicvbuilderbd.online` when you run AutoSSL.

## Step 3. MongoDB Atlas (free)

1. Sign up at https://www.mongodb.com/cloud/atlas and create a **free M0** cluster in
   **Mumbai (ap-south-1)** or **Singapore (ap-southeast-1)**, the closest regions to Bangladesh.
2. *Database Access* → *Add New Database User* → password authentication → a long random password →
   role *Read and write to any database*.
3. *Network Access* → *Add IP Address*:
   - **Option B (cPanel)**: add your hosting's IP (cPanel → *Server Information* → *Shared IP Address*).
   - **Option A (Render free plan)**: Render doesn't give free services a fixed outgoing IP, so you have to
     allow `0.0.0.0/0` (anywhere). Your data is then protected only by the database password, so make it
     long and random. Render's paid plans list fixed outgoing IPs you can allow instead.
4. *Connect* → *Drivers* → copy the `mongodb+srv://...` connection string, put your password in it and add
   the database name: `.../aicvbuilderbd?retryWrites=true&w=majority`. This is `MONGODB_URI`.

Generate the JWT secrets on your computer (run it twice, one for each):

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## Step 4. API environment variables

You'll paste these into Render (Option A) or the cPanel Node.js App screen (Option B). The full list with
comments is in the API repository's `.env.example`.

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `SITE_URL` | `https://aicvbuilderbd.online` |
| `COOKIE_SAME_SITE` | leave empty while the API is on `*.onrender.com` (production defaults to `none`); `lax` once it's on `api.aicvbuilderbd.online` |
| `MONGODB_URI` | from step 3 |
| `JWT_SECRET`, `JWT_REFRESH_SECRET` | from step 3 (two different values) |
| `GEMINI_API_KEYS` | your new Gemini keys, comma-separated, no spaces |
| `GEMINI_MODEL` | `gemini-3.5-flash-lite` (or another current model; see Google's model list) |
| `DISABLE_REDIS` | `true` |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | your admin login (only needed when you run the seed) |
| `GOOGLE_CLIENT_ID` | optional, for "Sign in with Google" |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` | optional, for verification and password-reset emails |
| `CLOUDINARY_*` | optional |
| `SSL_STORE_ID`, `SSL_STORE_PASS`, `SSL_IS_LIVE`, `SSL_*_URL` | only when you enable SSLCommerz payments |

## Step 5a. Option A — API on Render (recommended)

1. Sign in at https://render.com with GitHub → *New* → *Blueprint* → pick the API repository. Render reads
   `render.yaml` (build `npm ci && npm run build`, start `npm start`, health check `/api/v1/health`).
2. In the service's *Environment* tab, add the variables from step 4.
3. *Settings* → *Custom Domains* → add `api.aicvbuilderbd.online`, and make sure the `api` CNAME from step 1
   points at the host Render shows.
4. Check it: open `https://api.aicvbuilderbd.online/api/v1/health`. You should see
   `{"success":true,...}`.
5. Seed templates, plans and the admin user **once**. Render's free plan has no shell, so run it from your
   computer against Atlas (the IP allowlist must allow your computer while you do this):

   ```bash
   cd AiCvBuilderServer
   npm ci
   MONGODB_URI="..." ADMIN_EMAIL="you@example.com" ADMIN_PASSWORD="a-long-password" npm run seed
   ```

   On Windows PowerShell, set the variables first with `$env:MONGODB_URI="..."` and so on. The seed is safe
   to run again: it only adds missing templates and plans. Never use `--reset` on the live database.

Render's free plan sleeps after 15 minutes without traffic; the next visitor waits about 30–60 seconds for
it to wake up. A paid instance (about US$7/month) stays awake.

## Step 5b. Option B — API on cPanel "Setup Node.js App"

Only if your cPanel has *Software* → **Setup Node.js App**.

1. On your computer, build the upload bundle:

   ```bash
   cd aicvbuilderbd-server
   npm ci
   npm run package:cpanel
   ```

   This writes `deploy/aicv-api-cpanel.zip` with `dist/`, the `app.cjs` startup file (Passenger loads
   startup files with `require()`, and the API is an ES module), `package*.json`, and an `.npmrc` that
   stops cPanel's NPM Install from installing dev dependencies.
2. If the app already exists in cPanel, skip to step 4: upload the zip into its root and extract it.
3. cPanel → *Setup Node.js App* → *Create Application*:
   - **Node.js version**: the newest 20.x or 22.x offered
   - **Application mode**: Production
   - **Application root**: `aicv-api` (a folder in your home directory, not inside `public_html`)
   - **Application URL**: `api.aicvbuilderbd.online`
   - **Application startup file**: `app.cjs`
   - *Environment variables*: add every variable from step 4 (*Add Variable* for each). Don't set `PORT`;
     Passenger sets it.
   - Click **Create**. cPanel puts its own placeholder `app.js` in the folder; you can delete it.
4. cPanel → *File Manager* → open `aicv-api` (turn on *Show Hidden Files* in *Settings*) → delete the old
   `dist/` → *Upload* the zip → *Extract*.
5. Back in *Setup Node.js App*, click **Run NPM Install**, wait for it to finish, then **Restart**.
6. Check `https://api.aicvbuilderbd.online/api/v1/health`. `database.state` should be `connected`; if it
   isn't, `database.lastError` says why (usually the Atlas IP allowlist). Startup errors are in
   `aicv-api/stderr.log`.
7. Seed once from your computer as in step 5a (allow your own IP in Atlas while you do it).

To update the API later: run `npm run package:cpanel` again, repeat steps 4–5 (*Run NPM Install* is only
needed when dependencies changed), and click **Restart**.

## Step 6. The website (frontend)

1. In the client repository, set `.env.production` (no secrets; this file is public):

   ```
   VITE_API_URL=https://api.aicvbuilderbd.online/api/v1
   VITE_SITE_URL=https://aicvbuilderbd.online
   ```

2. Build on your computer. The API must be live, because the build fetches plans, templates and blog
   posts to put them into the static pages:

   ```bash
   cd aicvbuilderbd-client
   npm ci
   npm run build
   ```

   Look for `Prerendered 26 routes + 404.` at the end. Warnings like `could not fetch API data` mean the
   API wasn't reachable; fix that and build again.

3. Upload the **contents** of `dist/` to `public_html/`:
   - **File Manager**: zip the contents of `dist/` (not the folder itself), upload to `public_html`, and
     *Extract*. Enable *Settings* → *Show Hidden Files* to see `.htaccess`.
   - **or FTP** (FileZilla): cPanel → *FTP Accounts* for the login; upload everything inside `dist/`,
     including `.htaccess`.
   - **or cPanel Git Version Control**: clone the repository and deploy a branch that contains the built
     files with a `.cpanel.yml`. Only worth it if you deploy often.
4. Delete any old `index.html` or default GoDaddy files left in `public_html`.

The generated `.htaccess` redirects http/www to `https://aicvbuilderbd.online`, serves each prerendered page
at its clean URL, sends dashboard/login/editor URLs to the app shell, returns a real 404 for unknown pages,
sets long cache headers for hashed assets and adds the security headers. If the site shows
**500 Internal Server Error** right after upload, your host doesn't allow the `Options` line: open
`.htaccess` and delete the line `Options -MultiViews -Indexes`.

Rebuild and re-upload whenever you change the frontend, or after publishing blog posts (so they appear in the
sitemap and get static HTML).

## Step 7. Smoke test after every deploy

Run these on your computer (Git Bash, macOS or Linux terminal):

```bash
curl -s https://api.aicvbuilderbd.online/api/v1/health
```

```bash
curl -sI http://www.aicvbuilderbd.online/ | head -3
```

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://aicvbuilderbd.online/this-page-does-not-exist
```

Expected: `"success":true`; a `301` to `https://aicvbuilderbd.online/`; `404`.

Then in a browser (try a phone too):

- [ ] Home page and `/bn` load with no errors in the browser console (F12).
- [ ] Register a new account, log out, log in again.
- [ ] Create a CV (English and Bangla), refresh the page: the edits are still there (autosave).
- [ ] "Write with AI" on the career objective returns three options (needs working Gemini keys).
- [ ] Import a PDF or Word CV; the fields fill in.
- [ ] "Download PDF" opens the print window; "Save as PDF" gives a PDF that matches the preview, Bangla
      included.
- [ ] `/robots.txt` and `/sitemap.xml` load; `/dashboard` is not in the sitemap.
- [ ] Admin: log in with the seeded admin, open `/admin`, and check Settings → User Limits.

## Step 8. Reading logs

- **Render**: the service → *Logs*. AI problems are logged as `[ai] ...` lines with the key's number (never the
  key itself). `Gemini key #2 disabled: ...` means that key is invalid or leaked; replace it.
- **cPanel Node.js App**: `stderr.log` in the application root (`~/aicv-api/stderr.log`); also cPanel →
  *Metrics* → *Errors*.
- **Website**: cPanel → *Metrics* → *Errors* shows Apache errors, e.g. `.htaccess` problems.

Common problems:

| Symptom | Likely cause | Fix |
|---|---|---|
| Browser console shows a CORS error | `SITE_URL` on the API doesn't match the site | Set `SITE_URL=https://aicvbuilderbd.online` and restart |
| Logged out on every refresh | Refresh cookie blocked | Use the `api.` subdomain with `COOKIE_SAME_SITE=lax`, or `none` on `*.onrender.com` |
| "AI features are not available right now" | No working Gemini key | Check the logs; add new keys to `GEMINI_API_KEYS` |
| API times out on start | Atlas IP allowlist | Add the host's IP (or `0.0.0.0/0` for Render free) |
| Every page 500 after upload | `Options` not allowed | Delete the `Options` line in `.htaccess` |
| Old version still showing | Browser cache | Hashed assets change on every build; hard-refresh, or clear the cache once |
| Console: `tccl.min.js` / inline script blocked by Content Security Policy | GoDaddy injects its own traffic-analytics script into every page | Harmless: the site's policy blocks it and nothing breaks. To remove the errors, turn off GoDaddy's website analytics / traffic tracking for the domain |
| New API code isn't live | Render didn't redeploy | Render → the service → *Events* should show the latest commit; otherwise *Manual Deploy* → *Deploy latest commit* |

### Current live setup (2026-10-21)

The site in `public_html` talks to the API at `https://aicvbuilderserver-4qfy.onrender.com` (set in
`.env.production`). Checked from the live origin: CORS allows `https://aicvbuilderbd.online` (and `www`),
`/api/v1/health`, page content and login respond, http/www redirect to https apex, unknown pages return 404.
Moving the API to `api.aicvbuilderbd.online` later only needs the CNAME (step 1), the custom domain on Render,
`VITE_API_URL` updated, a rebuild and re-upload.
