import { useEffect } from "react";
import { usePageContent } from "@/context/PageContentContext";

/** Applies the admin-configured favicon. Page titles are owned by each page's <SEO>. */
export function SiteConfig() {
  const { headerFooterContent } = usePageContent();

  useEffect(() => {
    if (!headerFooterContent.siteIcon) return;
    const link = document.querySelector<HTMLLinkElement>("link[rel~='icon'][type='image/svg+xml']")
      ?? document.querySelector<HTMLLinkElement>("link[rel~='icon']");
    if (link) link.href = headerFooterContent.siteIcon;
  }, [headerFooterContent.siteIcon]);

  return null;
}
