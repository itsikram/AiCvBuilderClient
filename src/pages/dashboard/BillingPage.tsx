import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { CreditCard, Smartphone, Send, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/editor/fields";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import api, { getErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/components/ui/toast";
import { formatCurrency } from "@/lib/utils";
import type { SubscriptionPlan } from "@/types";
import { daysLeft, localNumber, useStartTrial, useTrial } from "@/lib/trial";

interface BkashConfig {
  number: string;
  instructions: string;
}

export default function BillingPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuthStore();
  const toast = useToast();
  const trial = useTrial();
  const startTrial = useStartTrial();
  const [yearly, setYearly] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [provider, setProvider] = useState<"sslcommerz" | "bkash" | "nagad">("sslcommerz");
  const [bkashNumber, setBkashNumber] = useState("");
  const [transactionId, setTransactionId] = useState("");

  const { data: plans } = useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      const { data } = await api.get("/payments/plans");
      return data.data as SubscriptionPlan[];
    },
  });

  const { data: bkashConfig } = useQuery({
    queryKey: ["bkash-config"],
    queryFn: async () => {
      const { data } = await api.get("/payments/bkash/config");
      return data.data as BkashConfig | null;
    },
  });

  const premiumPlan = plans?.find((p) => p.slug === "premium");

  const payMutation = useMutation({
    mutationFn: async () => {
      const endpoint = provider === "sslcommerz" ? "/payments/sslcommerz" : "/payments/nagad";
      const { data } = await api.post(endpoint, {
        planSlug: "premium",
        billingCycle: yearly ? "yearly" : "monthly",
        couponCode: couponCode || undefined,
      });
      return data.data;
    },
    onSuccess: (data) => {
      if (data.gatewayUrl) {
        window.location.href = data.gatewayUrl;
      } else {
        toast.add(data.message || t("billing.initiated"), "info");
      }
    },
    onError: (error: unknown) => toast.add(getErrorMessage(error, t("billing.failed")), "error"),
  });

  const submitBkashMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post("/payments/bkash", {
        planSlug: "premium",
        billingCycle: yearly ? "yearly" : "monthly",
        couponCode: couponCode || undefined,
        bkashNumber,
        transactionId,
      });
      return data.data;
    },
    onSuccess: (data) => {
      toast.add(data.message || t("billing.bkashSubmitted"), "success");
      setBkashNumber("");
      setTransactionId("");
    },
    onError: (error: unknown) => {
      toast.add(getErrorMessage(error, t("billing.bkashFailed")), "error");
    },
  });

  const isPremium = user?.subscription?.plan === "premium";
  const onTrial = isPremium && user?.subscription?.status === "trial";
  const num = (value: number) => localNumber(value, i18n.language);
  const left = daysLeft(user?.subscription?.expiresAt);
  const trialDays = num(trial.data?.days ?? 0);

  const beginTrial = () =>
    startTrial.mutate(undefined, {
      onSuccess: () => toast.add(t("trial.started", { days: trialDays }), "success"),
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
              {onTrial && <p className="text-sm font-medium text-primary">{t("trial.daysLeft", { count: left, n: num(left) })}</p>}
            </div>
            <Badge variant={isPremium ? "premium" : "secondary"}>
              {t(`billing.status.${user?.subscription?.status || "active"}`, { defaultValue: user?.subscription?.status || "active" })}
            </Badge>
          </div>
          {user?.subscription?.expiresAt && (
            <p className="text-sm text-muted mt-2">
              {onTrial
                ? t("trial.endsOn", { date: new Date(user.subscription.expiresAt).toLocaleDateString(i18n.language === "bn" ? "bn-BD" : undefined) })
                : t("billing.expires", { date: new Date(user.subscription.expiresAt).toLocaleDateString() })}
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

      {(!isPremium || onTrial) && premiumPlan && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>{onTrial ? t("trial.keepTitle") : t("billing.upgradeTitle")}</CardTitle>
            <p className="text-3xl font-bold">
              {formatCurrency(yearly ? premiumPlan.priceYearly : premiumPlan.priceMonthly)}
              <span className="text-sm font-normal text-muted">
                {yearly ? t("pricing.perYear") : t("pricing.perMonth")}
              </span>
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="h-5 w-5 accent-primary" checked={yearly} onChange={(e) => setYearly(e.target.checked)} />
              <span className="text-sm">{t("billing.yearly")}</span>
            </label>

            <TextField label={t("billing.coupon")} placeholder="AICVBD20" value={couponCode} onChange={setCouponCode} autoCapitalize="characters" />

            <p className="text-sm font-medium" id="pay-method">{t("billing.method")}</p>
            <div className="grid grid-cols-3 gap-2">
              {(["sslcommerz", "bkash", "nagad"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  aria-pressed={provider === p}
                  onClick={() => setProvider(p)}
                  className={`p-3 rounded-lg border text-sm capitalize transition-colors ${
                    provider === p ? "border-primary bg-primary/10" : "border-border"
                  }`}
                >
                  {p === "sslcommerz" ? t("billing.card") : p === "bkash" ? "bKash" : "Nagad"}
                </button>
              ))}
            </div>

            {provider === "bkash" ? (
              <div className="rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-4 space-y-4">
                <div>
                  <p className="text-sm font-semibold">{t("billing.bkashTitle")}</p>
                  <p className="text-sm text-muted">{t("billing.bkashText")}</p>
                </div>

                <div className="rounded-xl bg-background/90 p-3 border border-border">
                  <p className="text-xs uppercase tracking-wider text-muted">{t("billing.bkashNumber")}</p>
                  <p className="mt-1 text-lg font-bold">{bkashConfig?.number || t("billing.bkashMissing")}</p>
                  {bkashConfig?.instructions && <p className="mt-2 text-sm text-muted">{bkashConfig.instructions}</p>}
                </div>

                <div className="grid gap-3">
                  <TextField label={t("billing.bkashFrom")} value={bkashNumber} onChange={setBkashNumber} placeholder="01xxxxxxxxx" type="tel" inputMode="tel" />
                  <TextField label={t("billing.trxId")} value={transactionId} onChange={setTransactionId} placeholder={t("billing.trxPlaceholder")} />
                </div>

                <Button
                  variant="gradient"
                  className="w-full"
                  onClick={() => submitBkashMutation.mutate()}
                  disabled={submitBkashMutation.isPending || !bkashConfig?.number}
                >
                  <Send className="h-4 w-4" />
                  {t("billing.submitReview")}
                </Button>
              </div>
            ) : (
              <Button
                variant="gradient"
                className="w-full"
                onClick={() => payMutation.mutate()}
                disabled={payMutation.isPending}
              >
                <CreditCard className="h-4 w-4" />
                {t("billing.payNow")}
              </Button>
            )}

            <p className="text-xs text-muted text-center flex items-center justify-center gap-1">
              <Smartphone className="h-3 w-3" />
              {t("billing.secure")}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
