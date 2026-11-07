import { SITE_NAME, SITE_NAME_BN, SITE_URL, SUPPORT_EMAIL, absoluteUrl } from "@/lib/site";
import type { Lang } from "@/lib/i18nRouting";

const ORG_ID = `${SITE_URL}/#organization`;
const SITE_ID = `${SITE_URL}/#website`;

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
    alternateName: SITE_NAME_BN,
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
  alternateName: SITE_NAME_BN,
  url: SITE_URL,
  inLanguage: ["en-BD", "bn-BD"],
  publisher: { "@id": ORG_ID },
  ...(lang === "bn" ? { description: "বাংলা ও ইংরেজিতে ফ্রি এআই সিভি মেকার" } : { description: "Free AI CV maker for Bangladesh" }),
});

export const webApplicationLd = (lang: Lang) => ({
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: lang === "bn" ? SITE_NAME_BN : SITE_NAME,
  url: absoluteUrl(lang === "bn" ? "/bn" : "/"),
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
