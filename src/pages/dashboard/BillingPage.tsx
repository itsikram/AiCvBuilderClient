import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Gift, KeyRound, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TextField } from "@/components/editor/fields";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckoutPanel } from "@/components/billing/CheckoutPanel";
import api, { getErrorMessage } from "@/lib/api";
import { useAuthStore, type User } from "@/store/authStore";
import { useToast } from "@/components/ui/toast";
import { cn, formatCurrency } from "@/lib/utils";
import type { SubscriptionPlan } from "@/types";
import { daysLeft, localNumber, TRIAL_KEY, useStartTrial, useTrial } from "@/lib/trial";
import { trackEvent } from "@/lib/analytics";
import { useQueryClient } from "@tanstack/react-query";

type Cycle = "weekly" | "monthly" | "yearly";

export default function BillingPage() {
  const { t, i18n } = useTranslation();
  const { user, setUser } = useAuthStore();
  const toast = useToast();
  const queryClient = useQueryClient();
  const trial = useTrial();
  const startTrial = useStartTrial();
  const [cycle, setCycle] = useState<Cycle | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [code, setCode] = useState("");

  const { data: plans } = useQuery({
    queryKey: ["plans"],
    queryFn: async () => (await api.get("/payments/plans")).data.data as SubscriptionPlan[],
  });
  const premiumPlan = plans?.find((p) => p.slug === "premium");

  // Passes on offer; the 7-day one only when it has a price (Admin -> Plans)
  const passes = premiumPlan
    ? ([
        ...((premiumPlan.priceWeekly ?? 0) > 0 ? [{ cycle: "weekly" as const, price: premiumPlan.priceWeekly! }] : []),
        { cycle: "monthly" as const, price: premiumPlan.priceMonthly },
        { cycle: "yearly" as const, price: premiumPlan.priceYearly },
      ] satisfies Array<{ cycle: Cycle; price: number }>)
    : [];
  const selected = passes.find((pass) => pass.cycle === cycle) ?? passes[0];

  const redeem = useMutation({
    mutationFn: async () =>
      (await api.post("/payments/redeem", { code })).data as { message: string; data: { subscription: User["subscription"] } },
    onSuccess: ({ message, data }) => {
      setUser({ subscription: data.subscription });
      queryClient.invalidateQueries({ queryKey: TRIAL_KEY });
      trackEvent("code_redeem");
      toast.add(message, "success");
      setCode("");
    },
    onError: (error) => toast.add(getErrorMessage(error, t("billing.redeemFailed")), "error"),
  });

  const isPremium = user?.subscription?.plan === "premium";
  const onTrial = isPremium && user?.subscription?.status === "trial";
  const num = (value: number) => localNumber(value, i18n.language);
  const left = daysLeft(user?.subscription?.expiresAt);
  const trialDays = num(trial.data?.days ?? 0);
  const dateOf = (iso: string) => new Date(iso).toLocaleDateString(i18n.language === "bn" ? "bn-BD" : undefined);
  // Paid Premium with an end date can be extended early; days are added after the end date
  const canBuy = !isPremium || onTrial || Boolean(user?.subscription?.expiresAt);

  const beginTrial = () =>
    startTrial.mutate(undefined, {
      onSuccess: () => {
        trackEvent("trial_start");
        toast.add(t("trial.started", { days: trialDays }), "success");
      },
      onError: (error) => toast.add(getErrorMessage(error, t("trial.failed")), "error"),
    });

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">{t("billing.title")}</h1>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted">{t("billing.currentPlan")}</p>
              <p className="text-xl font-bold">
                {onTrial ? t("trial.active") : isPremium ? t("dashboardNav.premium") : t("dashboardNav.free")}
              </p>
              {isPremium && user?.subscription?.expiresAt && (
                <p className="text-sm font-medium text-primary">{t("trial.daysLeft", { count: left, n: num(left) })}</p>
              )}
            </div>
            <Badge variant={isPremium ? "premium" : "secondary"}>
              {t(`billing.status.${user?.subscription?.status || "active"}`, { defaultValue: user?.subscription?.status || "active" })}
            </Badge>
          </div>
          {user?.subscription?.expiresAt && (
            <p className="mt-2 text-sm text-muted">
              {onTrial ? t("trial.endsOn", { date: dateOf(user.subscription.expiresAt) }) : t("billing.endsOn", { date: dateOf(user.subscription.expiresAt) })}
            </p>
          )}
        </CardContent>
      </Card>

      {!isPremium && trial.data?.available && (
        <Card className="border-green-300 bg-green-50/60 dark:border-green-900 dark:bg-green-950/20">
          <CardContent className="space-y-3 pt-6">
            <div className="flex items-start gap-3">
              <Gift className="mt-0.5 h-6 w-6 shrink-0 text-green-700 dark:text-green-400" aria-hidden />
              <div>
                <h2 className="text-lg font-semibold">{t("trial.cardTitle", { days: trialDays })}</h2>
                <p className="mt-1 text-sm text-muted">{t("trial.cardText")}</p>
              </div>
            </div>
            <Button variant="gradient" className="w-full sm:w-auto" onClick={beginTrial} disabled={startTrial.isPending}>
              {startTrial.isPending ? t("trial.starting") : t("trial.start", { days: trialDays })}
            </Button>
            <p className="text-xs text-muted">{t("trial.noPayment")}</p>
          </CardContent>
        </Card>
      )}
      {!isPremium && trial.data?.reason === "unverified" && (trial.data.days ?? 0) > 0 && (
        <p className="rounded-lg border border-border p-3 text-sm text-muted">{t("trial.unverified")}</p>
      )}

      {canBuy && premiumPlan && selected && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>{onTrial ? t("trial.keepTitle") : isPremium ? t("billing.extendTitle") : t("billing.upgradeTitle")}</CardTitle>
            <p className="text-sm text-muted">{t("billing.passNote")}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label={t("billing.passTitle")}>
              {passes.map((pass) => {
                const active = pass.cycle === selected.cycle;
                return (
                  <button
                    key={pass.cycle}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setCycle(pass.cycle)}
                    className={cn(
                      "rounded-xl border p-3 text-left transition-colors",
                      active ? "border-primary bg-primary/10 ring-1 ring-primary" : "border-border hover:border-primary/50"
                    )}
                  >
                    <span className="block text-sm text-muted">{t(`billing.pass.${pass.cycle}`)}</span>
                    <span className="block text-2xl font-bold">{formatCurrency(pass.price)}</span>
                    {pass.cycle === "yearly" && <span className="text-xs font-medium text-green-700 dark:text-green-400">{t("pricing.save")}</span>}
                  </button>
                );
              })}
            </div>

            <TextField label={t("billing.coupon")} placeholder="AICVBD20" value={couponCode} onChange={setCouponCode} autoCapitalize="characters" />

            <CheckoutPanel
              item={{
                planSlug: "premium",
                billingCycle: selected.cycle,
                couponCode: couponCode.trim() || undefined,
                label: `Premium ${selected.cycle} pass`,
                amount: selected.price,
              }}
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="space-y-3 pt-6">
          <div className="flex items-start gap-3">
            <KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
            <div>
              <h2 className="font-semibold">{t("billing.redeemTitle")}</h2>
              <p className="text-sm text-muted">{t("billing.redeemText")}</p>
            </div>
          </div>
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (code.trim()) redeem.mutate();
            }}
          >
            <Input
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder={t("billing.redeemPlaceholder")}
              aria-label={t("billing.redeemTitle")}
              autoCapitalize="characters"
              className="min-w-0 flex-1 font-mono uppercase"
            />
            <Button type="submit" variant="outline" disabled={redeem.isPending || !code.trim()}>
              {t("billing.redeem")}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
          <div className="flex items-start gap-3">
            <ShoppingBag className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
            <div>
              <h2 className="font-semibold">{t("billing.extrasTitle")}</h2>
              <p className="text-sm text-muted">{t("billing.extrasText")}</p>
            </div>
          </div>
          <Button variant="outline" asChild>
            <Link to="/dashboard/shop">{t("billing.extrasLink")}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
