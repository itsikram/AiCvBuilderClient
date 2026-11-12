# Google Ads campaign: AI CV Builder BD

Drafted 2026-11-12 for https://aicvbuilderbd.online. Budget: **US$30/day** (about ৳3,600/day, ~US$912/month at
Google's 30.4-day average). CPC estimates below are typical ranges for Bangladesh, not Keyword Planner data; check them in
Keyword Planner before launch and after the first week.

## 1. Strategy in one paragraph

Spend the whole budget on **one Search campaign** aimed at people who are typing "make a CV" right now, in English,
Bangla and Banglish. Search is the only network with that intent, Bangladeshi CPCs are low (often US$0.03–0.20), so
US$30/day buys a few hundred clicks a day. Display, Search Partners, Performance Max and Demand Gen stay **off** until
conversion tracking works: without it, Google's automated campaigns have nothing to optimise for and drift into cheap,
low-intent placements. Start on **Maximize clicks with a CPC cap**, switch to **Maximize conversions** once ~30 sign-ups
a month are being recorded.

## 2. Before you launch: conversion tracking (do this first)

`.env.production` has no `VITE_GA_MEASUREMENT_ID`, so today nothing records a sign-up. The app already sends GA4 events
(`sign_up`, `trial_start`, `begin_checkout`, `purchase_request`, see `src/lib/analytics.ts`).

1. Create a GA4 property, put its ID in `VITE_GA_MEASUREMENT_ID` in `.env.production`, rebuild and deploy.
2. GA4 → Admin → Events: mark `sign_up` (primary), `trial_start` and `purchase_request` as key events.
3. Google Ads → Tools → Data manager → link GA4, then Goals → Conversions → Import from GA4: `sign_up` as **Primary**,
   `trial_start` and `purchase_request` as **Secondary** (observe only) until volume is high enough.
4. Analytics loads only after the cookie banner is accepted, so Ads will undercount conversions. Expect that; compare
   with Admin → Analytics sign-ups.

## 3. Campaign settings

| Setting | Value | Why |
|---|---|---|
| Campaign name | `AICVBD | Search | BD | EN+BN` | |
| Objective | Website traffic (switch the goal to Leads/sign-up once tracking exists) | No conversion data yet |
| Type | Search | Highest intent |
| Networks | **Untick** Google Search Partners and Google Display Network | Partner/display clicks are low quality at this budget |
| Locations | Bangladesh | |
| Location option | **Presence**: people in or regularly in Bangladesh | Avoids paying for interest-only clicks from abroad |
| Languages | Bengali, English | Most BD users have English Google UI but search in both |
| Budget | US$30.00/day | |
| Bidding | Maximize clicks, **max CPC bid limit US$0.20** | Stops a few expensive terms eating the budget |
| Ad schedule | All day to start; after 2 weeks lower bids 01:00–07:00 if CTR/sign-ups are weak there | BD searches peak evenings |
| Devices | All (no adjustments yet; most traffic is Android) | |
| Ad rotation | Optimize | |
| AI Max / broad match | Off for now | Keep control while the budget is small |
| Final URL expansion | Off | Guides have different intent from the home page |

## 4. Ad groups and keywords

Phrase match (`"..."`) and exact match (`[...]`) only. Each ad group sends people to the page that matches the query.

### AG1 AI CV Builder (EN) → `https://aicvbuilderbd.online/`

```
[ai cv builder]
[ai cv maker]
[ai resume builder]
[ai cv builder bd]
"ai cv builder"
"ai cv maker"
"ai resume builder"
"ai resume maker"
"cv builder bd"
"cv maker bd"
"resume builder bangladesh"
"cv maker bangladesh"
```

### AG2 Free CV Maker (EN) → `https://aicvbuilderbd.online/`

```
[free cv maker]
[online cv maker]
[cv maker online]
"free cv maker"
"online cv maker"
"cv maker online free"
"free resume builder"
"make cv online"
"create cv online"
"cv making"
"cv maker"
"cv banano"
"cv toiri"
"mobile diye cv"
```

### AG3 CV Format BD (EN) → `https://aicvbuilderbd.online/cv-format-bangladesh`

```
[cv format bd]
[cv format for job]
"cv format for job in bangladesh"
"bangladeshi cv format"
"cv format bd"
"job cv format"
"fresher cv format"
"cv format for fresher"
"bank job cv format"
"govt job cv format"
"cv format pdf"
"resume format bd"
```

### AG4 Bangla CV (BN) → `https://aicvbuilderbd.online/bn`

```
"সিভি তৈরি"
"সিভি বানানো"
"সিভি বানানোর নিয়ম"
"সিভি মেকার"
"অনলাইনে সিভি তৈরি"
"সিভি ফরমেট"
"সিভি ফরম্যাট"
"চাকরির সিভি"
"বায়োডাটা ফরমেট"
"বায়োডাটা তৈরি"
"জীবন বৃত্তান্ত"
"জীবন বৃত্তান্ত লেখার নিয়ম"
```

### AG5 ATS Checker (EN) → `https://aicvbuilderbd.online/ai-ats-checker`

```
[ats checker]
[ats resume checker]
"ats checker"
"ats cv checker"
"ats score"
"ats friendly cv"
"ats resume"
"cv checker"
"resume checker"
```

## 5. Negative keywords (campaign level, phrase match)

The site exports PDF only and is not a job board, so these searches won't convert:

```
word
docx
doc file
ms word
job circular
vacancy
apply online
admit card
result
salary
bdjobs login
bdjobs.com
full form
meaning
wikipedia
cv joint
cv axle
honda
yamaha
bike
carburetor
course
coaching
tutorial pdf
teletalk
nid
passport
visa
```

Review **Insights → Search terms** every 2–3 days for the first two weeks and add anything irrelevant.

## 6. Responsive search ads (one per ad group, 15 headlines ≤30 chars, 4 descriptions ≤90 chars)

Claims stay honest: the Free plan's PDF carries a small footer line, so copy says "Free PDF download", **never "no
watermark"**. The trial length is the Admin → Plans value (default 7 days); change "7-day" if you change that.

### English ad (AG1, AG2; reuse for AG3/AG5 with the first two headlines swapped)

Headlines:

1. AI CV Builder BD
2. Free AI CV Maker Bangladesh
3. Make Your CV in Minutes
4. Bangla & English CV Builder
5. BD Format: SSC, HSC & CGPA
6. 40+ ATS-Friendly Templates
7. Free PDF Download
8. AI Writes Your Objective
9. Free Premium Trial, No Card
10. Make Your CV on Your Phone
11. AI ATS Checker Included
12. Start Your CV Free Today
13. Tailor Your CV to Any Job
14. AI Cover Letter Writer
15. No App Install Needed

Pin headline 1 to position 1 (brand); leave the rest unpinned.

Descriptions:

1. Make an ATS-friendly CV in Bangla or English with AI help. Free PDF download.
2. Bangladeshi CV format with SSC/HSC, GPA/CGPA, photo & references. Start free now.
3. AI writes your objective, polishes job duties and tailors your CV to a job post.
4. Try Premium free for 7 days, no card needed. Works on any phone, no app install.

AG3 swap headlines 1–2 for: `CV Format for Job in BD 2026` / `Bangladeshi CV Format + Builder`.
AG5 swap headlines 1–2 for: `Free AI ATS Checker` / `Check Your CV's ATS Score`.

### Bangla ad (AG4)

Headlines:

1. ফ্রি সিভি মেকার বিডি
2. এআই সিভি বিল্ডার
3. মিনিটেই সিভি তৈরি করুন
4. বাংলা ও ইংরেজিতে সিভি
5. মোবাইলেই সিভি বানান
6. চাকরির সিভি ফরমেট ২০২৬
7. ফ্রি পিডিএফ ডাউনলোড
8. এসএসসি, এইচএসসি, CGPA সহ
9. ৪০+ প্রফেশনাল টেমপ্লেট
10. এআই লিখে দেবে অবজেক্টিভ
11. ৭ দিনের ফ্রি প্রিমিয়াম
12. কোনো কার্ড লাগবে না
13. ATS ফ্রেন্ডলি সিভি
14. আজই ফ্রিতে শুরু করুন
15. সরকারি ও ব্যাংক জবের সিভি

Descriptions:

1. বাংলা বা ইংরেজিতে এআই দিয়ে প্রফেশনাল সিভি তৈরি করুন। ফ্রি পিডিএফ ডাউনলোড।
2. বাংলাদেশি ফরমেট: এসএসসি/এইচএসসি, GPA/CGPA, ছবি ও রেফারেন্সসহ। অ্যাপ লাগবে না।
3. এআই লিখে দেবে ক্যারিয়ার অবজেক্টিভ। চাকরির পোস্ট অনুযায়ী সিভি সাজান।
4. ৭ দিনের ফ্রি প্রিমিয়াম ট্রায়াল, কোনো কার্ড লাগবে না। আজই সিভি বানান।

Display path: `aicvbuilderbd.online/cv/maker` (EN), `aicvbuilderbd.online/bangla/cv` (BN).

## 7. Assets (campaign level)

- **Business name** AI CV Builder BD, **logo** `public/apple-touch-icon.png` (or a 1200×1200 square export).
- **Sitelinks** (text ≤25 chars, two description lines ≤35 chars each):
  - CV Templates → `/templates` — "40+ BD and ATS templates" / "With or without photo"
  - AI ATS Checker → `/ai-ats-checker` — "See your CV's ATS score" / "Fix missing keywords"
  - CV Format Guide → `/cv-format-bangladesh` — "What BD employers expect" / "Sections, photo, length"
  - বাংলায় সিভি → `/bn` — "বাংলায় সিভি তৈরি করুন" / "ফ্রি পিডিএফ ডাউনলোড"
  - Pricing & Free Trial → `/pricing` — "Free plan and 7-day trial" / "Pay with bKash"
  - Photo & Sign Resizer → `/photo-signature-resizer` — "300×300 photo, 300×80 sign" / "For govt job forms"
- **Callouts**: Free PDF Download · Bangla & English · BD CV Format · 40+ Templates · No Card Needed · No App Install
- **Structured snippet** (Types): Fresher CV, Bank Job CV, Govt Job CV, Abroad Job CV, ATS CV, Biodata

## 8. Budget split and expected numbers (estimates)

The campaign shares one budget; Google spends where clicks are available. Expected share: AG1+AG2 ~45%, AG4 Bangla
~25%, AG3 ~20%, AG5 ~10%. At an average CPC of US$0.08–0.15 that is roughly **200–375 clicks/day**. If 5–10% of
visitors sign up, that is 10–35 sign-ups/day, i.e. about **US$1–3 per sign-up**. These are targets to check against,
not promises.

## 9. Optimisation schedule

| When | Do |
|---|---|
| Day 1 | Check ads are approved (Ads → Status) and the campaign is spending |
| Days 2–14, every 2–3 days | Search terms: add negatives; add good converting terms as exact match |
| Week 2 | Pause keywords with 100+ clicks and 0 sign-ups; raise the CPC cap to US$0.30 if impression share lost to rank is >40% |
| Week 3 | Replace "Low"-rated RSA headlines with new variants |
| ~30 sign-ups recorded | Switch bidding to Maximize conversions (no target first), then Target CPA at ~1.2× actual CPA after 2 more weeks |
| Month 2 | If conversions are steady, test a Demand Gen or remarketing campaign with ~20% of budget |

## 10. Landing-page checks

- Every final URL must load fast on a phone (prerendered pages already help).
- The cookie banner must not cover the "Make my CV" button on small screens.
- Add UTM tagging via the campaign's **Final URL suffix**:
  `utm_source=google&utm_medium=cpc&utm_campaign={campaignid}&utm_content={adgroupid}&utm_term={keyword}`
