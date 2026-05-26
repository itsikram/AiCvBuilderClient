import { useEffect } from "react";
import { usePageContent } from "@/context/PageContentContext";

export function SiteConfig() {
  const { headerFooterContent } = usePageContent();

  useEffect(() => {
    // Update favicon if siteIcon is provided
    if (headerFooterContent.siteIcon) {
      const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (link) {
        link.href = headerFooterContent.siteIcon;
      }
    }

    // Update site title if siteTitle is provided
    if (headerFooterContent.siteTitle) {
      document.title = `${headerFooterContent.siteTitle} - ChakriCV`;
    }
  }, [headerFooterContent.siteIcon, headerFooterContent.siteTitle]);

  return null;
}