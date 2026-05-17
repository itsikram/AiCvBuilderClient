import { useQuery } from "@tanstack/react-query";
import { Users, FileText, DollarSign, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

export default function AdminDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: async () => {
      const { data } = await api.get("/admin/dashboard");
      return data.data;
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
          <CardTitle>Recent Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2">Name</th>
                  <th className="text-left py-2">Email</th>
                  <th className="text-left py-2">Plan</th>
                  <th className="text-left py-2">Joined</th>
                </tr>
              </thead>
              <tbody>
                {data?.recentUsers?.map((u: { _id: string; name: string; email: string; subscription: { plan: string }; createdAt: string }) => (
                  <tr key={u._id} className="border-b border-border">
                    <td className="py-2">{u.name}</td>
                    <td className="py-2">{u.email}</td>
                    <td className="py-2 capitalize">{u.subscription?.plan}</td>
                    <td className="py-2">{new Date(u.createdAt).toLocaleDateString()}</td>
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
