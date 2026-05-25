import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { CreditCard, Smartphone, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/components/ui/toast";
import { formatCurrency } from "@/lib/utils";
import type { SubscriptionPlan } from "@/types";

interface BkashConfig {
  number: string;
  instructions: string;
}

export default function BillingPage() {
  const { user } = useAuthStore();
  const toast = useToast();
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
        toast.add(data.message || "Payment initiated", "info");
      }
    },
    onError: () => toast.add("Payment failed", "error"),
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
      toast.add(data.message || "BKash payment submitted for review", "success");
      setBkashNumber("");
      setTransactionId("");
    },
    onError: (error: any) => {
      toast.add(error?.response?.data?.message || "Failed to submit BKash payment", "error");
    },
  });

  const isPremium = user?.subscription?.plan === "premium";

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Billing & Subscription</h1>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">Current Plan</p>
              <p className="text-xl font-bold capitalize">{user?.subscription?.plan || "free"}</p>
            </div>
            <Badge variant={isPremium ? "premium" : "secondary"}>
              {user?.subscription?.status || "active"}
            </Badge>
          </div>
          {user?.subscription?.expiresAt && (
            <p className="text-sm text-muted mt-2">
              Expires: {new Date(user.subscription.expiresAt).toLocaleDateString()}
            </p>
          )}
        </CardContent>
      </Card>

      {!isPremium && premiumPlan && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>Upgrade to Premium</CardTitle>
            <p className="text-3xl font-bold">
              {formatCurrency(yearly ? premiumPlan.priceYearly : premiumPlan.priceMonthly)}
              <span className="text-sm font-normal text-muted">
                /{yearly ? "year" : "month"}
              </span>
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={yearly} onChange={(e) => setYearly(e.target.checked)} />
              <span className="text-sm">Yearly billing (save 17%)</span>
            </label>

            <Input
              placeholder="Coupon code (e.g. CHAKRI20)"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
            />

            <p className="text-sm font-medium">Payment Method</p>
            <div className="grid grid-cols-3 gap-2">
              {(["sslcommerz", "bkash", "nagad"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setProvider(p)}
                  className={`p-3 rounded-lg border text-sm capitalize transition-colors ${
                    provider === p ? "border-primary bg-primary/10" : "border-border"
                  }`}
                >
                  {p === "sslcommerz" ? "Card/SSL" : p}
                </button>
              ))}
            </div>

            {provider === "bkash" ? (
              <div className="rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-4 space-y-4">
                <div>
                  <p className="text-sm font-semibold">Pay via BKash</p>
                  <p className="text-sm text-muted">Send your payment to the admin-configured BKash number and submit the details below for manual review.</p>
                </div>

                <div className="rounded-xl bg-background/90 p-3 border border-border">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted">BKash number</p>
                  <p className="mt-1 text-lg font-bold">{bkashConfig?.number || "Admin has not configured a BKash number yet"}</p>
                  {bkashConfig?.instructions && <p className="mt-2 text-sm text-muted">{bkashConfig.instructions}</p>}
                </div>

                <div className="grid gap-3">
                  <div>
                    <label className="text-sm font-medium">BKash Number You Sent To</label>
                    <Input
                      value={bkashNumber}
                      onChange={(e) => setBkashNumber(e.target.value)}
                      placeholder="01xxxxxxxxx"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Transaction ID</label>
                    <Input
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      placeholder="Enter your BKash transaction ID"
                    />
                  </div>
                </div>

                <Button
                  variant="gradient"
                  className="w-full"
                  onClick={() => submitBkashMutation.mutate()}
                  disabled={submitBkashMutation.isPending || !bkashConfig?.number}
                >
                  <Send className="h-4 w-4" />
                  Submit for Admin Review
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
                Pay Now
              </Button>
            )}

            <p className="text-xs text-muted text-center flex items-center justify-center gap-1">
              <Smartphone className="h-3 w-3" />
              Secure payments via Bangladesh payment gateways
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
