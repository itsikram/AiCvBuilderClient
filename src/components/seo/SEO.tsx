import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "website" | "article";
  robots?: string;
  noIndex?: boolean;
  locale?: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  structuredData?: unknown;
}

const DEFAULT_TITLE = "ChakriCV - AI Resume Builder for Bangladesh";
const DEFAULT_DESCRIPTION =
  "Create ATS-optimized resumes, cover letters, and job-ready AI content with ChakriCV in Bangladesh.";
const DEFAULT_IMAGE = "/og-image.svg";
const SITE_URL = import.meta.env.VITE_APP_URL || "https://chakricv.com";

function normalizeUrl(value?: string) {
  if (!value) {
    return SITE_URL;
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return `${SITE_URL}${value.startsWith("/") ? value : `/${value}`}`;
}

function normalizeImage(value?: string) {
  if (!value) {
    return normalizeUrl(DEFAULT_IMAGE);
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return normalizeUrl(value);
}

function getDefaultStructuredData({
  description,
  pageUrl,
  image,
}: {
  description: string;
  pageUrl: string;
  image: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "ChakriCV",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description,
    url: pageUrl,
    image,
    publisher: {
      "@type": "Organization",
      name: "ChakriCV",
      url: SITE_URL,
      logo: image,
    },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "BDT",
    },
  };
}

export function SEO({
  title,
  description = DEFAULT_DESCRIPTION,
  image = DEFAULT_IMAGE,
  url,
  type = "website",
  robots,
  noIndex = false,
  locale = "en_BD",
  author = "ChakriCV",
  publishedTime,
  modifiedTime,
  structuredData,
}: SEOProps) {
  const fullTitle = title
    ? title.includes("ChakriCV")
      ? title
      : `${title} | ChakriCV`
    : DEFAULT_TITLE;
  const pageUrl = normalizeUrl(url);
  const ogImage = normalizeImage(image);
  const resolvedRobots = robots || (noIndex ? "noindex, nofollow" : "index, follow");
  const jsonLd = structuredData ?? getDefaultStructuredData({ description, pageUrl, image: ogImage });

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={resolvedRobots} />
      <meta name="author" content={author} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="ChakriCV" />
      <meta property="og:locale" content={locale} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
      <link rel="canonical" href={pageUrl} />
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
    </Helmet>
  );
}
