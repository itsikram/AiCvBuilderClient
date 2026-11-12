import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { CreditCard, Send, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/editor/fields";
import { useToast } from "@/components/ui/toast";
import api, { getErrorMessage } from "@/lib/api";
import { rememberCheckout, trackEvent, trackPurchase } from "@/lib/analytics";

/** What is being bought: a Premium pass, or a one-time product. */
export interface CheckoutItem {
  planSlug?: string;
  billingCycle?: "weekly" | "monthly" | "yearly";
  couponCode?: string;
  productSlug?: string;
  /** Services: what the customer needs, and the CV it is about */
  orderNotes?: string;
  resumeId?: string;
  /** For analytics: the item's name and price */
  label: string;
  amount: number;
}

interface BkashConfig {
  number: string;
  instructions: string;
}

/**
 * Payment method choice and the matching form: card or mobile banking through SSLCommerz,
 * Nagad, or a manual bKash payment the admin reviews. Used for passes and for extras.
 */
export function CheckoutPanel({ item, disabled, onSubmitted }: { item: CheckoutItem; disabled?: boolean; onSubmitted?: () => void }) {
  const { t } = useTranslation();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [provider, setProvider] = useState<"sslcommerz" | "bkash" | "nagad">("bkash");
  const [bkashNumber, setBkashNumber] = useState("");
  const [transactionId, setTransactionId] = useState("");

  const { data: bkashConfig } = useQuery({
    queryKey: ["bkash-config"],
    queryFn: async () => (await api.get("/payments/bkash/config")).data.data as BkashConfig | null,
  });

  const { label, amount, ...purchase } = item;
  const begin = () => trackEvent("begin_checkout", { currency: "BDT", value: amount, items: [{ item_name: label }], payment_type: provider });

  const payMutation = useMutation({
    mutationFn: async () => {
      begin();
      const endpoint = provider === "sslcommerz" ? "/payments/sslcommerz" : "/payments/nagad";
      return (await api.post(endpoint, purchase)).data.data as { gatewayUrl?: string; transactionId?: string; message?: string };
    },
    onSuccess: (data) => {
      if (data.gatewayUrl) {
        // The Google Ads Purchase conversion is sent when the gateway returns to the billing page
        if (data.transactionId) rememberCheckout(data.transactionId, amount);
        window.location.href = data.gatewayUrl;
      } else {
        toast.add(data.message || t("billing.initiated"), "info");
      }
    },
    onError: (error: unknown) => toast.add(getErrorMessage(error, t("billing.failed")), "error"),
  });

  const submitBkashMutation = useMutation({
    mutationFn: async () => {
      begin();
      return (await api.post("/payments/bkash", { ...purchase, bkashNumber, transactionId })).data.data as { message?: string; transactionId?: string; amount?: number };
    },
    onSuccess: (data) => {
      trackEvent("purchase_request", { currency: "BDT", value: amount, item_name: label, payment_type: "bkash" });
      // Counted when the bKash payment is submitted (an admin then checks the transaction ID)
      trackPurchase({ value: data.amount ?? amount, transactionId: data.transactionId || transactionId.trim() });
      toast.add(data.message || t("billing.bkashSubmitted"), "success");
      setBkashNumber("");
      setTransactionId("");
      queryClient.invalidateQueries({ queryKey: ["my-orders"] });
      onSubmitted?.();
    },
    onError: (error: unknown) => toast.add(getErrorMessage(error, t("billing.bkashFailed")), "error"),
  });

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium">{t("billing.method")}</p>
      <div className="grid grid-cols-3 gap-2" role="group" aria-label={t("billing.method")}>
        {(["bkash", "sslcommerz", "nagad"] as const).map((p) => (
          <button
            key={p}
            type="button"
            aria-pressed={provider === p}
            onClick={() => setProvider(p)}
            className={`rounded-lg border p-3 text-sm transition-colors ${provider === p ? "border-primary bg-primary/10" : "border-border"}`}
          >
            {p === "sslcommerz" ? t("billing.card") : p === "bkash" ? "bKash" : "Nagad"}
          </button>
        ))}
      </div>

      {provider === "bkash" ? (
        <div className="space-y-4 rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-4">
          <div>
            <p className="text-sm font-semibold">{t("billing.bkashTitle")}</p>
            <p className="text-sm text-muted">{t("billing.bkashText")}</p>
          </div>
          <div className="rounded-xl border border-border bg-background/90 p-3">
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
            disabled={disabled || submitBkashMutation.isPending || !bkashConfig?.number || !bkashNumber.trim() || !transactionId.trim()}
          >
            <Send className="h-4 w-4" />
            {t("billing.submitReview")}
          </Button>
        </div>
      ) : (
        <Button variant="gradient" className="w-full" onClick={() => payMutation.mutate()} disabled={disabled || payMutation.isPending}>
          <CreditCard className="h-4 w-4" />
          {t("billing.payNow")}
        </Button>
      )}

      <p className="flex items-center justify-center gap-1 text-center text-xs text-muted">
        <Smartphone className="h-3 w-3" />
        {t("billing.secure")}
      </p>
    </div>
  );
}
