import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Plus, FileText, Sparkles, Target, Mail, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import type { Resume } from "@/types";
import { formatDate } from "@/lib/utils";

export default function DashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuthStore();

  const { data: resumes, isLoading } = useQuery({
    queryKey: ["resumes"],
    queryFn: async () => {
      const { data } = await api.get("/resumes");
      return data.data as Resume[];
    },
  });

  const isPremium = user?.subscription?.plan === "premium";
  const aiUsed = user?.usage?.aiRequestsThisMonth ?? 0;

  const quickActions = [
    { to: "/dashboard/resumes/new", icon: Plus, label: t("dashboard.createResume"), color: "bg-blue-500" },
    { to: "/dashboard/ats", icon: Target, label: "ATS Checker", color: "bg-violet-500" },
    { to: "/dashboard/cover-letters", icon: Mail, label: "Cover Letters", color: "bg-green-500" },
    { to: "/dashboard/templates", icon: Sparkles, label: "Templates", color: "bg-orange-500" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t("dashboard.welcome")}, {user?.name?.split(" ")[0]}!</h1>
          <p className="text-muted">Manage your resumes and track your job search progress</p>
        </div>
        <Button variant="gradient" asChild>
          <Link to="/dashboard/resumes/new">
            <Plus className="h-4 w-4" />
            {t("dashboard.createResume")}
          </Link>
        </Button>
      </div>

      {!isPremium && (
        <Card className="border-primary/30 bg-gradient-to-r from-blue-50 to-violet-50 dark:from-blue-950/30 dark:to-violet-950/30">
          <CardContent className="flex items-center justify-between py-4">
            <p className="text-sm">{t("dashboard.upgradePrompt")}</p>
            <Button variant="gradient" size="sm" asChild>
              <Link to="/dashboard/billing">Upgrade</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <FileText className="h-8 w-8 text-primary mb-2" />
            <p className="text-2xl font-bold">{resumes?.length ?? 0}</p>
            <p className="text-sm text-muted">Resumes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <Sparkles className="h-8 w-8 text-violet-500 mb-2" />
            <p className="text-2xl font-bold">{aiUsed}</p>
            <p className="text-sm text-muted">{t("dashboard.aiUsage")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <TrendingUp className="h-8 w-8 text-green-500 mb-2" />
            <p className="text-2xl font-bold">{user?.referralCount ?? 0}</p>
            <p className="text-sm text-muted">Referrals</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <Badge variant={isPremium ? "premium" : "secondary"} className="mb-2">
              {isPremium ? "Premium" : "Free Plan"}
            </Badge>
            <p className="text-sm text-muted">Code: {user?.referralCode}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {quickActions.map((action) => (
          <Link key={action.to} to={action.to}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="flex flex-col items-center justify-center py-6 text-center">
                <div className={`${action.color} p-3 rounded-xl text-white mb-2`}>
                  <action.icon className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium">{action.label}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t("dashboard.myResumes")}</CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link to="/dashboard/resumes">View All</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : resumes?.length ? (
            <ul className="space-y-3">
              {resumes.slice(0, 5).map((resume) => (
                <li key={resume._id}>
                  <Link
                    to={`/dashboard/resumes/${resume._id}`}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">{resume.title}</p>
                        <p className="text-xs text-muted">Updated {formatDate(resume.updatedAt)}</p>
                      </div>
                    </div>
                    {resume.atsScore != null && (
                      <Badge variant="success">ATS {resume.atsScore}%</Badge>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted mx-auto mb-3" />
              <p className="text-muted mb-4">No resumes yet. Create your first one!</p>
              <Button variant="gradient" asChild>
                <Link to="/dashboard/resumes/new">{t("dashboard.createResume")}</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
