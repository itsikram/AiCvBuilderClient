import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, FileText, DollarSign, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { useState } from "react";

export default function AdminDashboardPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: async () => {
      const { data } = await api.get("/admin/dashboard");
      return data.data;
    },
  });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data } = await api.get("/admin/users");
      return data.data;
    },
  });

  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const updateSubscriptionMutation = useMutation({
    mutationFn: async ({ userId, plan, expiresAt }: { userId: string; plan: string; expiresAt?: string }) => {
      const { data } = await api.patch(`/admin/users/${userId}/subscription`, { plan, expiresAt });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      setEditingUser(null);
      setSelectedPlan("");
      setExpiresAt("");
    },
  });

  const stats = [
    { label: "Total Users", value: data?.totalUsers ?? 0, icon: Users },
    { label: "Total Resumes", value: data?.totalResumes ?? 0, icon: FileText },
    { label: "Revenue (BDT)", value: formatCurrency(data?.totalRevenue ?? 0), icon: DollarSign },
    { label: "AI Requests", value: data?.stats?.totals?.totalAiRequests ?? 0, icon: TrendingUp },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              {isLoading ? (
                <Skeleton className="h-16" />
              ) : (
                <>
                  <stat.icon className="h-8 w-8 text-primary mb-2" />
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted">{stat.label}</p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2">Name</th>
                  <th className="text-left py-2">Email</th>
                  <th className="text-left py-2">Plan</th>
                  <th className="text-left py-2">Status</th>
                  <th className="text-left py-2">Expires</th>
                  <th className="text-left py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {usersLoading ? (
                  <tr><td colSpan={6} className="py-4 text-center">Loading...</td></tr>
                ) : users?.users?.map((u: { _id: string; name: string; email: string; subscription: { plan: string; status: string; expiresAt?: string }; createdAt: string }) => (
                  <tr key={u._id} className="border-b border-border">
                    <td className="py-2">{u.name}</td>
                    <td className="py-2">{u.email}</td>
                    <td className="py-2 capitalize">{u.subscription?.plan}</td>
                    <td className="py-2 capitalize">{u.subscription?.status}</td>
                    <td className="py-2">{u.subscription?.expiresAt ? new Date(u.subscription.expiresAt).toLocaleDateString() : 'N/A'}</td>
                    <td className="py-2">
                      {editingUser === u._id ? (
                        <div className="flex gap-2">
                          <select
                            className="border rounded px-2 py-1 text-sm"
                            value={selectedPlan}
                            onChange={(e) => setSelectedPlan(e.target.value)}
                          >
                            <option value="free">Free</option>
                            <option value="premium">Premium</option>
                          </select>
                          <Input
                            type="date"
                            className="w-32 text-sm"
                            value={expiresAt}
                            onChange={(e) => setExpiresAt(e.target.value)}
                          />
                          <Button
                            size="sm"
                            onClick={() => updateSubscriptionMutation.mutate({ userId: u._id, plan: selectedPlan, expiresAt })}
                            disabled={!selectedPlan}
                          >
                            Save
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingUser(null)}>Cancel</Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => setEditingUser(u._id)}>
                          Change Plan
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
