import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Briefcase, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import api, { getErrorMessage } from "@/lib/api";
import { confirmAction } from "@/lib/confirm";
import { localNumber } from "@/lib/trial";
import { cn } from "@/lib/utils";

interface ScreeningSummary {
  _id: string;
  title: string;
  createdAt: string;
  candidates: number;
  deletesAt: string;
}
interface Candidate {
  _id: string;
  fileName: string;
  name: string | null;
  score: number;
  strengths: string[];
  gaps: string[];
  summary: string;
}
interface ScreeningDetail {
  _id: string;
  title: string;
  jobDescription: string;
  candidates: Candidate[];
}

const scoreTone = (score: number) =>
  score >= 75 ? "bg-green-600" : score >= 50 ? "bg-amber-500" : "bg-slate-400";

/** For employers: score candidate CVs against a job description and shortlist the best matches. */
export default function ScreeningPage() {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [openId, setOpenId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const num = (n: number) => localNumber(n, i18n.language);

  const list = useQuery({
    queryKey: ["screenings"],
    queryFn: async () => (await api.get("/screenings")).data.data as { credits: number; retentionDays: number; screenings: ScreeningSummary[] },
  });
  const detail = useQuery({
    queryKey: ["screening", openId],
    queryFn: async () => (await api.get(`/screenings/${openId}`)).data.data as ScreeningDetail,
    enabled: Boolean(openId),
  });

  const create = useMutation({
    mutationFn: async () => (await api.post("/screenings", { title, jobDescription })).data.data as { _id: string },
    onSuccess: (data) => {
      setTitle("");
      setJobDescription("");
      queryClient.invalidateQueries({ queryKey: ["screenings"] });
      setOpenId(data._id);
    },
    onError: (error) => toast.add(getErrorMessage(error, t("common.error")), "error"),
  });

  const remove = async (id: string) => {
    if (!(await confirmAction({ title: t("screening.deleteTitle"), text: t("screening.deleteText"), confirmLabel: t("common.delete"), destructive: true }))) return;
    await api.delete(`/screenings/${id}`).catch(() => undefined);
    if (openId === id) setOpenId(null);
    queryClient.invalidateQueries({ queryKey: ["screenings"] });
  };

  /** Scores the chosen files one after another, so credits and errors are clear per CV. */
  const upload = async (files: FileList | null) => {
    if (!files?.length || !openId) return;
    const queue = Array.from(files);
    setProgress({ done: 0, total: queue.length });
    for (const [index, file] of queue.entries()) {
      const form = new FormData();
      form.append("file", file);
      try {
        await api.post(`/screenings/${openId}/candidates`, form, { timeout: 120_000 });
      } catch (error) {
        toast.add(`${file.name}: ${getErrorMessage(error, t("common.error"))}`, "error");
        if ((error as { response?: { status?: number } }).response?.status === 402) break;
      }
      setProgress({ done: index + 1, total: queue.length });
      void detail.refetch();
    }
    setProgress(null);
    void list.refetch();
  };

  const credits = list.data?.credits ?? 0;

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t("screening.title")}</h1>
          <p className="text-muted">{t("screening.intro")}</p>
        </div>
        <div className="text-right">
          <p className="text-sm">{t("screening.credits", { n: num(credits) })}</p>
          <Link to="/dashboard/shop" className="text-sm text-primary hover:underline">
            {t("screening.buy")}
          </Link>
        </div>
      </div>
      <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
        {t("screening.fairness", { days: num(list.data?.retentionDays ?? 30) })}
      </p>

      {openId ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div className="min-w-0">
              <Button variant="ghost" size="sm" className="-ml-3 mb-1" onClick={() => setOpenId(null)}>
                <ArrowLeft className="h-4 w-4" />
                {t("screening.back")}
              </Button>
              <CardTitle className="truncate">{detail.data?.title ?? "…"}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <label
              className={cn(
                "flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border p-6 text-center hover:border-primary",
                (progress || !credits) && "pointer-events-none opacity-60"
              )}
            >
              <Upload className="h-6 w-6 text-primary" aria-hidden />
              <span className="font-medium">{progress ? t("screening.uploading", { done: num(progress.done), total: num(progress.total) }) : t("screening.upload")}</span>
              <span className="text-xs text-muted">{credits ? t("screening.uploadHelp") : t("screening.noCredits")}</span>
              <input
                type="file"
                multiple
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="sr-only"
                disabled={Boolean(progress) || !credits}
                onChange={(event) => {
                  void upload(event.target.files);
                  event.target.value = "";
                }}
              />
            </label>

            {detail.isLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : !detail.data?.candidates.length ? (
              <p className="py-6 text-center text-sm text-muted">{t("screening.noCandidates")}</p>
            ) : (
              <ol className="space-y-3">
                {detail.data.candidates.map((candidate, index) => (
                  <li key={candidate._id} className="rounded-xl border border-border p-4">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 w-6 shrink-0 text-sm font-semibold text-muted">{num(index + 1)}.</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="truncate font-semibold">{candidate.name || candidate.fileName}</p>
                          <span className="text-sm font-bold">{num(candidate.score)}%</span>
                        </div>
                        <div className="mt-1 h-2 overflow-hidden rounded-full bg-secondary" aria-hidden>
                          <div className={cn("h-full rounded-full", scoreTone(candidate.score))} style={{ width: `${candidate.score}%` }} />
                        </div>
                        <p className="mt-2 text-sm">{candidate.summary}</p>
                        <div className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
                          {candidate.strengths.length > 0 && (
                            <div>
                              <p className="text-xs font-medium uppercase tracking-wider text-green-700 dark:text-green-400">{t("screening.strengths")}</p>
                              <ul className="list-disc pl-4 text-muted">{candidate.strengths.map((item) => <li key={item}>{item}</li>)}</ul>
                            </div>
                          )}
                          {candidate.gaps.length > 0 && (
                            <div>
                              <p className="text-xs font-medium uppercase tracking-wider text-amber-700 dark:text-amber-400">{t("screening.gaps")}</p>
                              <ul className="list-disc pl-4 text-muted">{candidate.gaps.map((item) => <li key={item}>{item}</li>)}</ul>
                            </div>
                          )}
                        </div>
                        <p className="mt-2 text-xs text-muted">{candidate.fileName}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("screening.newTitle")}</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  create.mutate();
                }}
              >
                <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder={t("screening.jobTitle")} aria-label={t("screening.jobTitle")} required minLength={2} />
                <textarea
                  value={jobDescription}
                  onChange={(event) => setJobDescription(event.target.value)}
                  placeholder={t("screening.jdPlaceholder")}
                  aria-label={t("screening.jdPlaceholder")}
                  rows={6}
                  required
                  minLength={50}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:text-sm"
                />
                <Button type="submit" variant="gradient" disabled={create.isPending}>
                  <Briefcase className="h-4 w-4" />
                  {t("screening.create")}
                </Button>
              </form>
            </CardContent>
          </Card>

          {list.isLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : (
            list.data?.screenings.map((screening) => (
              <Card key={screening._id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
                  <button type="button" className="min-w-0 text-left" onClick={() => setOpenId(screening._id)}>
                    <p className="truncate font-semibold hover:text-primary">{screening.title}</p>
                    <p className="text-sm text-muted">
                      {t("screening.summary", {
                        n: num(screening.candidates),
                        date: new Date(screening.deletesAt).toLocaleDateString(i18n.language === "bn" ? "bn-BD" : undefined),
                      })}
                    </p>
                  </button>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setOpenId(screening._id)}>
                      {t("screening.open")}
                    </Button>
                    <Button variant="ghost" size="icon" aria-label={t("common.delete")} onClick={() => void remove(screening._id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </>
      )}
    </div>
  );
}
