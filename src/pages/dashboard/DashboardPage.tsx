import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Plus, FileText, Sparkles, Target, Mail, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";
import { requestsLeft, useAiQuota } from "@/lib/ai";
import { completeness, normalizeContent } from "@/lib/resume/model";
import { useAuthStore } from "@/store/authStore";
import type { Resume } from "@/types";
import { formatDate } from "@/lib/utils";

export default function DashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const quota = useAiQuota();

  const { data: resumes, isLoading } = useQuery({
    queryKey: ["resumes"],
    queryFn: async () => (await api.get("/resumes")).data.data as Resume[],
  });

  const isPremium = user?.subscription?.plan === "premium";
  const left = requestsLeft(quota.data);

  const quickActions = [
    { to: "/dashboard/resumes/new", icon: Plus, label: t("dashboard.createResume"), color: "bg-blue-600" },
    { to: "/dashboard/ats", icon: Target, label: t("dashboardNav.ats"), color: "bg-violet-600" },
    { to: "/dashboard/cover-letters", icon: Mail, label: t("dashboardNav.coverLetters"), color: "bg-green-700" },
    { to: "/dashboard/templates", icon: Sparkles, label: t("dashboardNav.templates"), color: "bg-orange-600" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">
            {t("dashboard.welcome")}, {user?.name?.split(" ")[0]}!
          </h1>
          <p className="text-muted">{t("dashboard.subtitle")}</p>
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
          <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
            <p className="text-sm">{t("dashboard.upgradePrompt")}</p>
            <Button variant="gradient" size="sm" asChild>
              <Link to="/dashboard/billing">{t("dashboardNav.upgrade")}</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <FileText className="mb-2 h-8 w-8 text-primary" aria-hidden />
            <p className="text-2xl font-bold">{resumes?.length ?? 0}</p>
            <p className="text-sm text-muted">{t("dashboard.cvCount")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <Sparkles className="mb-2 h-8 w-8 text-violet-600" aria-hidden />
            <p className="text-2xl font-bold">{left === null ? "∞" : left}</p>
            <p className="text-sm text-muted">{t("dashboard.aiLeftToday")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <TrendingUp className="mb-2 h-8 w-8 text-green-600" aria-hidden />
            <p className="text-2xl font-bold">{user?.referralCount ?? 0}</p>
            <p className="text-sm text-muted">{t("dashboard.referrals")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <Badge variant={isPremium ? "premium" : "secondary"} className="mb-2">
              {isPremium ? t("dashboardNav.premium") : t("dashboard.freePlan")}
            </Badge>
            <p className="text-sm text-muted">{t("dashboard.referralCode", { code: user?.referralCode ?? "" })}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {quickActions.map((action) => (
          <Link key={action.to} to={action.to} className="rounded-xl focus-visible:outline-2 focus-visible:outline-primary">
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardContent className="flex flex-col items-center justify-center py-6 text-center">
                <div className={`${action.color} mb-2 rounded-xl p-3 text-white`}>
                  <action.icon className="h-5 w-5" aria-hidden />
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
            <Link to="/dashboard/resumes">{t("dashboard.viewAll")}</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3" aria-busy="true">
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
                    className="flex items-center justify-between gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-secondary/50"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <FileText className="h-5 w-5 shrink-0 text-primary" aria-hidden />
                      <div className="min-w-0">
                        <p className="truncate font-medium">{resume.title}</p>
                        <p className="text-xs text-muted">{t("resumes.updated", { date: formatDate(resume.updatedAt) })}</p>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {t("editor.strength")} {completeness(normalizeContent(resume.content)).score}%
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="py-8 text-center">
              <FileText className="mx-auto mb-3 h-12 w-12 text-muted" aria-hidden />
              <p className="mb-4 text-muted">{t("resumes.emptyTitle")}</p>
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
