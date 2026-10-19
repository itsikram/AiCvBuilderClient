import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/seo/SEO";
import { Skeleton, SkeletonCard } from "@/components/ui/skeleton";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import type { Template } from "@/types";
import { useLang } from "@/lib/useLang";
import { useHydrated } from "@/lib/useHydrated";
import { breadcrumbLd } from "@/lib/jsonld";

// Map of template slugs to local image paths
const TEMPLATE_IMAGES: Record<string, string> = {
  "modern-ats": "/templates/modern-ats.svg",
  "classic": "/templates/classic.svg",
  "professional-bd": "/templates/professional-bd.svg",
  "creative": "/templates/creative.svg",
  "minimalist": "/templates/minimalist.svg",
  "executive-pro": "/templates/executive-pro.svg",
  "academic": "/templates/academic.svg",
  "tech-pro": "/templates/tech-pro.svg",
  "startup": "/templates/startup.svg",
  "bold-modern": "/templates/bold-modern.svg",
  "international": "/templates/international.svg",
  "bd-gov": "/templates/bd-gov.svg",
};

const getTemplateImage = (template: Template) => {
  // First try to use the slug-based local image
  if (template.slug && TEMPLATE_IMAGES[template.slug]) {
    return TEMPLATE_IMAGES[template.slug];
  }
  // Then try the thumbnail from API
  if (template.thumbnail) {
    return template.thumbnail.replace(/\.png$/i, ".svg");
  }
  // Fallback
  return "/templates/fallback.svg";
};

export default function TemplatesPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { lp } = useLang();
  const { pathname } = useLocation();
  const hydrated = useHydrated();
  const { user, isAuthenticated: authed } = useAuthStore();
  const isAuthenticated = hydrated && authed;
  // The same component renders inside the dashboard, which has its own noindex head
  const isPublic = !pathname.startsWith("/dashboard");

  const { data: templates, isLoading } = useQuery({
    queryKey: ["templates"],
    queryFn: async () => {
      const { data } = await api.get("/templates");
      return data.data as Template[];
    },
  });

  const isFreeUser = Boolean(isAuthenticated && user?.subscription?.plan === "free");

  const handleUseTemplate = (templateSlug: string) => {
    navigate(isAuthenticated ? `/dashboard/resumes/new?template=${templateSlug}` : "/register");
  };

  return (
    <>
      {isPublic && (
        <SEO
          title={t("templatesPage.seoTitle")}
          description={t("templatesPage.seoDescription")}
          jsonLd={breadcrumbLd([{ name: t("nav.home"), path: lp("/") }, { name: t("nav.templates"), path: lp("/templates") }])}
        />
      )}
      <section className="py-10 md:py-14">
        <div className="container mx-auto px-4">
          <h1 className="mb-3 text-center text-3xl font-bold">{t("templatesPage.title")}</h1>
          <p className="mx-auto mb-8 max-w-2xl text-center text-muted">{t("templatesPage.intro")}</p>

          {isFreeUser && (
            <div className="mb-8 flex flex-col items-center justify-between gap-4 rounded-2xl border border-primary/30 bg-gradient-to-r from-blue-50 to-violet-50 px-5 py-4 dark:from-blue-950/30 dark:to-violet-950/30 sm:flex-row">
              <div>
                <p className="font-semibold">{t("templatesPage.upgradeTitle")}</p>
                <p className="text-sm text-muted">{t("templatesPage.upgradeText")}</p>
              </div>
              <Button variant="gradient" onClick={() => navigate("/dashboard/billing")}>{t("pricing.upgrade")}</Button>
            </div>
          )}

          {isLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} className="overflow-hidden">
                  <Skeleton className="h-40 w-full mb-4" />
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </SkeletonCard>
              ))}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates?.map((template) => {
                const imageSrc = getTemplateImage(template);

                return (
                  <Card key={template._id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="h-40 overflow-hidden bg-gradient-to-br from-blue-100 to-violet-100 dark:from-blue-900/30 dark:to-violet-900/30">
                      <img
                        src={imageSrc}
                        alt={t("templatesPage.previewAlt", { name: template.name })}
                        width="400"
                        height="160"
                        className="h-full w-full object-cover"
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.src = "/templates/fallback.svg";
                        }}
                      />
                    </div>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-2">
                      <h2 className="font-semibold">{template.name}</h2>
                      {template.isPremium && <Badge variant="premium">{t("pricing.premium")}</Badge>}
                    </div>
                    <p className="text-sm text-muted mb-4">{template.description}</p>
                    <Badge variant="outline" className="mb-4 capitalize">{template.category}</Badge>
                    {template.locked ? (
                      <Button variant="outline" className="w-full" disabled>
                        <Lock className="h-4 w-4" />
                        {t("templatesPage.premiumOnly")}
                      </Button>
                    ) : (
                      <Button variant="gradient" className="w-full" onClick={() => handleUseTemplate(template.slug)}>
                        {t("templatesPage.use")}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
