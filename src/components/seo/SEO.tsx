import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
}

export function SEO({
  title = "ChakriCV - AI Resume Builder for Bangladesh",
  description = "Create ATS-optimized resumes, cover letters, and land jobs in Bangladesh with AI-powered ChakriCV.",
  image = "/og-image.png",
  url,
  type = "website",
}: SEOProps) {
  const fullTitle = title.includes("ChakriCV") ? title : `${title} | ChakriCV`;
  const siteUrl = import.meta.env.VITE_APP_URL || "https://chakricv.com";
  const pageUrl = url ? `${siteUrl}${url}` : siteUrl;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={`${siteUrl}${image}`} />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:type" content={type} />
      <meta name="twitter:card" content="summary_large_image" />
      <link rel="canonical" href={pageUrl} />
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "ChakriCV",
          applicationCategory: "BusinessApplication",
          offers: { "@type": "Offer", price: "0", priceCurrency: "BDT" },
        })}
      </script>
    </Helmet>
  );
}
