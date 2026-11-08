# Growth playbook: AI CV Builder BD

What's built for earning and growth, what to switch on, and ready-to-use messages for the work that
isn't code. Prices below are the seeded defaults; they are starting points to test, not research.

## 1. Switch these on (one-time setup)

| What | Where | Why |
|---|---|---|
| SMTP email | Admin → Settings → Email (SMTP), then **Send test email** | Reminders, receipts, order deliveries and admin alerts are silent without it |
| Google sign-in | Google Cloud Console → Credentials → OAuth client ID (Web), with `https://aicvbuilderbd.online` and `https://www.aicvbuilderbd.online` as authorised JavaScript origins; paste the client ID in Admin → Settings → Google Sign-In | "Sign up with Google" on the sign-up and login pages: one tap, no password, email already verified |
| Search Console in the admin | Service account JSON key in Admin → Settings → Google Search Console (steps on Admin → SEO & keywords) | Searches, positions, quick wins and keyword tracking without leaving the admin panel |
| bKash number | Admin → bKash payments | Manual bKash checkout for passes and extras |
| SSLCommerz | Admin → Settings → SSLCommerz (after approval, see §3) | Card and mobile banking without manual review |
| Google Analytics | `VITE_GA_MEASUREMENT_ID` in `.env.production`, rebuild | Mark `sign_up`, `trial_start`, `purchase_request` as key events in GA4 |
| AdSense (optional) | `VITE_ADSENSE_CLIENT` and `VITE_ADSENSE_SLOT`, rebuild | Ads on guides and job pages only; the build writes `ads.txt` and the CSP |
| Services | Admin → Products: switch a service on only when someone can deliver it | Orders then appear in Admin → Orders |
| Referral rule | Admin → Settings → User limits (default: 3 friends who make a CV = 7 days) | |
| Trial length | Admin → Plans → Premium → Free trial (days), default 7 | |
| Paid Premium end dates | Automatic | Passes now end on their date; reminder email 3 days before |

Keep the site rebuilding after content changes (GitHub → Actions → *Deploy to GoDaddy* → Run workflow) so new
job circulars and blog posts reach the sitemap.

## 2. What you sell

| Product | Default price | Delivered |
|---|---|---|
| Premium 7-day pass | ৳99 | Automatically after payment |
| Premium 30-day pass | ৳499 (consider ৳199–299) | Automatically |
| Premium 1-year pass | ৳4,990 | Automatically |
| 1 watermark-free PDF | ৳39 | Automatically (credit used at download) |
| Viva & interview AI pack (50 requests, 30 days) | ৳149 | Automatically |
| CV screening, 25 / 100 CVs (employers) | ৳499 / ৳1,499 | Automatically |
| Expert CV review | ৳500, 2 days | By you or a freelancer, in Admin → Orders |
| Professional CV rewrite | ৳1,500, 3 days | Same |
| LinkedIn makeover | ৳800, 3 days | Same |
| Abroad job CV pack | ৳700, 3 days | Same |
| Live mock viva (30 min) | ৳300, 3 days | Same |
| Access codes for organisations | Your price per student | Admin → Access codes |

Change any price in Admin → Plans or Admin → Products. Watch Admin → User activity for which products sell.

## 3. Paperwork (needed for automatic payments)

SSLCommerz's onboarding page lists: an updated **trade license**, a **company bank account** and cheque leaf, the
signatory's **NID** and photo, a **TIN** certificate, the Merchant Enrollment Form, and a **DBID** (Digital
Business Identification Number). Partnerships and companies need their deeds or incorporation papers too.
The site already has privacy, terms and refund pages at /privacy, /terms and /refund-policy; have a lawyer
review them before you rely on them.

For bKash's automatic checkout (Payment Gateway), apply for a bKash merchant account with the same trade
license and bank details; until then the manual bKash review works.

## 4. Delivering services (before you switch one on)

1. Find 2–3 HR professionals or senior recruiters (LinkedIn, university alumni groups) and agree a per-order fee,
   e.g. 50–60% of the price.
2. Write a short checklist per service (CV review: objective, achievements with numbers, ATS layout, BD format,
   spelling) so quality is consistent.
3. In Admin → Orders, open the customer's CV ("View their CV"), paste the feedback or a Google Drive link, and press
   **Deliver and email customer**. Keep within the promised days.

## 5. Ready-to-use messages

### University career club / office (email)

> **Subject:** Free CV workshop and Premium CV builder for your students
>
> Dear [Name],
>
> I run AI CV Builder BD (aicvbuilderbd.online), a CV maker built for Bangladeshi job seekers: Bangla and
> English, BD format with SSC/HSC and GPA, ATS templates, and AI help that never invents experience.
>
> We'd like to offer [University]'s students a free 45-minute online CV workshop, and a group code that gives
> every student [30] days of Premium. We can also prepare a code for your whole graduating batch at
> ৳[50] per student.
>
> Could we have 15 minutes next week to plan a date?
>
> Regards, [Your name], [Phone]

### বিশ্ববিদ্যালয় ক্যারিয়ার ক্লাব (বাংলা)

> আসসালামু আলাইকুম,
>
> আমি এআই সিভি বিল্ডার বিডি (aicvbuilderbd.online) পরিচালনা করি। এটি বাংলাদেশি চাকরিপ্রার্থীদের জন্য তৈরি একটি সিভি মেকার:
> বাংলা ও ইংরেজি, এসএসসি/এইচএসসি ও GPA সহ বাংলাদেশি ফরমেট, ATS টেমপ্লেট এবং এআই সাহায্য।
>
> আপনাদের শিক্ষার্থীদের জন্য আমরা ৪৫ মিনিটের একটি ফ্রি অনলাইন সিভি ওয়ার্কশপ এবং একটি কোড দিতে চাই, যা দিয়ে প্রত্যেকে
> [৩০] দিনের প্রিমিয়াম পাবে। পুরো ব্যাচের জন্য প্রতি শিক্ষার্থী ৳[৫০] হারে কোডও দিতে পারি।
>
> আগামী সপ্তাহে ১৫ মিনিট কথা বলা যাবে?
>
> ধন্যবাদ, [নাম], [মোবাইল]

### Coaching centre (BCS, bank, IELTS)

> Your students apply for jobs right after your course. Give them AI CV Builder BD Premium as part of your fee: a
> code worth [60] days per student at ৳[40] each, plus our viva practice AI. We'll put your centre's name on the
> code. Interested in a free demo for your batch?

### Facebook job group post (বাংলা)

> সরকারি চাকরির আবেদনে ছবি ৩০০×৩০০ আর স্বাক্ষর ৩০০×৮০ পিক্সেল লাগে, ১০০ KB আর ৬০ KB-র মধ্যে।
> ফ্রিতে, কিছু আপলোড না করেই মোবাইলে রিসাইজ করুন: aicvbuilderbd.online/bn/photo-signature-resizer
> সাথে ফ্রি বাংলাদেশি ফরমেটে সিভিও বানাতে পারবেন। কাজে লাগলে শেয়ার করুন।

Post only where the group allows tools and links; answer questions, don't spam.

### WhatsApp (friends and family)

> বিয়ের বায়োডাটা বা চাকরির সিভি লাগলে এখানে ফ্রিতে বানাও, বাংলায়ও হয়: aicvbuilderbd.online
> আমার লিংক দিয়ে সাইন আপ করলে আমিও প্রিমিয়াম পাব 🙂 [your invite link from the dashboard]

### YouTube Shorts / Reels scripts (30–45 seconds each)

1. **"টেলিটকের ছবি-স্বাক্ষর ১ মিনিটে"**: show the rejected-upload error → open the resizer on a phone → pick photo →
   tick appears → download → upload succeeds. End: "লিংক কমেন্টে।"
2. **"মোবাইল দিয়ে সিভি বানানোর নিয়ম"**: blank phone → template → fill SSC/HSC → AI objective → PDF download in under
   a minute (speed up the recording).
3. **"ব্যাংক জবের সিভিতে ৩টি ভুল"**: generic objective, no numbers, wrong format → fix each in the builder.

Post 3 a week. Put the link in the bio and the first comment.

## 6. Weekly routine

- **Daily:** publish 2–3 job circulars (Admin → Job circulars) with the official link and photo rules, and share the
  best one in Facebook groups.
- **Weekly:** check Admin → Analytics (sign-ups, the sign-up-to-paid funnel, what sells) and Admin → SEO & keywords
  (work through "Quick wins": rewrite titles for low click rate, improve pages almost on page 1, and write guides for
  the job titles in "Keyword ideas"); rebuild the site so new circulars reach the sitemap.
- **Monthly:** contact 10 university clubs and 5 coaching centres; review prices of the 30-day pass and the extras.
