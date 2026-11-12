import { SITE_NAME, SITE_NAME_BN, SITE_URL, SUPPORT_EMAIL, absoluteUrl } from "@/lib/site";
import type { Lang } from "@/lib/i18nRouting";

const ORG_ID = `${SITE_URL}/#organization`;
const SITE_ID = `${SITE_URL}/#website`;

/** Other names people search for the brand; Google may use them as the site name in results. */
const ALTERNATE_NAMES = [SITE_NAME_BN, "AI CV Builder", "AICVBuilderBD", "CV Builder BD"];

const FEATURES: Record<Lang, string[]> = {
  en: [
    "AI CV builder",
    "Online CV maker",
    "AI ATS checker with score and missing keywords",
    "AI writing help for career objective and experience",
    "AI cover letter generator",
    "Bangladeshi, ATS and international CV templates",
    "CV in Bangla and English",
    "PDF download",
  ],
  bn: [
    "এআই সিভি বিল্ডার",
    "অনলাইন সিভি মেকার",
    "স্কোর ও অনুপস্থিত কিওয়ার্ডসহ এআই ATS চেকার",
    "ক্যারিয়ার অবজেক্টিভ ও অভিজ্ঞতা লিখতে এআই সাহায্য",
    "এআই কভার লেটার জেনারেটর",
    "বাংলাদেশি, ATS ও আন্তর্জাতিক সিভি টেমপ্লেট",
    "বাংলা ও ইংরেজিতে সিভি",
    "পিডিএফ ডাউনলোড",
  ],
};

/**
 * `socialLinks` are the profiles set in Admin -> Page Content (home page). As `sameAs` they tell
 * Google these profiles (Facebook above all, in Bangladesh) belong to this organisation.
 */
export const organizationLd = (socialLinks: Array<{ url: string }> = []) => {
  const sameAs = [...new Set(socialLinks.map((link) => link.url?.trim()).filter((url) => /^https?:\/\//i.test(url ?? "")))];
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORG_ID,
    name: SITE_NAME,
    alternateName: ALTERNATE_NAMES,
    url: SITE_URL,
    logo: absoluteUrl("/icon-512.png"),
    email: SUPPORT_EMAIL,
    areaServed: { "@type": "Country", name: "Bangladesh" },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: SUPPORT_EMAIL,
      areaServed: "BD",
      availableLanguage: ["en", "bn"],
    },
    ...(sameAs.length ? { sameAs } : {}),
  };
};

// No SearchAction: the site has no on-site search results page to point it at.
export const websiteLd = (lang: Lang) => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": SITE_ID,
  name: SITE_NAME,
  alternateName: ALTERNATE_NAMES,
  url: SITE_URL,
  inLanguage: ["en-BD", "bn-BD"],
  publisher: { "@id": ORG_ID },
  ...(lang === "bn" ? { description: "বাংলা ও ইংরেজিতে ফ্রি এআই সিভি বিল্ডার ও অনলাইন সিভি মেকার" } : { description: "Free AI CV builder and online CV maker for Bangladesh" }),
});

export const webApplicationLd = (lang: Lang) => ({
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: lang === "bn" ? SITE_NAME_BN : SITE_NAME,
  alternateName: lang === "bn" ? SITE_NAME : SITE_NAME_BN,
  description:
    lang === "bn"
      ? "বাংলাদেশের চাকরিপ্রার্থীদের জন্য ফ্রি এআই সিভি বিল্ডার, অনলাইন সিভি মেকার ও এআই ATS চেকার।"
      : "Free AI CV builder, online CV maker and AI ATS checker for job seekers in Bangladesh.",
  url: absoluteUrl(lang === "bn" ? "/bn" : "/"),
  image: absoluteUrl("/og-image.jpg"),
  featureList: FEATURES[lang],
  applicationCategory: "BusinessApplication",
  operatingSystem: "Any (web browser)",
  inLanguage: lang === "bn" ? "bn-BD" : "en-BD",
  browserRequirements: "Requires JavaScript",
  publisher: { "@id": ORG_ID },
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "BDT",
    availability: "https://schema.org/InStock",
  },
});

/** A single tool inside the app (such as the ATS checker), for its landing page. */
export const toolLd = (input: { name: string; description: string; path: string; features: string[]; lang: Lang }) => ({
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: input.name,
  description: input.description,
  url: absoluteUrl(input.path),
  image: absoluteUrl("/og-image.jpg"),
  inLanguage: input.lang === "bn" ? "bn-BD" : "en-BD",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Any (web browser)",
  browserRequirements: "Requires JavaScript",
  featureList: input.features,
  isPartOf: { "@id": SITE_ID },
  publisher: { "@id": ORG_ID },
});

/** The builder with one Offer per paid/free plan price, for the pricing page. */
export const pricingLd = (
  plans: Array<{ name: string; description?: string; priceMonthly: number; priceYearly: number; currency?: string }>,
  lang: Lang
) => ({
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: lang === "bn" ? SITE_NAME_BN : SITE_NAME,
  url: absoluteUrl(lang === "bn" ? "/bn/pricing" : "/pricing"),
  applicationCategory: "BusinessApplication",
  operatingSystem: "Any (web browser)",
  publisher: { "@id": ORG_ID },
  offers: plans.flatMap((plan) => {
    const currency = plan.currency || "BDT";
    const offer = (price: number, unit: "MON" | "ANN") => ({
      "@type": "Offer",
      name: plan.name,
      ...(plan.description ? { description: plan.description } : {}),
      price: String(price),
      priceCurrency: currency,
      availability: "https://schema.org/InStock",
      url: absoluteUrl(lang === "bn" ? "/bn/pricing" : "/pricing"),
      ...(price > 0
        ? { priceSpecification: { "@type": "UnitPriceSpecification", price: String(price), priceCurrency: currency, billingDuration: 1, billingIncrement: 1, unitCode: unit } }
        : {}),
    });
    if (!plan.priceMonthly && !plan.priceYearly) return [offer(0, "MON")];
    return [
      ...(plan.priceMonthly ? [offer(plan.priceMonthly, "MON")] : []),
      ...(plan.priceYearly ? [offer(plan.priceYearly, "ANN")] : []),
    ];
  }),
});

export const breadcrumbLd = (items: Array<{ name: string; path: string }>) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: absoluteUrl(item.path),
  })),
});

export const faqLd = (faqs: Array<{ q: string; a: string }>) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.q,
    acceptedAnswer: { "@type": "Answer", text: faq.a },
  })),
});

export const howToLd = (input: { name: string; description: string; steps: Array<{ name: string; text: string }>; lang: Lang }) => ({
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: input.name,
  description: input.description,
  inLanguage: input.lang === "bn" ? "bn-BD" : "en-BD",
  step: input.steps.map((step, index) => ({
    "@type": "HowToStep",
    position: index + 1,
    name: step.name,
    text: step.text,
  })),
});

export const articleLd = (input: {
  headline: string;
  description: string;
  path: string;
  lang: Lang;
  datePublished: string;
  dateModified: string;
  image?: string;
}) => ({
  "@context": "https://schema.org",
  "@type": "Article",
  headline: input.headline,
  description: input.description,
  inLanguage: input.lang === "bn" ? "bn-BD" : "en-BD",
  mainEntityOfPage: absoluteUrl(input.path),
  image: absoluteUrl(input.image || "/og-image.jpg"),
  datePublished: input.datePublished,
  dateModified: input.dateModified,
  author: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
  publisher: { "@id": ORG_ID },
});
