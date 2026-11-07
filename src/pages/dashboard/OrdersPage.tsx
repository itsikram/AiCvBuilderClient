import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import type { Order } from "@/types";

const TONE: Record<Order["status"], "secondary" | "success" | "outline" | "default"> = {
  awaiting_payment: "outline",
  paid: "default",
  in_progress: "default",
  delivered: "success",
  cancelled: "secondary",
};

/** The user's extras: payment review, delivery status and the delivered work. */
export default function OrdersPage() {
  const { t, i18n } = useTranslation();
  const { data: orders, isLoading } = useQuery({
    queryKey: ["my-orders"],
    queryFn: async () => (await api.get("/payments/orders")).data.data as Order[],
  });
  const date = (iso: string) => new Date(iso).toLocaleDateString(i18n.language === "bn" ? "bn-BD" : undefined);

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t("orders.title")}</h1>
          <p className="text-muted">{t("orders.subtitle")}</p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/dashboard/shop">{t("orders.shop")}</Link>
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-32 w-full" />
      ) : !orders?.length ? (
        <p className="py-10 text-center text-muted">{t("orders.empty")}</p>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Card key={order._id}>
              <CardContent className="space-y-2 pt-6">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{order.product.name}</p>
                    <p className="text-sm text-muted">
                      {formatCurrency(order.amount)} · {date(order.createdAt)}
                    </p>
                  </div>
                  <Badge variant={TONE[order.status]}>{t(`orders.status.${order.status}`)}</Badge>
                </div>
                {order.status === "awaiting_payment" && <p className="text-sm text-muted">{t("orders.awaitingHelp")}</p>}
                {order.notes && <p className="text-sm text-muted">“{order.notes}”</p>}
                {order.status === "delivered" && order.deliveryMessage && (
                  <div className="rounded-lg bg-secondary/50 p-3">
                    <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted">{t("orders.delivery")}</p>
                    <p className="whitespace-pre-wrap break-words text-sm">{order.deliveryMessage}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
