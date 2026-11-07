import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Briefcase, FileCheck2, Sparkles, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckoutPanel } from "@/components/billing/CheckoutPanel";
import api from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { localNumber } from "@/lib/trial";
import { useAuthStore } from "@/store/authStore";
import type { Product, Resume } from "@/types";

const ICONS: Record<Product["kind"], typeof Sparkles> = {
  pdf_credits: FileCheck2,
  ai_credits: Sparkles,
  screening_credits: Briefcase,
  service: UserCheck,
};

/** Extras: credit packs and expert services bought once, without Premium. */
export default function ShopPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuthStore();
  const [selected, setSelected] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [resumeId, setResumeId] = useState("");
  const num = (n: number) => localNumber(n, i18n.language);

  const { data: products, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => (await api.get("/payments/products")).data.data as Product[],
  });
  const { data: resumes } = useQuery({
    queryKey: ["resumes"],
    queryFn: async () => (await api.get("/resumes")).data.data as Resume[],
  });

  const groups: Array<{ id: string; title: string; items: Product[] }> = [
    { id: "credits", title: t("shop.creditsTitle"), items: products?.filter((p) => p.kind === "pdf_credits" || p.kind === "ai_credits") ?? [] },
    { id: "services", title: t("shop.servicesTitle"), items: products?.filter((p) => p.kind === "service") ?? [] },
    { id: "employers", title: t("shop.employersTitle"), items: products?.filter((p) => p.kind === "screening_credits") ?? [] },
  ];
  const credits = user?.credits;

  const detail = (product: Product) =>
    product.kind === "service"
      ? product.deliveryDays
        ? t("shop.delivery", { n: num(product.deliveryDays) })
        : ""
      : product.validDays
        ? t("shop.validFor", { n: num(product.validDays) })
        : t("shop.noExpiry");

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t("shop.title")}</h1>
          <p className="text-muted">{t("shop.subtitle")}</p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/dashboard/orders">{t("shop.myOrders")}</Link>
        </Button>
      </div>

      {credits && (credits.pdf > 0 || credits.ai > 0 || credits.screening > 0) && (
        <p className="rounded-lg border border-border bg-secondary/40 p-3 text-sm">
          {t("shop.yourCredits", { pdf: num(credits.pdf), ai: num(credits.ai), screening: num(credits.screening) })}
        </p>
      )}

      {isLoading && <Skeleton className="h-40 w-full" />}

      {groups
        .filter((group) => group.items.length)
        .map((group) => (
          <section key={group.id} className="space-y-3" aria-labelledby={`shop-${group.id}`}>
            <h2 id={`shop-${group.id}`} className="text-lg font-semibold">
              {group.title}
            </h2>
            {group.id === "employers" && (
              <p className="text-sm text-muted">
                {t("shop.employersText")}{" "}
                <Link to="/dashboard/screening" className="text-primary hover:underline">
                  {t("shop.openScreening")}
                </Link>
              </p>
            )}
            <div className="grid gap-4">
              {group.items.map((product) => {
                const Icon = ICONS[product.kind];
                const open = selected === product.slug;
                const service = product.kind === "service";
                return (
                  <Card key={product.slug} className={open ? "border-primary" : undefined}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                          <div>
                            <CardTitle className="text-base">{product.name}</CardTitle>
                            <p className="mt-1 text-sm text-muted">{product.description}</p>
                            {detail(product) && <p className="mt-1 text-xs text-muted">{detail(product)}</p>}
                          </div>
                        </div>
                        <p className="shrink-0 text-xl font-bold">{formatCurrency(product.price)}</p>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {!open ? (
                        <Button
                          variant={service ? "outline" : "gradient"}
                          onClick={() => {
                            setSelected(product.slug);
                            setNotes("");
                            setResumeId("");
                          }}
                        >
                          {t("shop.buy")}
                        </Button>
                      ) : (
                        <>
                          {service && (
                            <div className="space-y-3">
                              <label className="block text-sm font-medium" htmlFor={`notes-${product.slug}`}>
                                {t("shop.notesLabel")}
                              </label>
                              <textarea
                                id={`notes-${product.slug}`}
                                value={notes}
                                onChange={(event) => setNotes(event.target.value)}
                                placeholder={t("shop.notesPlaceholder")}
                                rows={4}
                                maxLength={4000}
                                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:text-sm"
                              />
                              <label className="block text-sm font-medium" htmlFor={`cv-${product.slug}`}>
                                {t("shop.resumeLabel")}
                              </label>
                              <select
                                id={`cv-${product.slug}`}
                                value={resumeId}
                                onChange={(event) => setResumeId(event.target.value)}
                                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-base sm:text-sm"
                              >
                                <option value="">{t("shop.noResume")}</option>
                                {resumes?.map((resume) => (
                                  <option key={resume._id} value={resume._id}>
                                    {resume.title}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                          <CheckoutPanel
                            item={{ productSlug: product.slug, orderNotes: notes || undefined, resumeId: resumeId || undefined, label: product.name, amount: product.price }}
                            disabled={service && !notes.trim() && !resumeId}
                            onSubmitted={() => setSelected(null)}
                          />
                          <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>
                            {t("common.cancel")}
                          </Button>
                        </>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        ))}
    </div>
  );
}
