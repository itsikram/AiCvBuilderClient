import type { Lang } from "@/lib/i18nRouting";

// Privacy policy, terms and refund policy. They describe what this app really does (check them
// whenever a feature changes) and are a reasonable starting point, not legal advice: have a
// lawyer in Bangladesh review them, and update LEGAL_UPDATED when you change the text.

export const LEGAL_UPDATED = "2026-11-08";

export interface LegalSection {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
}

export interface LegalDoc {
  /** <title>, 60 characters or fewer in English */
  title: string;
  description: string;
  h1: string;
  intro: string;
  sections: LegalSection[];
}

export type LegalSlug = "privacy" | "terms" | "refund-policy";

export const LEGAL_SLUGS: LegalSlug[] = ["privacy", "terms", "refund-policy"];

const CONTACT = "support@aicvbuilderbd.online";

export const LEGAL: Record<LegalSlug, Record<Lang, LegalDoc>> = {
  privacy: {
    en: {
      title: "Privacy Policy",
      description: "What AI CV Builder BD collects, why, who processes it, how long we keep it, and how to have your data deleted.",
      h1: "Privacy policy",
      intro: "This policy explains what information AI CV Builder BD (aicvbuilderbd.online) collects when you use the site, how we use it, and the choices you have.",
      sections: [
        {
          heading: "What we collect",
          bullets: [
            "Account details: your name, email address and password (stored only as a secure hash). If you sign in with Google, we receive your name, email and profile photo from Google.",
            "What you write in your CVs, cover letters and biodata, including personal details you choose to add, such as date of birth, address, NID, religion or a photo.",
            "Payments: the plan or product, amount, payment method and transaction ID. Card and mobile banking payments are handled by SSLCommerz; we never receive your card number. For manual bKash payments we keep the bKash number you send from.",
            "Activity: actions such as signing in, creating or downloading a CV and using AI tools, with the IP address and browser used. We use this for security, support and improving the service.",
            "Cookies and browser storage: a cookie that keeps you signed in, and local storage for your settings and drafts. Google Analytics loads only if you accept analytics cookies. The Google tag measures visits and sign-ups or purchases that come from our Google Ads; it uses cookies only if you accept them (in the EU, UK and Switzerland) or don't decline them (elsewhere).",
          ],
        },
        {
          heading: "How we use it",
          bullets: [
            "To provide the service: save your CVs, make PDFs, run the AI tools, process payments and deliver orders.",
            "AI tools send the text they work on to Google's Gemini API to generate suggestions. We don't use your CV to train AI models.",
            "To email you about your account: verification, password resets, payments, orders, and when your Premium is about to end.",
            "To keep the service safe and to fix problems.",
          ],
        },
        {
          heading: "Who else processes your data",
          paragraphs: [
            "We don't sell your personal information. We share it only with services that help us run the site, for the purposes above: Google (Gemini AI, Sign-In, Ads conversion measurement and, with your consent, Analytics), Cloudinary (photos and uploaded files), SSLCommerz, bKash and Nagad (payments), our email provider and our hosting providers.",
            "Your CV is public only if you create a share link. Anyone with that link can see it until you turn sharing off.",
          ],
        },
        {
          heading: "CV screening for employers",
          paragraphs: [
            "Employers who upload candidates' CVs for screening must have a lawful reason and the candidates' consent. We use uploaded CVs only to calculate a match score, keep only the score and short notes (never the CV itself), and delete each screening after 30 days.",
          ],
        },
        {
          heading: "How long we keep data",
          bullets: [
            "Your account, CVs and orders: until you delete them or ask us to delete your account.",
            "Activity records: 180 days.",
            "Payment records: as long as the law requires for accounting.",
            "CV screenings: 30 days.",
          ],
        },
        {
          heading: "Your choices and rights",
          paragraphs: [
            `You can edit or delete your CVs at any time. To get a copy of your data or to delete your account, email ${CONTACT} from your account's email address and we'll do it within 30 days.`,
            "The service isn't meant for children under 13.",
          ],
        },
        {
          heading: "Changes and contact",
          paragraphs: [
            `We'll update this page when our practices change and show the new date at the top. Questions? Email ${CONTACT}.`,
          ],
        },
      ],
    },
    bn: {
      title: "প্রাইভেসি পলিসি – এআই সিভি বিল্ডার বিডি",
      description: "এআই সিভি বিল্ডার বিডি কী তথ্য সংগ্রহ করে, কেন, কারা তা প্রক্রিয়া করে, কতদিন রাখা হয় এবং কীভাবে তথ্য মুছে ফেলতে বলবেন।",
      h1: "প্রাইভেসি পলিসি",
      intro: "এই নীতিতে ব্যাখ্যা করা হয়েছে, এআই সিভি বিল্ডার বিডি (aicvbuilderbd.online) ব্যবহারের সময় আমরা কী তথ্য সংগ্রহ করি, কীভাবে ব্যবহার করি এবং আপনার কী কী বেছে নেওয়ার সুযোগ আছে।",
      sections: [
        {
          heading: "আমরা যা সংগ্রহ করি",
          bullets: [
            "অ্যাকাউন্টের তথ্য: আপনার নাম, ইমেইল ঠিকানা ও পাসওয়ার্ড (শুধু নিরাপদ হ্যাশ হিসেবে রাখা হয়)। গুগল দিয়ে সাইন ইন করলে গুগল থেকে আপনার নাম, ইমেইল ও প্রোফাইল ছবি পাই।",
            "সিভি, কভার লেটার ও বায়োডাটায় আপনি যা লেখেন, আপনার দেওয়া ব্যক্তিগত তথ্যসহ, যেমন জন্ম তারিখ, ঠিকানা, এনআইডি, ধর্ম বা ছবি।",
            "পেমেন্ট: প্ল্যান বা পণ্য, পরিমাণ, পেমেন্টের মাধ্যম ও ট্রানজেকশন আইডি। কার্ড ও মোবাইল ব্যাংকিং পেমেন্ট SSLCommerz সামলায়; আপনার কার্ড নম্বর আমরা কখনো পাই না। বিকাশে নিজে পাঠানো পেমেন্টের ক্ষেত্রে আপনি যে নম্বর থেকে পাঠান সেটি রাখি।",
            "কার্যকলাপ: সাইন ইন, সিভি তৈরি বা ডাউনলোড, এআই টুল ব্যবহারের মতো কাজ, ব্যবহৃত আইপি ঠিকানা ও ব্রাউজারসহ। নিরাপত্তা, সহায়তা ও সেবা উন্নত করতে এগুলো ব্যবহার করি।",
            "কুকি ও ব্রাউজার স্টোরেজ: সাইন ইন রাখতে একটি কুকি, আর আপনার সেটিংস ও খসড়ার জন্য লোকাল স্টোরেজ। অ্যানালিটিক্স কুকি মেনে নিলে তবেই গুগল অ্যানালিটিক্স চালু হয়। গুগল ট্যাগ আমাদের গুগল বিজ্ঞাপন থেকে আসা ভিজিট, সাইন-আপ ও কেনাকাটা মাপে; কুকি ব্যবহার করে শুধু আপনি মেনে নিলে (ইইউ, যুক্তরাজ্য ও সুইজারল্যান্ডে) বা বাতিল না করলে (অন্য সব জায়গায়)।",
          ],
        },
        {
          heading: "আমরা যেভাবে ব্যবহার করি",
          bullets: [
            "সেবা দিতে: আপনার সিভি সংরক্ষণ, পিডিএফ তৈরি, এআই টুল চালানো, পেমেন্ট প্রক্রিয়া ও অর্ডার ডেলিভারি।",
            "এআই টুলগুলো যে লেখা নিয়ে কাজ করে তা পরামর্শ তৈরির জন্য গুগলের Gemini API-তে পাঠায়। এআই মডেল প্রশিক্ষণে আমরা আপনার সিভি ব্যবহার করি না।",
            "আপনার অ্যাকাউন্ট নিয়ে ইমেইল পাঠাতে: ভেরিফিকেশন, পাসওয়ার্ড রিসেট, পেমেন্ট, অর্ডার এবং প্রিমিয়াম শেষ হওয়ার আগে মনে করিয়ে দিতে।",
            "সেবা নিরাপদ রাখতে ও সমস্যা ঠিক করতে।",
          ],
        },
        {
          heading: "আর কারা আপনার তথ্য প্রক্রিয়া করে",
          paragraphs: [
            "আমরা আপনার ব্যক্তিগত তথ্য বিক্রি করি না। শুধু উপরের কাজগুলোর জন্য সাইট চালাতে সাহায্যকারী সেবাগুলোর সাথে শেয়ার করি: গুগল (Gemini এআই, সাইন-ইন, বিজ্ঞাপনের কনভার্সন পরিমাপ এবং আপনার সম্মতিতে অ্যানালিটিক্স), Cloudinary (ছবি ও আপলোড করা ফাইল), SSLCommerz, বিকাশ ও নগদ (পেমেন্ট), আমাদের ইমেইল ও হোস্টিং সেবাদাতা।",
            "শেয়ার লিংক তৈরি করলে তবেই আপনার সিভি পাবলিক হয়। শেয়ারিং বন্ধ না করা পর্যন্ত লিংকটি যার কাছে আছে সে সিভি দেখতে পারবে।",
          ],
        },
        {
          heading: "নিয়োগকর্তাদের সিভি স্ক্রিনিং",
          paragraphs: [
            "যেসব নিয়োগকর্তা স্ক্রিনিংয়ের জন্য প্রার্থীদের সিভি আপলোড করেন, তাদের আইনসংগত কারণ ও প্রার্থীদের সম্মতি থাকতে হবে। আপলোড করা সিভি শুধু মিলের নম্বর হিসাবের জন্য ব্যবহার করি, শুধু নম্বর ও ছোট নোট রাখি (সিভি নিজে কখনো নয়) এবং প্রতিটি স্ক্রিনিং ৩০ দিন পর মুছে ফেলি।",
          ],
        },
        {
          heading: "কতদিন তথ্য রাখি",
          bullets: [
            "আপনার অ্যাকাউন্ট, সিভি ও অর্ডার: আপনি মুছে ফেলা বা অ্যাকাউন্ট মুছতে বলা পর্যন্ত।",
            "কার্যকলাপের রেকর্ড: ১৮০ দিন।",
            "পেমেন্টের রেকর্ড: হিসাবের জন্য আইন যতদিন রাখতে বলে।",
            "সিভি স্ক্রিনিং: ৩০ দিন।",
          ],
        },
        {
          heading: "আপনার অধিকার",
          paragraphs: [
            `যেকোনো সময় সিভি এডিট বা মুছে ফেলতে পারেন। আপনার তথ্যের কপি পেতে বা অ্যাকাউন্ট মুছতে, অ্যাকাউন্টের ইমেইল থেকে ${CONTACT} ঠিকানায় লিখুন; আমরা ৩০ দিনের মধ্যে করে দেব।`,
            "এই সেবা ১৩ বছরের কম বয়সী শিশুদের জন্য নয়।",
          ],
        },
        {
          heading: "পরিবর্তন ও যোগাযোগ",
          paragraphs: [`আমাদের নিয়ম বদলালে এই পাতা হালনাগাদ করব এবং উপরে নতুন তারিখ দেখাব। প্রশ্ন থাকলে ${CONTACT} ঠিকানায় লিখুন।`],
        },
      ],
    },
  },
  terms: {
    en: {
      title: "Terms of Service",
      description: "The rules for using AI CV Builder BD: accounts, your content, AI suggestions, passes, trials, codes, rewards, services and employer screening.",
      h1: "Terms of service",
      intro: "By creating an account or using AI CV Builder BD you agree to these terms. Please read them; they're written to be short and clear.",
      sections: [
        {
          heading: "Your account",
          bullets: [
            "Give accurate details and keep your password safe. You're responsible for what happens in your account.",
            "One person, one account. Creating extra accounts to get more free trials, rewards or credits isn't allowed.",
          ],
        },
        {
          heading: "Your content",
          paragraphs: [
            "You own the CVs and other content you create. You let us store and process it only to provide the service to you. Only add information that is true and that you have the right to share.",
          ],
        },
        {
          heading: "AI suggestions",
          paragraphs: [
            "AI tools suggest wording, scores and feedback. They can be wrong. Check every suggestion before you use it; you're responsible for what your CV says. A better CV improves your chances but we can't promise any job, interview or result.",
          ],
        },
        {
          heading: "Plans, passes, trials, codes and rewards",
          bullets: [
            "The Free plan has the limits shown on the pricing page and may change with notice.",
            "Premium passes (7 days, 30 days, 1 year) give Premium for that many days. They don't renew automatically. Buying another pass adds its days after your current end date.",
            "The free Premium trial is one per person. Access codes from organisations and referral rewards give Premium days as described when you get them.",
            "We may end trials, codes, rewards or credits that were obtained by fake accounts or other abuse.",
            "Prices are in Bangladeshi taka (BDT). Refunds follow our refund policy.",
          ],
        },
        {
          heading: "Extras and services",
          paragraphs: [
            "Credit packs (watermark-free PDFs, AI requests, CV screenings) are added when your payment is confirmed. Services done by people, such as CV reviews, are delivered by email and in My orders; delivery times are our target, and we'll tell you if something delays an order.",
          ],
        },
        {
          heading: "Employer CV screening",
          paragraphs: [
            "Only upload CVs you're allowed to process, with the candidates' consent. Scores are a starting point: a person must make every hiring decision. Don't use the tool to discriminate on gender, religion, age, disability or any other unlawful basis.",
          ],
        },
        {
          heading: "Fair use",
          bullets: [
            "Don't misuse the service: no illegal content, impersonation, spam, scraping, attempts to break security, or automated mass use of the AI tools.",
            "We may suspend accounts that break these terms.",
          ],
        },
        {
          heading: "Liability",
          paragraphs: [
            "We work to keep the service available and your data safe, but it's provided as it is. As far as the law allows, we aren't liable for indirect losses, and our total liability is limited to what you paid us in the last 3 months.",
          ],
        },
        {
          heading: "Changes, law and contact",
          paragraphs: [
            `We may update these terms; we'll show the new date at the top and tell you about important changes. These terms are governed by the laws of Bangladesh. Questions? Email ${CONTACT}.`,
          ],
        },
      ],
    },
    bn: {
      title: "ব্যবহারের শর্তাবলি – এআই সিভি বিল্ডার বিডি",
      description: "এআই সিভি বিল্ডার বিডি ব্যবহারের নিয়ম: অ্যাকাউন্ট, আপনার কনটেন্ট, এআই পরামর্শ, পাস, ট্রায়াল, কোড, পুরস্কার, সার্ভিস ও স্ক্রিনিং।",
      h1: "ব্যবহারের শর্তাবলি",
      intro: "অ্যাকাউন্ট খুলে বা এআই সিভি বিল্ডার বিডি ব্যবহার করে আপনি এই শর্তগুলো মেনে নিচ্ছেন। শর্তগুলো ছোট ও সহজ করে লেখা, একবার পড়ে নিন।",
      sections: [
        {
          heading: "আপনার অ্যাকাউন্ট",
          bullets: [
            "সঠিক তথ্য দিন ও পাসওয়ার্ড নিরাপদে রাখুন। আপনার অ্যাকাউন্টে যা ঘটে তার দায়িত্ব আপনার।",
            "একজনের একটি অ্যাকাউন্ট। বাড়তি ফ্রি ট্রায়াল, পুরস্কার বা ক্রেডিট পেতে আলাদা অ্যাকাউন্ট খোলা যাবে না।",
          ],
        },
        {
          heading: "আপনার কনটেন্ট",
          paragraphs: ["আপনার তৈরি সিভি ও অন্যান্য কনটেন্টের মালিক আপনি। শুধু আপনাকে সেবা দেওয়ার জন্য আমরা তা সংরক্ষণ ও প্রক্রিয়া করি। শুধু সত্য তথ্য দিন, যা শেয়ার করার অধিকার আপনার আছে।"],
        },
        {
          heading: "এআই পরামর্শ",
          paragraphs: ["এআই টুল লেখা, নম্বর ও মতামত সাজেস্ট করে, এবং তা ভুলও হতে পারে। ব্যবহারের আগে প্রতিটি পরামর্শ যাচাই করুন; আপনার সিভিতে কী লেখা থাকবে তার দায়িত্ব আপনার। ভালো সিভি সুযোগ বাড়ায়, তবে কোনো চাকরি, ইন্টারভিউ বা ফলাফলের নিশ্চয়তা আমরা দিতে পারি না।"],
        },
        {
          heading: "প্ল্যান, পাস, ট্রায়াল, কোড ও পুরস্কার",
          bullets: [
            "ফ্রি প্ল্যানের সীমা মূল্য তালিকার পাতায় দেখানো আছে; জানিয়ে তা বদলাতে পারে।",
            "প্রিমিয়াম পাস (৭ দিন, ৩০ দিন, ১ বছর) ততদিনের প্রিমিয়াম দেয়। এগুলো নিজে থেকে নবায়ন হয় না। আরেকটি পাস কিনলে তার দিন বর্তমান শেষ তারিখের পরে যোগ হয়।",
            "ফ্রি প্রিমিয়াম ট্রায়াল একজনের একবার। প্রতিষ্ঠানের অ্যাক্সেস কোড ও রেফারেল পুরস্কার পাওয়ার সময় যেমন বলা থাকে তেমন প্রিমিয়াম দিন দেয়।",
            "ভুয়া অ্যাকাউন্ট বা অন্য অপব্যবহারে পাওয়া ট্রায়াল, কোড, পুরস্কার বা ক্রেডিট আমরা বাতিল করতে পারি।",
            "দাম বাংলাদেশি টাকায় (BDT)। রিফান্ড আমাদের রিফান্ড নীতি অনুযায়ী।",
          ],
        },
        {
          heading: "এক্সট্রা ও সার্ভিস",
          paragraphs: ["ক্রেডিট প্যাক (ওয়াটারমার্ক ছাড়া পিডিএফ, এআই রিকোয়েস্ট, সিভি স্ক্রিনিং) পেমেন্ট নিশ্চিত হলে যোগ হয়। মানুষের করা সার্ভিস, যেমন সিভি রিভিউ, ইমেইলে ও আমার অর্ডার পাতায় ডেলিভারি হয়; ডেলিভারির সময় আমাদের লক্ষ্য, দেরি হলে আমরা জানাব।"],
        },
        {
          heading: "নিয়োগকর্তাদের সিভি স্ক্রিনিং",
          paragraphs: ["শুধু সেই সিভি আপলোড করুন যা প্রক্রিয়া করার অনুমতি আপনার আছে, প্রার্থীদের সম্মতিসহ। নম্বর শুধু শুরুর ধাপ: প্রতিটি নিয়োগের সিদ্ধান্ত একজন মানুষকে নিতে হবে। লিঙ্গ, ধর্ম, বয়স, প্রতিবন্ধিতা বা অন্য কোনো বেআইনি ভিত্তিতে বৈষম্য করতে এই টুল ব্যবহার করবেন না।"],
        },
        {
          heading: "ন্যায্য ব্যবহার",
          bullets: [
            "সেবার অপব্যবহার করবেন না: বেআইনি কনটেন্ট, ছদ্মবেশ ধারণ, স্প্যাম, তথ্য স্ক্র্যাপ করা, নিরাপত্তা ভাঙার চেষ্টা বা স্বয়ংক্রিয়ভাবে ব্যাপক হারে এআই টুল ব্যবহার নিষেধ।",
            "এই শর্ত ভাঙা অ্যাকাউন্ট আমরা স্থগিত করতে পারি।",
          ],
        },
        {
          heading: "দায়বদ্ধতা",
          paragraphs: ["সেবা চালু রাখতে ও আপনার তথ্য নিরাপদ রাখতে আমরা কাজ করি, তবে সেবাটি যেমন আছে তেমনভাবেই দেওয়া হয়। আইন যতটুকু অনুমতি দেয়, পরোক্ষ ক্ষতির দায় আমাদের নয় এবং আমাদের মোট দায় গত ৩ মাসে আপনি আমাদের যা পরিশোধ করেছেন তার মধ্যে সীমিত।"],
        },
        {
          heading: "পরিবর্তন, আইন ও যোগাযোগ",
          paragraphs: [`আমরা এই শর্ত হালনাগাদ করতে পারি; উপরে নতুন তারিখ দেখাব এবং গুরুত্বপূর্ণ পরিবর্তন জানাব। এই শর্তাবলি বাংলাদেশের আইন অনুযায়ী পরিচালিত। প্রশ্ন থাকলে ${CONTACT} ঠিকানায় লিখুন।`],
        },
      ],
    },
  },
  "refund-policy": {
    en: {
      title: "Refund Policy",
      description: "When you can get your money back for Premium passes, credit packs and services on AI CV Builder BD, and how refunds are paid.",
      h1: "Refund policy",
      intro: "We want you to pay only for what's useful to you. This page explains when we refund and how.",
      sections: [
        {
          heading: "Failed, duplicate or unapplied payments",
          paragraphs: ["If you were charged twice, charged for a failed payment, or paid but didn't get what you bought, contact us and we'll either fix it or refund you in full."],
        },
        {
          heading: "Premium passes and credit packs",
          bullets: [
            "Ask within 3 days of buying and before using it (no watermark-free download, Premium template download, pack AI request or screening used) and we'll refund in full.",
            "After that, or once you've used it, passes and used credits aren't refundable. Unused days don't carry over to cash.",
            "Free trials, access codes and referral rewards are free and so have nothing to refund.",
          ],
        },
        {
          heading: "Services done by people",
          bullets: [
            "If we haven't started your order, we refund in full.",
            "If you're not happy with the delivered work, tell us within 7 days and we'll revise it once.",
            "If we can't deliver, we refund in full.",
          ],
        },
        {
          heading: "How to ask and how you're paid",
          paragraphs: [
            `Email ${CONTACT} from your account's email with the transaction ID. We reply within 2 working days. Approved bKash refunds go to the number you paid from within 7 working days; card and other SSLCommerz payments are refunded through SSLCommerz, which usually takes 7–10 working days to reach your account.`,
          ],
        },
      ],
    },
    bn: {
      title: "রিফান্ড নীতি – এআই সিভি বিল্ডার বিডি",
      description: "এআই সিভি বিল্ডার বিডিতে প্রিমিয়াম পাস, ক্রেডিট প্যাক ও সার্ভিসের টাকা কখন ফেরত পাবেন এবং কীভাবে রিফান্ড দেওয়া হয়।",
      h1: "রিফান্ড নীতি",
      intro: "আমরা চাই আপনি শুধু কাজের জিনিসের জন্যই টাকা দিন। কখন ও কীভাবে টাকা ফেরত দিই, এই পাতায় তা বলা আছে।",
      sections: [
        {
          heading: "ব্যর্থ, দুইবার কাটা বা কাজে না লাগা পেমেন্ট",
          paragraphs: ["দুইবার টাকা কাটা হলে, ব্যর্থ পেমেন্টে টাকা কাটা হলে, বা পেমেন্ট করেও কেনা জিনিস না পেলে যোগাযোগ করুন; আমরা ঠিক করে দেব অথবা পুরো টাকা ফেরত দেব।"],
        },
        {
          heading: "প্রিমিয়াম পাস ও ক্রেডিট প্যাক",
          bullets: [
            "কেনার ৩ দিনের মধ্যে এবং ব্যবহারের আগে (ওয়াটারমার্ক ছাড়া ডাউনলোড, প্রিমিয়াম টেমপ্লেট ডাউনলোড, প্যাকের এআই রিকোয়েস্ট বা স্ক্রিনিং ব্যবহার না করে) জানালে পুরো টাকা ফেরত দেব।",
            "এরপর, অথবা ব্যবহার করে ফেললে, পাস ও ব্যবহৃত ক্রেডিট ফেরতযোগ্য নয়। অব্যবহৃত দিন টাকায় ফেরত হয় না।",
            "ফ্রি ট্রায়াল, অ্যাক্সেস কোড ও রেফারেল পুরস্কার বিনামূল্যে, তাই ফেরত দেওয়ার কিছু নেই।",
          ],
        },
        {
          heading: "মানুষের করা সার্ভিস",
          bullets: [
            "অর্ডারের কাজ শুরু না হলে পুরো টাকা ফেরত।",
            "ডেলিভারি পাওয়া কাজে সন্তুষ্ট না হলে ৭ দিনের মধ্যে জানান, আমরা একবার সংশোধন করে দেব।",
            "আমরা ডেলিভারি দিতে না পারলে পুরো টাকা ফেরত।",
          ],
        },
        {
          heading: "কীভাবে চাইবেন ও কীভাবে পাবেন",
          paragraphs: [
            `অ্যাকাউন্টের ইমেইল থেকে ট্রানজেকশন আইডিসহ ${CONTACT} ঠিকানায় লিখুন। ২ কর্মদিবসের মধ্যে উত্তর দিই। অনুমোদিত বিকাশ রিফান্ড ৭ কর্মদিবসের মধ্যে যে নম্বর থেকে পেমেন্ট করেছিলেন সেখানে যায়; কার্ড ও অন্যান্য SSLCommerz পেমেন্ট SSLCommerz-এর মাধ্যমে ফেরত হয়, যা আপনার অ্যাকাউন্টে পৌঁছাতে সাধারণত ৭–১০ কর্মদিবস লাগে।`,
          ],
        },
      ],
    },
  },
};
