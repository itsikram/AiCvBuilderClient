import type { ReactNode } from "react";
import { createContext, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export interface PageContentData {
  _id: string;
  pageId: "home" | "about" | "contact";
  language: "en" | "bn";
  content: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HeaderFooterContent {
  siteTitle: string;
  siteDescription: string;
  footerDescription: string;
  contactEmail: string;
  contactPhone: string;
  officeAddress: string;
}

interface PageContentContextType {
  pageContents: PageContentData[];
  isLoading: boolean;
  getPageContent: (pageId: "home" | "about" | "contact") => Record<string, unknown> | undefined;
  headerFooterContent: Partial<HeaderFooterContent>;
  refreshContent: () => void;
}

const PageContentContext = createContext<PageContentContextType | undefined>(undefined);

export function PageContentProvider({ children }: { children: ReactNode }) {
  const { data: pageContents, isLoading, refetch } = useQuery({
    queryKey: ["page-contents-all"],
    queryFn: async () => {
      const { data } = await api.get("/admin/page-content");
      return data.data as PageContentData[];
    },
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true,
  });

  // Get current language from localStorage or default to 'en'
  const getCurrentLanguage = (): "en" | "bn" => {
    const saved = localStorage.getItem("i18nextLng");
    return (saved === "bn" ? "bn" : "en") as "en" | "bn";
  };

  const getPageContent = (pageId: "home" | "about" | "contact"): Record<string, unknown> | undefined => {
    if (!pageContents) return undefined;
    const currentLang = getCurrentLanguage();
    const content = pageContents.find(
      (c) => c.pageId === pageId && c.language === currentLang && c.isActive
    );
    return content?.content;
  };

  // Extract header/footer content from page contents (using contact page for contact info)
  const headerFooterContent: Partial<HeaderFooterContent> = {};
  
  if (pageContents) {
    const contactContent = pageContents.find(
      (c) => c.pageId === "contact" && c.language === getCurrentLanguage() && c.isActive
    );
    if (contactContent?.content) {
      if (typeof contactContent.content.email === "string") {
        headerFooterContent.contactEmail = contactContent.content.email;
      }
      if (typeof contactContent.content.phone === "string") {
        headerFooterContent.contactPhone = contactContent.content.phone;
      }
      if (typeof contactContent.content.officeAddress === "string") {
        headerFooterContent.officeAddress = contactContent.content.officeAddress;
      }
    }

    const homeContent = pageContents.find(
      (c) => c.pageId === "home" && c.language === getCurrentLanguage() && c.isActive
    );
    if (homeContent?.content) {
      if (typeof homeContent.content.heroTitle === "string") {
        headerFooterContent.siteTitle = homeContent.content.heroTitle;
      }
      if (typeof homeContent.content.heroSubtitle === "string") {
        headerFooterContent.siteDescription = homeContent.content.heroSubtitle;
      }
    }
  }

  return (
    <PageContentContext.Provider
      value={{
        pageContents: pageContents || [],
        isLoading,
        getPageContent,
        headerFooterContent,
        refreshContent: refetch,
      }}
    >
      {children}
    </PageContentContext.Provider>
  );
}

export function usePageContent() {
  const context = useContext(PageContentContext);
  if (context === undefined) {
    throw new Error("usePageContent must be used within a PageContentProvider");
  }
  return context;
}