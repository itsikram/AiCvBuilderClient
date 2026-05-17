import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SEO } from "@/components/seo/SEO";
import api from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import type { SubscriptionPlan } from "@/types";

export default function PricingPage() {
  const { t } = useTranslation();
  const [yearly, setYearly] = useState(false);

  const { data: plans } = useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      const { data } = await api.get("/payments/plans");
      return data.data as SubscriptionPlan[];
    },
  });

  return (
    <>
      <SEO title="Pricing" description="Affordable resume builder plans for Bangladesh" />
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">{t("pricing.title")}</h1>
            <p className="text-muted text-lg">{t("pricing.subtitle")}</p>
            <div className="flex items-center justify-center gap-3 mt-6">
              <span className={!yearly ? "font-medium" : "text-muted"}>{t("pricing.monthly")}</span>
              <button
                type="button"
                onClick={() => setYearly(!yearly)}
                className={`relative w-12 h-6 rounded-full transition-colors ${yearly ? "bg-primary" : "bg-secondary"}`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${yearly ? "left-7" : "left-1"}`}
                />
              </button>
              <span className={yearly ? "font-medium" : "text-muted"}>
                {t("pricing.yearly")} <Badge variant="success" className="ml-1">Save 17%</Badge>
              </span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {plans?.map((plan) => (
              <Card
                key={plan.slug}
                className={plan.slug === "premium" ? "border-primary shadow-lg md:scale-105" : ""}
              >
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <p className="text-4xl font-bold mt-4">
                    {formatCurrency(yearly ? plan.priceYearly : plan.priceMonthly)}
                    <span className="text-sm font-normal text-muted">
                      {yearly ? t("pricing.perYear") : t("pricing.perMonth")}
                    </span>
                  </p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant={plan.slug === "premium" ? "gradient" : "outline"}
                    className="w-full"
                    asChild
                  >
                    <Link to={plan.slug === "free" ? "/register" : "/dashboard/billing"}>
                      {plan.slug === "free" ? t("pricing.getStarted") : t("pricing.upgrade")}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="text-center text-sm text-muted mt-12">
            Pay with bKash, Nagad, SSLCommerz, or any Bangladeshi card
          </p>
        </div>
      </section>
    </>
  );
}
