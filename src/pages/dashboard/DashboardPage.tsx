import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Plus, FileText, FileUp, Pencil, Sparkles, Target, Mail, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ImportDialog } from "@/components/editor/ImportDialog";
import { StrengthBar } from "@/components/editor/StrengthBar";
import api from "@/lib/api";
import { requestsLeft, useAiQuota } from "@/lib/ai";
import { completeness, normalizeContent } from "@/lib/resume/model";
import { useAuthStore } from "@/store/authStore";
import type { Resume } from "@/types";
import { formatDate } from "@/lib/utils";

/** The most recently edited CV, its strength and the next thing to add */
function ContinueCard({ resume }: { resume: Resume }) {
  const { t } = useTranslation();
  const { score, items } = completeness(normalizeContent(resume.content));
  const next = items.find((i) => !i.done);
  return (
    <Card className="border-primary/30">
      <CardContent className="flex flex-col gap-4 pt-4 sm:flex-row sm:items-center sm:pt-6">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-muted">{t("dashboard.continueTitle")}</p>
          <p className="mt-0.5 truncate text-lg font-semibold">{resume.title}</p>
          <div className="mt-2 flex max-w-sm items-center gap-3">
            <StrengthBar score={score} className="flex-1" />
            <span className="text-sm font-semibold">{score}%</span>
          </div>
          <p className="mt-1.5 text-sm text-muted">{next ? t("editor.strengthNext", { item: t(`editor.checks.${next.key}`) }) : t("editor.strengthDone")}</p>
        </div>
        <Button variant="gradient" size="lg" className="shrink-0" asChild>
          <Link to={`/dashboard/resumes/${resume._id}`}>
            <Pencil className="h-4 w-4" />
            {t("dashboard.continueButton")}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

/** First visit: what making a CV involves, and the two ways to start */
function GetStarted({ onImport }: { onImport: () => void }) {
  const { t } = useTranslation();
  const steps = t("landing.steps", { returnObjects: true }) as Array<{ title: string; text: string }>;
  return (
    <Card className="border-primary/30">
      <CardContent className="pt-4 sm:pt-6">
        <h2 className="text-xl font-bold">{t("dashboard.startTitle")}</h2>
        <p className="mt-1 text-sm text-muted">{t("dashboard.startText")}</p>
        <ol className="mt-5 grid gap-3 md:grid-cols-3">
          {steps.map((step, i) => (
            <li key={step.title} className="flex gap-3 rounded-xl border bg-background p-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white" aria-hidden>
                {i + 1}
              </span>
              <span className="min-w-0">
                <span className="block font-semibold">{step.title}</span>
                <span className="mt-0.5 block text-sm text-muted">{step.text}</span>
              </span>
            </li>
          ))}
        </ol>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button variant="gradient" size="lg" asChild>
            <Link to="/dashboard/resumes/new">
              <Plus className="h-5 w-5" />
              {t("dashboard.startButton")}
            </Link>
          </Button>
          <Button variant="outline" size="lg" onClick={onImport}>
            <FileUp className="h-5 w-5" />
            {t("resumes.import")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const quota = useAiQuota();
  const navigate = useNavigate();
  const [importOpen, setImportOpen] = useState(false);

  const { data: resumes, isLoading } = useQuery({
    queryKey: ["resumes"],
    queryFn: async () => (await api.get("/resumes")).data.data as Resume[],
  });

  const latest = resumes?.reduce<Resume | undefined>((a, b) => (!a || new Date(b.updatedAt) > new Date(a.updatedAt) ? b : a), undefined);
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

      {isLoading ? <Skeleton className="h-36 w-full" /> : latest ? <ContinueCard resume={latest} /> : <GetStarted onImport={() => setImportOpen(true)} />}

      {!isPremium && (
        <Card className="border-primary/30 bg-gradient-to-r from-blue-50 to-violet-50 dark:from-blue-950/30 dark:to-violet-950/30">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4 sm:pb-4">
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
              <CardContent className="flex flex-col items-center justify-center py-6 text-center sm:pb-6">
                <div className={`${action.color} mb-2 rounded-xl p-3 text-white`}>
                  <action.icon className="h-5 w-5" aria-hidden />
                </div>
                <span className="text-sm font-medium">{action.label}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {(isLoading || !!resumes?.length) && (
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
            ) : null}
          </CardContent>
        </Card>
      )}

      <ImportDialog open={importOpen} onOpenChange={setImportOpen} onImported={(r) => navigate(`/dashboard/resumes/${r.resumeId}`)} />
    </div>
  );
}
