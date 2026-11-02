import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Users, FileText, DollarSign, TrendingUp, Activity, ShoppingCart, CreditCard, Edit3, Palette } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

interface DashboardStats {
  totalUsers: number;
  totalResumes: number;
  totalRevenue: number;
  stats?: {
    totals?: {
      totalAiRequests: number;
    };
  };
  recentUsers?: Array<{
    _id: string;
    name: string;
    email: string;
    subscription: { plan: string; status: string };
    createdAt: string;
  }>;
  recentPayments?: Array<{
    _id: string;
    userId: { name: string; email: string };
    amount: number;
    status: string;
    paymentMethod: string;
    createdAt: string;
  }>;
}

const quickActions = [
  { to: "/admin/blog", title: "Manage blog", text: "Create and edit blog posts", icon: FileText },
  { to: "/admin/users", title: "Manage users", text: "View users and change plans", icon: Users },
  { to: "/admin/content-manager", title: "Page content", text: "Edit page content", icon: Edit3 },
  { to: "/admin/templates", title: "Templates", text: "Manage CV templates", icon: Palette },
];

export default function OverviewPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: async () => {
      const { data } = await api.get("/admin/dashboard");
      return data.data as DashboardStats;
    },
  });

  const stats = [
    { label: "Total Users", value: data?.totalUsers ?? 0, icon: Users, color: "text-blue-500" },
    { label: "Total Resumes", value: data?.totalResumes ?? 0, icon: FileText, color: "text-violet-500" },
    { label: "Total Revenue", value: formatCurrency(data?.totalRevenue ?? 0), icon: DollarSign, color: "text-green-500" },
    { label: "AI Requests", value: data?.stats?.totals?.totalAiRequests ?? 0, icon: TrendingUp, color: "text-orange-500" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard Overview</h1>
        <p className="text-muted">Platform statistics and recent activity</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              {isLoading ? (
                <Skeleton className="h-16" />
              ) : (
                <>
                  <div className={`h-10 w-10 rounded-lg bg-secondary flex items-center justify-center mb-3`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <p className="truncate text-xl font-bold sm:text-2xl">{stat.value}</p>
                  <p className="text-sm text-muted mt-1">{stat.label}</p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2 [&>*]:min-w-0">
        {/* Recent Users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Users</CardTitle>
            </div>
            <Activity className="h-5 w-5 text-muted" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : data?.recentUsers?.length ? (
              <div className="space-y-3">
                {data.recentUsers.map((user) => (
                  <div key={user._id} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="h-10 w-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{user.name}</p>
                        <p className="truncate text-sm text-muted">{user.email}</p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        user.subscription?.plan === "premium"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                      }`}>
                        {user.subscription?.plan}
                      </span>
                      <p className="text-xs text-muted mt-1">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted text-center py-8">No recent users</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Payments</CardTitle>
            </div>
            <CreditCard className="h-5 w-5 text-muted" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : data?.recentPayments?.length ? (
              <div className="space-y-3">
                {data.recentPayments.map((payment) => (
                  <div key={payment._id} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="h-10 w-10 shrink-0 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <ShoppingCart className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{payment.userId?.name || "Unknown User"}</p>
                        <p className="text-sm text-muted">{payment.paymentMethod}</p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-semibold text-green-600">{formatCurrency(payment.amount)}</p>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        payment.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}>
                        {payment.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted text-center py-8">No recent payments</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
            {quickActions.map((action) => (
              <Link
                key={action.to}
                to={action.to}
                className="rounded-lg border border-border p-4 transition-all hover:border-primary hover:bg-primary/5"
              >
                <action.icon className="mb-2 h-5 w-5 text-primary" />
                <p className="font-medium">{action.title}</p>
                <p className="text-sm text-muted">{action.text}</p>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}