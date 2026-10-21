import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, FileText, FileUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { ImportDialog } from "@/components/editor/ImportDialog";
import api, { getErrorMessage } from "@/lib/api";
import { confirmAction } from "@/lib/confirm";
import { completeness, normalizeContent } from "@/lib/resume/model";
import { formatDate } from "@/lib/utils";
import type { Resume } from "@/types";

export default function ResumesPage() {
  const { t } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [importOpen, setImportOpen] = useState(false);

  const { data: resumes, isLoading } = useQuery({
    queryKey: ["resumes"],
    queryFn: async () => (await api.get("/resumes")).data.data as Resume[],
  });

  const onError = (error: unknown) => toast.add(getErrorMessage(error, t("common.error")), "error");

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/resumes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resumes"] });
      toast.add(t("resumes.deleted"), "success");
    },
    onError,
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: string) => api.post(`/resumes/${id}/duplicate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resumes"] });
      toast.add(t("resumes.duplicated"), "success");
    },
    onError,
  });

  const remove = async (resume: Resume) => {
    const ok = await confirmAction({
      title: t("resumes.deleteTitle"),
      text: t("resumes.deleteText", { title: resume.title }),
      confirmLabel: t("resumes.delete"),
      destructive: true,
    });
    if (ok) deleteMutation.mutate(resume._id);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{t("resumes.title")}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <FileUp className="h-4 w-4" />
            <span className="hidden sm:inline">{t("resumes.import")}</span>
          </Button>
          <Button variant="gradient" asChild>
            <Link to="/dashboard/resumes/new">
              <Plus className="h-4 w-4" />
              {t("resumes.new")}
            </Link>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-3" aria-busy="true">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : !resumes?.length ? (
        <div className="rounded-2xl border border-dashed bg-card p-8 text-center">
          <FileText className="mx-auto h-10 w-10 text-primary" aria-hidden />
          <h2 className="mt-3 text-lg font-semibold">{t("resumes.emptyTitle")}</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted">{t("resumes.emptyText")}</p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Button variant="gradient" asChild>
              <Link to="/dashboard/resumes/new">
                <Plus className="h-4 w-4" />
                {t("resumes.new")}
              </Link>
            </Button>
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <FileUp className="h-4 w-4" />
              {t("resumes.import")}
            </Button>
          </div>
        </div>
      ) : (
        <ul className="grid gap-3">
          {resumes.map((resume) => {
            const score = completeness(normalizeContent(resume.content)).score;
            return (
              <li key={resume._id} className="flex items-center gap-3 rounded-xl border bg-card p-3 sm:p-4">
                <Link to={`/dashboard/resumes/${resume._id}`} className="flex min-w-0 flex-1 items-center gap-3 rounded focus-visible:outline-2 focus-visible:outline-primary">
                  <FileText className="h-8 w-8 shrink-0 text-primary" aria-hidden />
                  <span className="min-w-0">
                    <span className="flex items-center gap-2">
                      <span className="truncate font-semibold">{resume.title}</span>
                      {resume.language === "bn" && <span className="rounded bg-secondary px-1.5 text-xs">{t("resumes.langBadge")}</span>}
                    </span>
                    <span className="block text-sm text-muted">
                      {t("resumes.updated", { date: formatDate(resume.updatedAt) })} · {t("editor.strength")} {score}%
                    </span>
                  </span>
                </Link>
                <Button variant="ghost" size="icon" onClick={() => duplicateMutation.mutate(resume._id)} disabled={duplicateMutation.isPending} aria-label={`${t("resumes.duplicate")}: ${resume.title}`}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-red-600" onClick={() => void remove(resume)} aria-label={`${t("resumes.delete")}: ${resume.title}`}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      <ImportDialog open={importOpen} onOpenChange={setImportOpen} onImported={(r) => navigate(`/dashboard/resumes/${r.resumeId}`)} />
    </div>
  );
}
