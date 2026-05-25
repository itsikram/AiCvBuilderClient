import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SkeletonTable } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import api from "@/lib/api";

export default function UsersPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data: usersData, isLoading } = useQuery({
    queryKey: ["admin-users", page, search],
    queryFn: async () => {
      const { data } = await api.get(`/admin/users?page=${page}&limit=20&search=${search}`);
      return data.data;
    },
  });

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
      toast.add("User subscription updated", "success");
    },
    onError: () => {
      toast.add("Failed to update subscription", "error");
    },
  });

  const handleSearch = () => {
    setPage(1);
    queryClient.invalidateQueries({ queryKey: ["admin-users"] });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="text-muted">View and manage all registered users</p>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="max-w-md"
            />
            <Button onClick={handleSearch}>Search</Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Users {usersData?.total ? `(${usersData.total} total)` : ""}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <SkeletonTable rows={10} cols={6} />
          ) : usersData?.users?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2">Name</th>
                    <th className="text-left py-3 px-2">Email</th>
                    <th className="text-left py-3 px-2">Plan</th>
                    <th className="text-left py-3 px-2">Status</th>
                    <th className="text-left py-3 px-2">Expires</th>
                    <th className="text-left py-3 px-2">Joined</th>
                    <th className="text-left py-3 px-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersData.users.map((u: { _id: string; name: string; email: string; subscription: { plan: string; status: string; expiresAt?: string }; createdAt: string }) => (
                    <tr key={u._id} className="border-b border-border hover:bg-secondary/50">
                      <td className="py-3 px-2 font-medium">{u.name}</td>
                      <td className="py-3 px-2 text-muted-foreground">{u.email}</td>
                      <td className="py-3 px-2 capitalize">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          u.subscription?.plan === "premium" 
                            ? "bg-yellow-100 text-yellow-800" 
                            : "bg-gray-100 text-gray-800"
                        }`}>
                          {u.subscription?.plan}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          u.subscription?.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}>
                          {u.subscription?.status}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        {u.subscription?.expiresAt 
                          ? new Date(u.subscription.expiresAt).toLocaleDateString() 
                          : "N/A"}
                      </td>
                      <td className="py-3 px-2 text-muted-foreground">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-2">
                        {editingUser === u._id ? (
                          <div className="flex gap-2 items-center">
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
                            <Button size="sm" variant="ghost" onClick={() => setEditingUser(null)}>
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => {
                            setEditingUser(u._id);
                            setSelectedPlan(u.subscription?.plan || "free");
                            setExpiresAt(u.subscription?.expiresAt ? new Date(u.subscription.expiresAt).toISOString().split('T')[0] : "");
                          }}>
                            Change Plan
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted text-center py-8">No users found.</p>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {usersData && usersData.pages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="flex items-center px-4 text-sm">
            Page {page} of {usersData.pages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage(p => Math.min(usersData.pages, p + 1))}
            disabled={page === usersData.pages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}