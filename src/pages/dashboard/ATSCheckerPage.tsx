import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FileUp, Loader2, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { SelectField, TextAreaField } from "@/components/editor/fields";
import { ImportDialog } from "@/components/editor/ImportDialog";
import { QuotaNote } from "@/components/editor/ai";
import api, { getErrorMessage } from "@/lib/api";
import { AI_QUOTA_KEY } from "@/lib/ai";
import { normalizeLanguage } from "@/lib/language";
import { normalizeContent } from "@/lib/resume/model";
import { cn } from "@/lib/utils";
import type { Resume, ResumeContent } from "@/types";

interface ATSResult {
  score: number;
  grade: string;
  strengths: string[];
  weaknesses: string[];
  keywordAnalysis: { found: string[]; missing: string[] };
  recommendations: string[];
}

/** Plain-text CV for the checker (what an applicant tracking system would read). */
const cvText = (raw: ResumeContent) => {
  const c = normalizeContent(raw);
  const p = c.personalInfo;
  const list = (label: string, items: string[]) => (items.length ? `${label}: ${items.join(" | ")}` : "");
  return [
    [p.fullName, p.jobTitle].filter(Boolean).join(" - "),
    [p.email, p.phone, p.location].filter(Boolean).join(" | "),
    c.careerObjective && `Career Objective: ${c.careerObjective}`,
    p.summary && `Summary: ${p.summary}`,
    list("Experience", c.experience.map((e) => `${e.position} at ${e.company}: ${e.bullets.filter(Boolean).join("; ")}`)),
    list("Education", c.education.map((e) => [e.degree, e.field, e.institution, e.passingYear, e.gpa && `GPA ${e.gpa}`].filter(Boolean).join(", "))),
    list("Training", (c.trainings ?? []).map((x) => `${x.title}, ${x.institute}`)),
    list("Skills", c.skills.filter(Boolean)),
    list("Projects", c.projects.map((x) => `${x.name}: ${x.description}`)),
    list("Certifications", c.certifications.map((x) => x.name)),
    list("Languages", c.languages.map((x) => `${x.name} (${x.proficiency})`)),
  ]
    .filter(Boolean)
    .join("\n");
};

export default function ATSCheckerPage() {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [source, setSource] = useState<"saved" | "text">("saved");
  const [resumeId, setResumeId] = useState("");
  const [pasted, setPasted] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ATSResult | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const { data: resumes = [] } = useQuery({
    queryKey: ["resumes"],
    queryFn: async () => (await api.get("/resumes")).data.data as Resume[],
  });

  const selected = resumes.find((r) => r._id === resumeId);
  const text = source === "saved" ? (selected ? cvText(selected.content) : "") : pasted.trim();

  const check = async () => {
    if (text.length < 50) {
      toast.add(t("ats.tooShort"), "error");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post(
        "/resumes/ai/ats-check",
        { resumeText: text, jobDescription: jobDescription || undefined, language: normalizeLanguage(i18n.language) },
        { timeout: 120_000 }
      );
      setResult(data.data);
    } catch (error) {
      toast.add(getErrorMessage(error, t("ats.failed")), "error");
    } finally {
      setLoading(false);
      queryClient.invalidateQueries({ queryKey: AI_QUOTA_KEY });
    }
  };

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Target className="h-7 w-7 text-primary" aria-hidden />
          {t("ats.title")}
        </h1>
        <p className="mt-1 text-sm text-muted">{t("ats.intro")}</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-4 rounded-xl border bg-card p-4 sm:p-5" aria-label={t("ats.source")}>
          <div className="flex gap-1 rounded-lg bg-secondary p-1" role="tablist" aria-label={t("ats.source")}>
            {(["saved", "text"] as const).map((s) => (
              <button
                key={s}
                type="button"
                role="tab"
                aria-selected={source === s}
                onClick={() => setSource(s)}
                className={cn("flex-1 rounded-md px-3 py-2 text-sm font-medium", source === s ? "bg-background shadow-sm" : "text-muted")}
              >
                {t(`ats.sources.${s}`)}
              </button>
            ))}
          </div>

          {source === "saved" ? (
            <div className="space-y-2">
              <SelectField
                label={t("ats.chooseCv")}
                value={resumeId}
                onChange={setResumeId}
                options={[{ value: "", label: t("ats.chooseCvOption") }, ...resumes.map((r) => ({ value: r._id, label: r.title }))]}
              />
              <button type="button" className="flex items-center gap-1.5 text-sm text-primary underline underline-offset-2" onClick={() => setImportOpen(true)}>
                <FileUp className="h-4 w-4" /> {t("coverLetter.importCv")}
              </button>
            </div>
          ) : (
            <TextAreaField label={t("ats.cvText")} placeholder={t("ats.cvTextPlaceholder")} value={pasted} onChange={setPasted} rows={10} />
          )}

          <TextAreaField label={t("ats.jobPost")} hint={t("ats.jobPostHint")} placeholder={t("ai.tailor.placeholder")} value={jobDescription} onChange={setJobDescription} rows={6} />

          <div className="flex flex-wrap items-center gap-3">
            <Button variant="gradient" onClick={() => void check()} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Target className="h-4 w-4" />}
              {loading ? t("ai.working") : t("ats.run")}
            </Button>
            <QuotaNote />
          </div>
        </section>

        <section className="rounded-xl border bg-card p-4 sm:p-5" aria-labelledby="ats-results" aria-live="polite">
          <h2 id="ats-results" className="mb-4 font-semibold">
            {t("ats.results")}
          </h2>
          {result ? (
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="gradient-text text-5xl font-bold">{result.score}%</div>
                <Badge variant={result.score >= 80 ? "success" : "secondary"} className="px-3 text-lg">
                  {t("ats.grade", { grade: result.grade })}
                </Badge>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="mb-2 font-semibold text-green-700 dark:text-green-400">{t("ats.strengths")}</h3>
                  <ul className="list-inside list-disc space-y-1 text-sm">
                    {result.strengths.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="mb-2 font-semibold text-red-700 dark:text-red-400">{t("ats.weaknesses")}</h3>
                  <ul className="list-inside list-disc space-y-1 text-sm">
                    {result.weaknesses.map((w) => (
                      <li key={w}>{w}</li>
                    ))}
                  </ul>
                </div>
              </div>
              {result.keywordAnalysis.missing.length > 0 && (
                <div>
                  <h3 className="mb-2 font-semibold">{t("ai.tailor.missing")}</h3>
                  <div className="flex flex-wrap gap-2">
                    {result.keywordAnalysis.missing.map((k) => (
                      <Badge key={k} variant="outline">
                        {k}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <h3 className="mb-2 font-semibold">{t("ats.recommendations")}</h3>
                <ul className="list-inside list-disc space-y-1 text-sm">
                  {result.recommendations.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <p className="rounded-lg border border-dashed p-6 text-sm text-muted">{t("ats.empty")}</p>
          )}
        </section>
      </div>

      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImported={(r) => {
          queryClient.invalidateQueries({ queryKey: ["resumes"] });
          setSource("saved");
          setResumeId(r.resumeId);
        }}
      />
    </div>
  );
}
