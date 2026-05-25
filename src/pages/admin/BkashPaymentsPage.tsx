import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CreditCard, ShieldCheck, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SkeletonTable } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import api from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

interface BkashConfig {
  _id: string;
  number: string;
  instructions: string;
}

interface BkashPayment {
  _id: string;
  userId: { _id: string; name: string; email: string };
  planSlug: string;
  billingCycle: "monthly" | "yearly";
  amount: number;
  status: "pending" | "completed" | "failed" | "cancelled" | "refunded";
  transactionId: string;
  createdAt: string;
  providerData?: {
    submittedBkashNumber?: string;
    reviewNotes?: string;
    reviewedAt?: string;
    reviewedBy?: string;
  };
}

const statusOptions = ["all", "pending", "completed", "failed"];

export default function BkashPaymentsPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState("all");
  const [number, setNumber] = useState("");
  const [instructions, setInstructions] = useState("");
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  const { data: bkashConfig, isLoading: configLoading } = useQuery({
    queryKey: ["admin-bkash-config"],
    queryFn: async () => {
      const { data } = await api.get("/admin/bkash/config");
      return data.data as BkashConfig | null;
    },
  });

  const { data: paymentsData, isLoading: paymentsLoading } = useQuery({
    queryKey: ["admin-bkash-payments", status],
    queryFn: async () => {
      const { data } = await api.get(`/admin/bkash/payments${status === "all" ? "" : `?status=${status}`}`);
      return data.data as { payments: BkashPayment[] };
    },
  });

  useEffect(() => {
    if (bkashConfig) {
      setNumber(bkashConfig.number || "");
      setInstructions(bkashConfig.instructions || "");
    }
  }, [bkashConfig]);

  const saveConfigMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.put("/admin/bkash/config", { number, instructions });
      return data.data as BkashConfig;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bkash-config"] });
      toast.add("BKash number updated", "success");
    },
    onError: () => {
      toast.add("Failed to update BKash number", "error");
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ paymentId, action }: { paymentId: string; action: "completed" | "failed" }) => {
      const { data } = await api.patch(`/admin/bkash/payments/${paymentId}`, {
        status: action,
        reviewNotes: reviewNotes[paymentId] || "",
      });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bkash-payments"] });
      toast.add("Review submitted", "success");
    },
    onError: () => {
      toast.add("Failed to update payment review", "error");
    },
  });

  const pendingCount = useMemo(() => {
    return paymentsData?.payments.filter((payment) => payment.status === "pending").length || 0;
  }, [paymentsData]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">BKash Payments</h1>
        <p className="text-muted">Configure the BKash number users must send to and review manual payments.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current BKash Number</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {configLoading ? (
            <div className="space-y-3">
              <SkeletonTable rows={2} cols={2} />
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">BKash Number</label>
                  <Input
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    placeholder="01xxxxxxxxx"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Instructions for users</label>
                  <Input
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder="Send the payment and include the transaction ID in the form."
                  />
                </div>
              </div>
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-muted">
                  Users will see this BKash number on the Billing page. Keep the number updated when your account changes.
                </p>
                <Button onClick={() => saveConfigMutation.mutate()} disabled={saveConfigMutation.isPending}>
                  Save BKash Settings
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="grid sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CreditCard className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted">Pending BKash submissions</p>
                <p className="text-2xl font-bold">{pendingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-8 w-8 text-emerald-500" />
              <div>
                <p className="text-sm text-muted">Review active customers</p>
                <p className="text-2xl font-bold">{paymentsData?.payments.filter((payment) => payment.status === "completed").length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>Manual BKash Submissions</CardTitle>
          <select
            className="h-10 rounded-lg border border-border bg-background px-3 py-2 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {option === "all" ? "All statuses" : option.charAt(0).toUpperCase() + option.slice(1)}
              </option>
            ))}
          </select>
        </CardHeader>
        <CardContent>
          {paymentsLoading ? (
            <SkeletonTable rows={6} cols={6} />
          ) : paymentsData?.payments.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2">User</th>
                    <th className="text-left py-3 px-2">Amount</th>
                    <th className="text-left py-3 px-2">Sent To</th>
                    <th className="text-left py-3 px-2">Transaction ID</th>
                    <th className="text-left py-3 px-2">Status</th>
                    <th className="text-left py-3 px-2">Review Notes</th>
                    <th className="text-left py-3 px-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentsData.payments.map((payment) => (
                    <tr key={payment._id} className="border-b border-border hover:bg-secondary/50">
                      <td className="py-3 px-2">
                        <div className="font-medium">{payment.userId.name}</div>
                        <div className="text-muted text-xs">{payment.userId.email}</div>
                      </td>
                      <td className="py-3 px-2">{formatCurrency(payment.amount)}</td>
                      <td className="py-3 px-2">{payment.providerData?.submittedBkashNumber || "—"}</td>
                      <td className="py-3 px-2">{payment.transactionId}</td>
                      <td className="py-3 px-2">
                        <span
                          className={`rounded-full px-2 py-1 text-xs capitalize ${
                            payment.status === "completed"
                              ? "bg-emerald-100 text-emerald-800"
                              : payment.status === "failed"
                                ? "bg-red-100 text-red-800"
                                : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {payment.status}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <div className="space-y-2">
                          <textarea
                            className="min-h-20 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                            placeholder="Add review notes"
                            value={reviewNotes[payment._id] || payment.providerData?.reviewNotes || ""}
                            onChange={(e) =>
                              setReviewNotes((prev) => ({
                                ...prev,
                                [payment._id]: e.target.value,
                              }))
                            }
                          />
                          {payment.providerData?.reviewedAt && (
                            <p className="text-xs text-muted">
                              Reviewed on {new Date(payment.providerData.reviewedAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            onClick={() => reviewMutation.mutate({ paymentId: payment._id, action: "completed" })}
                            disabled={reviewMutation.isPending}
                          >
                            <ShieldCheck className="mr-1 h-3 w-3" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => reviewMutation.mutate({ paymentId: payment._id, action: "failed" })}
                            disabled={reviewMutation.isPending}
                          >
                            <XCircle className="mr-1 h-3 w-3" />
                            Decline
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="py-8 text-center text-muted">No BKash payments found yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
