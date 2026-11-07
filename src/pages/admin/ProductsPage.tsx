import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import api, { getErrorMessage } from "@/lib/api";
import type { Product } from "@/types";

type AdminProduct = Product & { orderCount: number };
type Editable = Pick<Product, "name" | "description" | "price" | "quantity" | "validDays" | "deliveryDays" | "sortOrder" | "isActive">;

const KIND_LABEL: Record<Product["kind"], string> = {
  pdf_credits: "PDF credits",
  ai_credits: "AI requests",
  screening_credits: "CV screenings",
  service: "Service (you deliver it)",
};

const editable = (product: Product): Editable => ({
  name: product.name,
  description: product.description,
  price: product.price,
  quantity: product.quantity,
  validDays: product.validDays,
  deliveryDays: product.deliveryDays,
  sortOrder: product.sortOrder,
  isActive: product.isActive,
});

const NEW_PRODUCT = { slug: "", kind: "service" as Product["kind"], name: "", description: "", price: 0, quantity: 1, validDays: 0, deliveryDays: 3, sortOrder: 20, isActive: false };

/** One-time products: prices, what they give, and whether they're on sale. */
export default function AdminProductsPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [edits, setEdits] = useState<Record<string, Partial<Editable>>>({});
  const [draft, setDraft] = useState(NEW_PRODUCT);

  const { data: products, isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => (await api.get("/admin/products")).data.data as AdminProduct[],
  });

  const save = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Editable> }) => api.patch(`/admin/products/${id}`, data),
    onSuccess: (_r, vars) => {
      setEdits((prev) => {
        const next = { ...prev };
        delete next[vars.id];
        return next;
      });
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.add("Product saved", "success");
    },
    onError: (error) => toast.add(getErrorMessage(error, "Couldn't save"), "error"),
  });

  const create = useMutation({
    mutationFn: async () => api.post("/admin/products", draft),
    onSuccess: () => {
      setDraft(NEW_PRODUCT);
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.add("Product created (switched off until you turn it on)", "success");
    },
    onError: (error) => toast.add(getErrorMessage(error, "Couldn't create the product"), "error"),
  });

  const field = (product: AdminProduct, key: keyof Editable) => (edits[product._id]?.[key] ?? editable(product)[key]) as never;
  const change = (id: string, key: keyof Editable, value: unknown) => setEdits((prev) => ({ ...prev, [id]: { ...prev[id], [key]: value } }));
  const numberInput = (product: AdminProduct, key: keyof Editable, label: string, help?: string) => (
    <div className="space-y-1">
      <Label htmlFor={`${product._id}-${key}`}>{label}</Label>
      <Input id={`${product._id}-${key}`} type="number" min="0" value={field(product, key)} onChange={(e) => change(product._id, key, Number(e.target.value))} />
      {help && <p className="text-xs text-muted">{help}</p>}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Products</h1>
        <p className="text-muted">
          Extras sold once, shown in the dashboard's Extras page. Credit packs are delivered automatically when the payment is
          approved. Services need a person: switch one on only when someone can deliver it, then handle orders in Admin → Orders.
        </p>
      </div>

      {isLoading && <Skeleton className="h-40 w-full" />}
      {products?.map((product) => {
        const dirty = Boolean(edits[product._id] && Object.keys(edits[product._id]).length);
        return (
          <Card key={product._id} className={field(product, "isActive") ? undefined : "opacity-80"}>
            <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle className="text-base">{product.name}</CardTitle>
                <p className="font-mono text-xs text-muted">
                  {product.slug} · {KIND_LABEL[product.kind]} · {product.orderCount} order(s)
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={field(product, "isActive") ? "success" : "secondary"}>{field(product, "isActive") ? "On sale" : "Off"}</Badge>
                <Switch checked={field(product, "isActive")} onCheckedChange={(checked) => change(product._id, "isActive", checked)} aria-label={`${product.name} on sale`} />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor={`${product._id}-name`}>Name</Label>
                  <Input id={`${product._id}-name`} value={field(product, "name")} onChange={(e) => change(product._id, "name", e.target.value)} />
                </div>
                {numberInput(product, "price", "Price (BDT)")}
              </div>
              <div className="space-y-1">
                <Label htmlFor={`${product._id}-description`}>Description</Label>
                <textarea
                  id={`${product._id}-description`}
                  value={field(product, "description")}
                  onChange={(e) => change(product._id, "description", e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-base sm:text-sm"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {product.kind !== "service" && numberInput(product, "quantity", product.kind === "ai_credits" ? "AI requests per pack" : product.kind === "pdf_credits" ? "PDFs per pack" : "CVs per pack")}
                {product.kind === "ai_credits" && numberInput(product, "validDays", "Valid for (days)", "0: never expire")}
                {product.kind === "service" && numberInput(product, "deliveryDays", "Delivery (days)")}
                {numberInput(product, "sortOrder", "Display order")}
              </div>
              <Button size="sm" variant="gradient" disabled={!dirty || save.isPending} onClick={() => save.mutate({ id: product._id, data: edits[product._id] })}>
                <Save className="h-4 w-4" />
                Save
              </Button>
            </CardContent>
          </Card>
        );
      })}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">New product</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-3 md:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              create.mutate();
            }}
          >
            <div className="space-y-1">
              <Label htmlFor="new-slug">Slug (lowercase-with-dashes)</Label>
              <Input id="new-slug" value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} required pattern="[a-z0-9-]{2,80}" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="new-kind">Kind</Label>
              <select id="new-kind" value={draft.kind} onChange={(e) => setDraft({ ...draft, kind: e.target.value as Product["kind"] })} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-base sm:text-sm">
                {Object.entries(KIND_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="new-name">Name</Label>
              <Input id="new-name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} required minLength={2} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="new-price">Price (BDT)</Label>
              <Input id="new-price" type="number" min="0" value={draft.price} onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) })} required />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="new-description">Description</Label>
              <Input id="new-description" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="new-quantity">{draft.kind === "service" ? "Quantity (1 for services)" : "Credits per purchase"}</Label>
              <Input id="new-quantity" type="number" min="1" value={draft.quantity} onChange={(e) => setDraft({ ...draft, quantity: Number(e.target.value) })} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="new-days">{draft.kind === "service" ? "Delivery (days)" : "Valid for (days, AI packs; 0 = never expire)"}</Label>
              <Input
                id="new-days"
                type="number"
                min="0"
                value={draft.kind === "service" ? draft.deliveryDays : draft.validDays}
                onChange={(e) => setDraft(draft.kind === "service" ? { ...draft, deliveryDays: Number(e.target.value) } : { ...draft, validDays: Number(e.target.value) })}
              />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={create.isPending}>
                Create product
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
