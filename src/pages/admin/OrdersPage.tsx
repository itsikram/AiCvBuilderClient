import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { ResumePreview } from "@/components/resume/ResumePreview";
import api, { getErrorMessage } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import type { Order, Resume } from "@/types";

type AdminOrder = Order & { payment?: { provider: string; transactionId: string; status: string } | null };

const FILTERS = [
  { value: "waiting", label: "To deliver" },
  { value: "awaiting_payment", label: "Awaiting payment" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "", label: "All" },
] as const;

const STATUS_LABEL: Record<Order["status"], string> = {
  awaiting_payment: "Awaiting payment",
  paid: "Paid, to do",
  in_progress: "In progress",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

/** Service orders to fulfil (credit products deliver themselves) and every order's status. */
export default function AdminOrdersPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["value"]>("waiting");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [previewId, setPreviewId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-orders", filter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filter && filter !== "waiting") params.set("status", filter);
      return (await api.get(`/admin/orders?${params}`)).data.data as { orders: AdminOrder[]; waiting: number };
    },
  });
  const orders = (data?.orders ?? []).filter((order) => filter !== "waiting" || order.status === "paid" || order.status === "in_progress");

  const preview = useQuery({
    queryKey: ["admin-order-resume", previewId],
    queryFn: async () => (await api.get(`/admin/orders/${previewId}/resume`)).data.data as Resume,
    enabled: Boolean(previewId),
    retry: false,
  });

  const update = useMutation({
    mutationFn: async ({ id, status, deliveryMessage }: { id: string; status?: string; deliveryMessage?: string }) =>
      (await api.patch(`/admin/orders/${id}`, { status, deliveryMessage })).data.data,
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.add(vars.status === "delivered" ? "Delivered; the customer has been emailed" : "Order updated", "success");
    },
    onError: (error) => toast.add(getErrorMessage(error, "Couldn't update the order"), "error"),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Orders</h1>
        <p className="text-muted">
          Extras customers bought. Credit packs are added automatically once the payment is approved; services wait here
          until you deliver them. Approve bKash payments in <Link to="/admin/bkash-payments" className="text-primary hover:underline">bKash payments</Link>.
        </p>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter orders">
        {FILTERS.map((option) => (
          <Button key={option.value} size="sm" variant={filter === option.value ? "default" : "outline"} onClick={() => setFilter(option.value)}>
            {option.label}
            {option.value === "waiting" && data?.waiting ? ` (${data.waiting})` : ""}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <Skeleton className="h-32 w-full" />
      ) : !orders.length ? (
        <p className="py-10 text-center text-muted">No orders here.</p>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const service = order.product.kind === "service";
            const open = order.status === "paid" || order.status === "in_progress";
            return (
              <Card key={order._id}>
                <CardContent className="space-y-3 pt-6">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold">{order.product.name}</p>
                      <p className="text-sm text-muted">
                        {order.user ? (
                          <Link to={`/admin/activity?userId=${order.user._id}`} className="text-primary hover:underline">
                            {order.user.name} ({order.user.email})
                          </Link>
                        ) : (
                          "Deleted user"
                        )}{" "}
                        · {formatCurrency(order.amount)} · {new Date(order.createdAt).toLocaleString()}
                        {order.payment && ` · ${order.payment.provider} ${order.payment.transactionId}`}
                      </p>
                    </div>
                    <Badge variant={order.status === "delivered" ? "success" : order.status === "cancelled" ? "secondary" : "outline"}>
                      {STATUS_LABEL[order.status]}
                    </Badge>
                  </div>
                  {order.notes && <p className="whitespace-pre-wrap rounded-lg bg-secondary/50 p-3 text-sm">{order.notes}</p>}
                  {order.resumeId && (
                    <Button variant="outline" size="sm" onClick={() => setPreviewId(order._id)}>
                      <Eye className="h-4 w-4" />
                      View their CV
                    </Button>
                  )}
                  {service && open && (
                    <div className="space-y-2">
                      <textarea
                        value={drafts[order._id] ?? order.deliveryMessage ?? ""}
                        onChange={(event) => setDrafts((prev) => ({ ...prev, [order._id]: event.target.value }))}
                        placeholder="Your feedback, or a link to the delivered files (Google Drive etc.). The customer is emailed this."
                        rows={5}
                        aria-label="Delivery message"
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:text-sm"
                      />
                      <div className="flex flex-wrap gap-2">
                        {order.status === "paid" && (
                          <Button variant="outline" size="sm" disabled={update.isPending} onClick={() => update.mutate({ id: order._id, status: "in_progress" })}>
                            Mark in progress
                          </Button>
                        )}
                        <Button
                          variant="gradient"
                          size="sm"
                          disabled={update.isPending || !(drafts[order._id] ?? order.deliveryMessage ?? "").trim()}
                          onClick={() => update.mutate({ id: order._id, status: "delivered", deliveryMessage: drafts[order._id] ?? order.deliveryMessage ?? "" })}
                        >
                          <Send className="h-4 w-4" />
                          Deliver and email customer
                        </Button>
                        <Button variant="ghost" size="sm" disabled={update.isPending} onClick={() => update.mutate({ id: order._id, status: "cancelled" })}>
                          Cancel order
                        </Button>
                      </div>
                    </div>
                  )}
                  {order.status === "delivered" && order.deliveryMessage && (
                    <p className="whitespace-pre-wrap text-sm text-muted">Delivered: {order.deliveryMessage}</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={Boolean(previewId)} onOpenChange={(open) => !open && setPreviewId(null)} title="Customer's CV" size="lg">
        {preview.isLoading ? (
          <Skeleton className="h-96 w-full" />
        ) : preview.isError || !preview.data ? (
          <p className="text-sm text-muted">{getErrorMessage(preview.error, "This CV isn't available.")}</p>
        ) : (
          <div className="max-h-[75vh] overflow-auto">
            <ResumePreview
              content={preview.data.content}
              templateId={preview.data.templateId}
              theme={preview.data.theme}
              sectionOrder={preview.data.sectionOrder}
              language={preview.data.language}
            />
          </div>
        )}
      </Dialog>
    </div>
  );
}
