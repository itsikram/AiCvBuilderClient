import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import api, { getErrorMessage } from "@/lib/api";

interface AccessCode {
  _id: string;
  code: string;
  label: string;
  premiumDays: number;
  maxUses: number;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
  createdBy?: string;
}

const EMPTY = { label: "", prefix: "", code: "", premiumDays: 30, maxUses: 100, expiresAt: "" };

/** Codes for universities, coaching centres and partners: each account redeems one for Premium days. */
export default function AdminAccessCodesPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY);
  // Taken once per visit: whether a code has expired doesn't need to update live
  const [now] = useState(() => Date.now());

  const { data: codes, isLoading } = useQuery({
    queryKey: ["admin-access-codes"],
    queryFn: async () => (await api.get("/admin/access-codes")).data.data as AccessCode[],
  });

  const create = useMutation({
    mutationFn: async () =>
      (
        await api.post("/admin/access-codes", {
          label: form.label,
          premiumDays: form.premiumDays,
          maxUses: form.maxUses,
          ...(form.code.trim() ? { code: form.code } : { prefix: form.prefix || undefined }),
          ...(form.expiresAt && { expiresAt: new Date(`${form.expiresAt}T23:59:59+06:00`).toISOString() }),
        })
      ).data.data as AccessCode,
    onSuccess: (code) => {
      setForm(EMPTY);
      queryClient.invalidateQueries({ queryKey: ["admin-access-codes"] });
      toast.add(`Code ${code.code} created`, "success");
    },
    onError: (error) => toast.add(getErrorMessage(error, "Couldn't create the code"), "error"),
  });

  const toggle = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => api.patch(`/admin/access-codes/${id}`, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-access-codes"] }),
    onError: (error) => toast.add(getErrorMessage(error, "Couldn't update the code"), "error"),
  });

  const copy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.add("Code copied", "success");
    } catch {
      /* clipboard blocked */
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Access codes</h1>
        <p className="text-muted">
          Give a university career club, coaching centre or partner one code for their members. Each account can use it once
          (Billing → "Have a code?") to get Premium for the days you set, until the uses run out or the end date passes. Charge the
          organisation separately, e.g. per student.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">New code</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-3 md:grid-cols-3"
            onSubmit={(event) => {
              event.preventDefault();
              create.mutate();
            }}
          >
            <div className="space-y-1 md:col-span-3">
              <Label htmlFor="code-label">Who it's for</Label>
              <Input id="code-label" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="e.g. DU Career Club, batch 2026" required minLength={2} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="code-prefix">Prefix (for a random code)</Label>
              <Input id="code-prefix" value={form.prefix} onChange={(e) => setForm({ ...form, prefix: e.target.value })} placeholder="DU" maxLength={10} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="code-own">Or your own code</Label>
              <Input id="code-own" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="DU-CAREER-2026" maxLength={40} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="code-days">Premium days</Label>
              <Input id="code-days" type="number" min="1" value={form.premiumDays} onChange={(e) => setForm({ ...form, premiumDays: Number(e.target.value) })} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="code-uses">Max accounts</Label>
              <Input id="code-uses" type="number" min="1" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: Number(e.target.value) })} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="code-expires">Last day (optional)</Label>
              <Input id="code-expires" type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={create.isPending}>
                Create code
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {isLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : !codes?.length ? (
        <p className="py-6 text-center text-muted">No codes yet.</p>
      ) : (
        <div className="space-y-3">
          {codes.map((code) => {
            const expired = code.expiresAt && new Date(code.expiresAt).getTime() < now;
            const usedUp = code.usedCount >= code.maxUses;
            return (
              <Card key={code._id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <button type="button" className="inline-flex items-center gap-1 font-mono text-lg font-bold hover:text-primary" onClick={() => void copy(code.code)} title="Copy code">
                        {code.code}
                        <Copy className="h-4 w-4" />
                      </button>
                      {expired ? <Badge variant="secondary">Expired</Badge> : usedUp ? <Badge variant="secondary">Used up</Badge> : !code.isActive && <Badge variant="secondary">Off</Badge>}
                    </div>
                    <p className="text-sm text-muted">
                      {code.label} · {code.premiumDays} days · used {code.usedCount} of {code.maxUses}
                      {code.expiresAt && ` · until ${new Date(code.expiresAt).toLocaleDateString()}`}
                    </p>
                  </div>
                  <Switch checked={code.isActive} onCheckedChange={(checked) => toggle.mutate({ id: code._id, isActive: checked })} aria-label={`${code.code} active`} />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
