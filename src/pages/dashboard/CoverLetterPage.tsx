import { useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Download, FileUp, Loader2, Mail, Printer, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { SelectField, TextAreaField, TextField } from "@/components/editor/fields";
import { ImportDialog } from "@/components/editor/ImportDialog";
import { QuotaNote } from "@/components/editor/ai";
import api, { getErrorMessage } from "@/lib/api";
import { AI_QUOTA_KEY, TONES, type Tone } from "@/lib/ai";
import { confirmAction } from "@/lib/confirm";
import { PRINT_ROOT_ID, printResume } from "@/lib/resume/print";
import { formatDate } from "@/lib/utils";
import type { Resume } from "@/types";

interface CoverLetter {
  _id: string;
  title: string;
  companyName: string;
  jobTitle: string;
  content: string;
  language?: "en" | "bn";
  createdAt: string;
}

export default function CoverLetterPage() {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ companyName: "", jobTitle: "", jobDescription: "" });
  const [resumeId, setResumeId] = useState("");
  const [language, setLanguage] = useState<"en" | "bn">(i18n.language === "bn" ? "bn" : "en");
  const [tone, setTone] = useState<Tone>("formal");
  const [current, setCurrent] = useState<{ id?: string; text: string; title: string; language: "en" | "bn" } | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const letters = useQuery({
    queryKey: ["cover-letters"],
    queryFn: async () => (await api.get("/cover-letters")).data.data as CoverLetter[],
  });
  const resumes = useQuery({
    queryKey: ["resumes"],
    queryFn: async () => (await api.get("/resumes")).data.data as Resume[],
  });

  const generate = useMutation({
    mutationFn: async () => (await api.post("/cover-letters/generate", { ...form, resumeId: resumeId || undefined, language, tone }, { timeout: 120_000 })).data.data,
    onSuccess: (data: { letter: CoverLetter }) => {
      setCurrent({ id: data.letter._id, text: data.letter.content, title: data.letter.title, language });
      queryClient.invalidateQueries({ queryKey: ["cover-letters"] });
      toast.add(t("coverLetter.generated"), "success");
    },
    onError: (error) => toast.add(getErrorMessage(error, t("common.error")), "error"),
    onSettled: () => queryClient.invalidateQueries({ queryKey: AI_QUOTA_KEY }),
  });

  const remove = async (letter: CoverLetter) => {
    const ok = await confirmAction({ title: t("coverLetter.deleteTitle"), text: t("coverLetter.deleteText", { title: letter.title }), confirmLabel: t("common.delete"), destructive: true });
    if (!ok) return;
    try {
      await api.delete(`/cover-letters/${letter._id}`);
      if (current?.id === letter._id) setCurrent(null);
      queryClient.invalidateQueries({ queryKey: ["cover-letters"] });
      toast.add(t("coverLetter.deleted"), "success");
    } catch (error) {
      toast.add(getErrorMessage(error, t("common.error")), "error");
    }
  };

  const serverPdf = async (letter: { id?: string; title: string }) => {
    if (!letter.id) return;
    try {
      const res = await api.get(`/cover-letters/${letter.id}/export-pdf`, { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `${letter.title || "cover-letter"}.pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch (error) {
      toast.add(getErrorMessage(error, t("common.error")), "error");
    }
  };

  const canGenerate = form.companyName.trim() && form.jobTitle.trim() && form.jobDescription.trim().length >= 20;

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Mail className="h-7 w-7 text-primary" aria-hidden />
          {t("coverLetter.title")}
        </h1>
        <p className="mt-1 text-sm text-muted">{t("coverLetter.intro")}</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <form
          className="space-y-4 rounded-xl border bg-card p-4 sm:p-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (canGenerate) generate.mutate();
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField label={t("coverLetter.company")} value={form.companyName} onChange={(v) => setForm({ ...form, companyName: v })} required />
            <TextField label={t("coverLetter.jobTitle")} value={form.jobTitle} onChange={(v) => setForm({ ...form, jobTitle: v })} required />
          </div>
          <TextAreaField
            label={t("coverLetter.jobPost")}
            hint={t("coverLetter.jobPostHint")}
            placeholder={t("ai.tailor.placeholder")}
            value={form.jobDescription}
            onChange={(v) => setForm({ ...form, jobDescription: v })}
            rows={7}
          />
          <div className="grid gap-3 sm:grid-cols-3">
            <SelectField
              className="sm:col-span-3"
              label={t("coverLetter.cv")}
              hint={resumes.data?.length ? undefined : t("coverLetter.noCv")}
              value={resumeId}
              onChange={setResumeId}
              options={[{ value: "", label: t("coverLetter.noCvOption") }, ...(resumes.data ?? []).map((r) => ({ value: r._id, label: r.title }))]}
            />
            <SelectField
              label={t("coverLetter.language")}
              value={language}
              onChange={(v) => setLanguage(v as "en" | "bn")}
              options={[
                { value: "en", label: "English" },
                { value: "bn", label: "বাংলা" },
              ]}
            />
            <SelectField className="sm:col-span-2" label={t("ai.tone")} value={tone} onChange={(v) => setTone(v as Tone)} options={TONES.map((x) => ({ value: x, label: t(`ai.tones.${x}`) }))} />
          </div>
          <button type="button" className="flex items-center gap-1.5 text-sm text-primary underline underline-offset-2" onClick={() => setImportOpen(true)}>
            <FileUp className="h-4 w-4" /> {t("coverLetter.importCv")}
          </button>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" variant="gradient" disabled={!canGenerate || generate.isPending}>
              {generate.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              {generate.isPending ? t("ai.working") : t("coverLetter.generate")}
            </Button>
            <QuotaNote />
          </div>
        </form>

        <section className="space-y-3 rounded-xl border bg-card p-4 sm:p-5" aria-labelledby="letter-heading">
          <h2 id="letter-heading" className="font-semibold">
            {current?.title || t("coverLetter.result")}
          </h2>
          {current ? (
            <>
              <label htmlFor="letter-text" className="sr-only">
                {t("coverLetter.result")}
              </label>
              <textarea
                id="letter-text"
                className="min-h-[360px] w-full rounded-lg border bg-background p-3 text-base leading-7 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:text-sm"
                lang={current.language}
                value={current.text}
                onChange={(e) => setCurrent({ ...current, text: e.target.value })}
              />
              <p className="text-xs text-muted">{t("coverLetter.editHint")}</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={async () => {
                    await navigator.clipboard?.writeText(current.text).catch(() => undefined);
                    toast.add(t("coverLetter.copied"), "success");
                  }}
                >
                  <Copy className="h-4 w-4" /> {t("coverLetter.copy")}
                </Button>
                <Button type="button" variant="outline" onClick={() => void printResume(current.title)}>
                  <Printer className="h-4 w-4" /> {t("editor.download.button")}
                </Button>
              </div>
            </>
          ) : generate.isPending ? (
            <div className="space-y-2" aria-busy="true">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ) : (
            <p className="rounded-lg border border-dashed p-6 text-sm text-muted">{t("coverLetter.empty")}</p>
          )}
        </section>
      </div>

      <section className="rounded-xl border bg-card p-4 sm:p-5" aria-labelledby="saved-heading">
        <h2 id="saved-heading" className="mb-3 font-semibold">
          {t("coverLetter.saved")}
        </h2>
        {letters.isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
          </div>
        ) : letters.data?.length ? (
          <ul className="space-y-2">
            {letters.data.map((letter) => (
              <li key={letter._id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3">
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => setCurrent({ id: letter._id, text: letter.content, title: letter.title, language: letter.language === "bn" ? "bn" : "en" })}
                >
                  <span className="block truncate font-medium">{letter.title}</span>
                  <span className="text-xs text-muted">{formatDate(letter.createdAt)}</span>
                </button>
                <div className="flex gap-1">
                  {letter.language !== "bn" && (
                    <Button variant="ghost" size="icon" onClick={() => void serverPdf({ id: letter._id, title: letter.title })} aria-label={`${t("editor.download.button")}: ${letter.title}`}>
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="text-red-600" onClick={() => void remove(letter)} aria-label={`${t("common.delete")}: ${letter.title}`}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">{t("coverLetter.noneSaved")}</p>
        )}
      </section>

      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImported={(r) => {
          queryClient.invalidateQueries({ queryKey: ["resumes"] });
          setResumeId(r.resumeId);
        }}
      />

      {/* Print copy of the letter (Bangla-safe "Save as PDF") */}
      {current &&
        createPortal(
          <div id={PRINT_ROOT_ID} aria-hidden>
            <article className="cv-page cv-page--print whitespace-pre-wrap" lang={current.language} style={{ width: "210mm", padding: "22mm 22mm", fontFamily: '"Inter Variable", "Hind Siliguri", sans-serif', fontSize: "11pt", lineHeight: 1.6, color: "#111827" }}>
              {current.text}
            </article>
          </div>,
          document.body
        )}
    </div>
  );
}
