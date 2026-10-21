import { useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import axios from "axios";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CloudOff,
  Download,
  Eye,
  FileUp,
  Loader2,
  Pencil,
  Share2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { ResumePreview } from "@/components/resume/ResumePreview";
import { PrintableResume } from "@/components/resume/PrintableResume";
import { templateStyle } from "@/components/resume/templates";
import { useResumeDraft, type SaveStatus } from "@/components/editor/useResumeDraft";
import {
  DetailsSection,
  EducationSection,
  ExperienceSection,
  LanguagesSection,
  MoreSections,
  ObjectiveSection,
  PersonalSection,
  ReferencesSection,
  SkillsSection,
  TrainingSection,
} from "@/components/editor/sections";
import { SectionOrder } from "@/components/editor/SectionOrder";
import { DesignPanel } from "@/components/editor/DesignPanel";
import { AiToolsDialog, type AiTool } from "@/components/editor/AiToolsDialog";
import { ImportDialog } from "@/components/editor/ImportDialog";
import { DownloadDialog } from "@/components/editor/DownloadDialog";
import { EditorSection } from "@/components/editor/fields";
import api, { getErrorMessage } from "@/lib/api";
import { useAiQuota } from "@/lib/ai";
import { completeness, normalizeContent, sectionHasContent, SECTION_IDS, type CvLang } from "@/lib/resume/model";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import type { Resume, Template } from "@/types";

const STEPS = ["basics", "background", "finish"] as const;

export default function ResumeBuilderPage() {
  const { id } = useParams<{ id: string }>();
  if (!id || id === "new") return <NewCvStart />;
  // key: a fresh editor (and autosave state) for each CV
  return <EditorLoader key={id} id={id} />;
}

// ---------------------------------------------------------------------------
// New CV: pick a language and a starting format
// ---------------------------------------------------------------------------

function NewCvStart() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const [params] = useSearchParams();
  const fromTemplate = params.get("template");
  const [title, setTitle] = useState("");
  const [language, setLanguage] = useState<CvLang>(i18n.language === "bn" ? "bn" : "en");
  const [format, setFormat] = useState<"bd" | "ats">(fromTemplate && templateStyle(fromTemplate).layout !== "bd" ? "ats" : "bd");
  const [busy, setBusy] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const create = async () => {
    setBusy(true);
    try {
      const templateId = fromTemplate || (format === "bd" ? "professional-bd" : "modern-ats");
      const { data } = await api.post("/resumes", {
        title: title.trim() || t("editor.untitled"),
        templateId,
        language,
        format: format === "bd" ? "bangladeshi" : "ats",
      });
      navigate(`/dashboard/resumes/${data.data._id}`, { replace: true });
    } catch (error) {
      toast.add(getErrorMessage(error, t("common.error")), "error");
      setBusy(false);
    }
  };

  const option = (value: "bd" | "ats") => (
    <label
      className={cn(
        "flex cursor-pointer gap-3 rounded-xl border-2 p-4 transition focus-within:ring-2 focus-within:ring-primary",
        format === value ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
      )}
    >
      <input type="radio" name="format" className="mt-1 h-4 w-4 accent-primary" checked={format === value} onChange={() => setFormat(value)} />
      <span>
        <span className="block font-semibold">{t(`newCv.${value}Title`)}</span>
        <span className="block text-sm text-muted">{t(`newCv.${value}Text`)}</span>
      </span>
    </label>
  );

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("newCv.title")}</h1>
        <p className="mt-1 text-muted">{t("newCv.intro")}</p>
      </div>
      <form
        className="space-y-5 rounded-2xl border bg-card p-5"
        onSubmit={(e) => {
          e.preventDefault();
          void create();
        }}
      >
        <div>
          <label htmlFor="new-cv-title" className="mb-1 block text-sm font-medium">
            {t("newCv.name")}
          </label>
          <input
            id="new-cv-title"
            className="h-11 w-full rounded-lg border bg-background px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            placeholder={t("newCv.namePlaceholder")}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
          />
        </div>
        <fieldset>
          <legend className="mb-2 text-sm font-medium">{t("newCv.language")}</legend>
          <div className="grid grid-cols-2 gap-2">
            {(["en", "bn"] as const).map((lang) => (
              <label
                key={lang}
                className={cn(
                  "flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 p-3 font-medium focus-within:ring-2 focus-within:ring-primary",
                  language === lang ? "border-primary bg-primary/5" : "border-border"
                )}
              >
                <input type="radio" name="lang" className="sr-only" checked={language === lang} onChange={() => setLanguage(lang)} />
                {lang === "en" ? "English" : "বাংলা"}
              </label>
            ))}
          </div>
        </fieldset>
        {!fromTemplate && (
          <fieldset className="space-y-2">
            <legend className="mb-2 text-sm font-medium">{t("newCv.format")}</legend>
            {option("bd")}
            {option("ats")}
          </fieldset>
        )}
        <Button type="submit" variant="gradient" size="lg" className="w-full" disabled={busy}>
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" />}
          {busy ? t("newCv.creating") : t("newCv.create")}
        </Button>
      </form>
      <button type="button" className="mx-auto flex items-center gap-2 text-sm font-medium text-primary underline underline-offset-2" onClick={() => setImportOpen(true)}>
        <FileUp className="h-4 w-4" />
        {t("newCv.importInstead")}
      </button>
      <ImportDialog open={importOpen} onOpenChange={setImportOpen} onImported={(r) => navigate(`/dashboard/resumes/${r.resumeId}`, { replace: true })} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading
// ---------------------------------------------------------------------------

function EditorLoader({ id }: { id: string }) {
  const { t } = useTranslation();
  const query = useQuery({
    queryKey: ["resume", id],
    queryFn: async () => (await api.get(`/resumes/${id}`)).data.data as Resume,
    // The editor owns the state once loaded; refetching would not be applied anyway
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retry: (count, error) => !(axios.isAxiosError(error) && error.response?.status === 404) && count < 2,
  });

  if (query.isLoading) {
    return (
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]" aria-busy="true">
        <div className="space-y-4">
          <Skeleton className="h-12" />
          <Skeleton className="h-64" />
          <Skeleton className="h-48" />
        </div>
        <Skeleton className="hidden h-[640px] lg:block" />
      </div>
    );
  }
  if (query.isError || !query.data) {
    const notFound = axios.isAxiosError(query.error) && query.error.response?.status === 404;
    return (
      <div className="mx-auto max-w-md rounded-2xl border bg-card p-6 text-center">
        <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-amber-500" aria-hidden />
        <p className="font-medium">{notFound ? t("editor.notFound") : t("editor.loadFailed")}</p>
        <div className="mt-4 flex justify-center gap-2">
          {!notFound && <Button onClick={() => query.refetch()}>{t("common.retry")}</Button>}
          <Button variant="outline" asChild>
            <Link to="/dashboard/resumes">{t("editor.backToList")}</Link>
          </Button>
        </div>
      </div>
    );
  }
  return <Editor resume={query.data} />;
}

// ---------------------------------------------------------------------------
// Editor
// ---------------------------------------------------------------------------

function SaveIndicator({ status }: { status: SaveStatus }) {
  const { t } = useTranslation();
  const icon =
    status.kind === "saved" ? (
      <Check className="h-4 w-4 text-green-600" />
    ) : status.kind === "offline" ? (
      <CloudOff className="h-4 w-4 text-amber-600" />
    ) : status.kind === "rejected" || status.kind === "retrying" ? (
      <AlertTriangle className="h-4 w-4 text-red-600" />
    ) : (
      <Loader2 className="h-4 w-4 animate-spin text-muted" />
    );
  const text = status.kind === "rejected" ? t("editor.status.rejected", { message: status.message }) : t(`editor.status.${status.kind}`);
  return (
    <p className={cn("flex items-center gap-1.5 text-xs", status.kind === "rejected" ? "text-red-700" : "text-muted")} role="status" aria-live="polite">
      {icon}
      <span className="truncate">{text}</span>
    </p>
  );
}

function StrengthCard({ score, items, onJump, compact }: { score: number; items: ReturnType<typeof completeness>["items"]; onJump: (step: number) => void; compact?: boolean }) {
  const { t } = useTranslation();
  const todo = items.filter((i) => !i.done);
  const color = score >= 80 ? "bg-green-500" : score >= 50 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold">{t("editor.strength")}</p>
        <p className="text-sm font-bold">{score}%</p>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={score} aria-label={t("editor.strength")}>
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${score}%` }} />
      </div>
      {todo.length === 0 ? (
        <p className="mt-2 text-xs text-muted">{t("editor.strengthDone")}</p>
      ) : (
        !compact && (
          <>
            <p className="mt-3 text-xs text-muted">{t("editor.strengthHint")}</p>
            <ul className="mt-1.5 space-y-1">
              {todo.slice(0, 4).map((item) => (
                <li key={item.key}>
                  <button type="button" className="text-left text-sm text-primary hover:underline" onClick={() => onJump(item.step)}>
                    {t(`editor.checks.${item.key}`)}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )
      )}
    </div>
  );
}

function Editor({ resume }: { resume: Resume }) {
  const { t } = useTranslation();
  const toast = useToast();
  const user = useAuthStore((s) => s.user);
  const draft = useResumeDraft(resume);
  const { doc, update, setContent, status } = draft;
  const [step, setStep] = useState(0);
  const [view, setView] = useState<"edit" | "preview">("edit");
  const [showBreaks, setShowBreaks] = useState(false);
  const [dialog, setDialog] = useState<null | "ai" | "import" | "download">(null);
  const [aiTool, setAiTool] = useState<AiTool>("tailor");
  const top = useRef<HTMLDivElement>(null);
  const quota = useAiQuota();
  const { data: templates } = useQuery({
    queryKey: ["templates"],
    queryFn: async () => (await api.get("/templates")).data.data as Template[],
    staleTime: 5 * 60_000,
  });

  const strength = useMemo(() => completeness(doc.content), [doc.content]);
  const watermark = quota.data?.watermarkPdf ?? user?.subscription?.plan !== "premium";
  const hasContent = useMemo(() => SECTION_IDS.some((id) => id !== "languages" && id !== "personalDetails" && sectionHasContent(id, doc.content)), [doc.content]);
  const sectionProps = { content: doc.content, setContent, language: doc.language };

  const goTo = (next: number) => {
    setStep(next);
    setView("edit");
    requestAnimationFrame(() => top.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const chooseTemplate = (slug: string) => {
    const template = templates?.find((tpl) => tpl.slug === slug);
    if (template?.locked) return;
    // Colours come from the new template; fonts and sizes are kept
    update((d) => ({
      ...d,
      templateId: slug,
      theme: Object.fromEntries(Object.entries(d.theme).filter(([k]) => !["accentColor", "headingColor", "textColor"].includes(k) && !k.startsWith("gradient"))),
    }));
  };

  const share = async () => {
    try {
      const { data } = await api.post(`/resumes/${resume._id}/toggle-public`);
      if (data.data.isPublic && data.data.publicUrl) {
        await navigator.clipboard?.writeText(data.data.publicUrl).catch(() => undefined);
        toast.add(t("editor.share.public"), "success");
      } else {
        toast.add(t("editor.share.private"), "info");
      }
    } catch (error) {
      toast.add(getErrorMessage(error, t("common.error")), "error");
    }
  };

  const openAi = (tool: AiTool) => {
    setAiTool(tool);
    setDialog("ai");
  };

  const preview = (
    <ResumePreview content={doc.content} templateId={doc.templateId} theme={doc.theme} sectionOrder={doc.sectionOrder} language={doc.language} showPageBreaks={showBreaks} watermark={watermark} />
  );

  return (
    <div className="space-y-4 pb-24 lg:pb-0">
      {/* Toolbar */}
      <div ref={top} className="scroll-mt-4 flex flex-wrap items-center gap-2">
        <div className="min-w-0 flex-1 basis-56">
          <label htmlFor="cv-title" className="sr-only">
            {t("editor.cvTitle")}
          </label>
          <div className="flex items-center gap-2">
            <Pencil className="h-4 w-4 shrink-0 text-muted" aria-hidden />
            <input
              id="cv-title"
              className="min-w-0 flex-1 rounded-md bg-transparent px-1 py-1 text-lg font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              value={doc.title}
              maxLength={200}
              onChange={(e) => update((d) => ({ ...d, title: e.target.value }))}
              onBlur={() => !doc.title.trim() && update((d) => ({ ...d, title: t("editor.untitled") }))}
            />
          </div>
          <SaveIndicator status={status} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => openAi("tailor")}>
            <Sparkles className="h-4 w-4 text-violet-600" />
            {t("editor.toolbar.ai")}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setDialog("import")}>
            <FileUp className="h-4 w-4" />
            <span className="hidden sm:inline">{t("editor.toolbar.import")}</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => void share()} aria-label={t("editor.share.button")}>
            <Share2 className="h-4 w-4" />
            <span className="hidden sm:inline">{t("editor.share.button")}</span>
          </Button>
          <Button variant="gradient" size="sm" onClick={() => setDialog("download")}>
            <Download className="h-4 w-4" />
            {t("editor.download.button")}
          </Button>
        </div>
      </div>

      {draft.pendingDraft && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900" role="alert">
          <span className="flex-1">{t("editor.restoreDraft", { time: new Date(draft.pendingDraft.at).toLocaleString() })}</span>
          <Button size="sm" onClick={draft.restoreDraft}>
            {t("editor.restore")}
          </Button>
          <Button size="sm" variant="ghost" onClick={draft.discardDraft}>
            {t("editor.discard")}
          </Button>
        </div>
      )}

      {/* Steps */}
      <nav aria-label={t("editor.stepLabel", { n: step + 1, total: STEPS.length, name: t(`editor.steps.${STEPS[step]}`) })}>
        <ol className="grid grid-cols-3 gap-2">
          {STEPS.map((name, i) => (
            <li key={name}>
              <button
                type="button"
                onClick={() => goTo(i)}
                aria-current={step === i ? "step" : undefined}
                className={cn(
                  "flex w-full items-center gap-2 rounded-xl border px-2 py-2 text-left text-xs font-medium transition sm:px-3 sm:text-sm",
                  step === i ? "border-primary bg-primary text-white shadow" : i < step ? "border-primary/40 bg-primary/5" : "bg-card hover:border-primary/40"
                )}
              >
                <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs", step === i ? "bg-white text-primary" : "bg-secondary")}>
                  {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </span>
                <span className="min-w-0 leading-tight">{t(`editor.steps.${name}`)}</span>
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
        {/* Form */}
        <div className={cn("min-w-0 space-y-4", view === "preview" && "hidden lg:block")}>
          {step === 0 && (
            <>
              <EditorSection title={t("editor.cvLanguage")} hint={t("editor.cvLanguageHint")}>
                <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={t("editor.cvLanguage")}>
                  {(["en", "bn"] as const).map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      role="radio"
                      aria-checked={doc.language === lang}
                      onClick={() => update((d) => ({ ...d, language: lang }))}
                      className={cn(
                        "flex items-center justify-center gap-1.5 rounded-lg border-2 px-3 py-2.5 text-sm font-medium",
                        doc.language === lang ? "border-primary bg-primary text-white" : "border-border hover:border-primary/40"
                      )}
                    >
                      {t(lang === "en" ? "editor.langEn" : "editor.langBn")}
                    </button>
                  ))}
                </div>
              </EditorSection>
              <PersonalSection {...sectionProps} />
              <ObjectiveSection {...sectionProps} />
            </>
          )}
          {step === 1 && (
            <>
              <EducationSection {...sectionProps} />
              <ExperienceSection {...sectionProps} />
              <TrainingSection {...sectionProps} />
              <SkillsSection {...sectionProps} />
              <LanguagesSection {...sectionProps} />
            </>
          )}
          {step === 2 && (
            <>
              <DetailsSection {...sectionProps} />
              <ReferencesSection {...sectionProps} />
              <MoreSections {...sectionProps} />
              <SectionOrder order={doc.sectionOrder} onChange={(sectionOrder) => update((d) => ({ ...d, sectionOrder }))} content={doc.content} />
              <DesignPanel templates={templates} templateId={doc.templateId} theme={doc.theme} onTemplate={chooseTemplate} onTheme={(theme) => update((d) => ({ ...d, theme }))} />
              <EditorSection title={t("ai.tools")} hint={t("ai.honest")}>
                <div className="grid gap-2 sm:grid-cols-3">
                  {(["tailor", "grammar", "translate"] as const).map((tool) => (
                    <Button key={tool} variant="outline" className="h-auto justify-start whitespace-normal py-3 text-left" onClick={() => openAi(tool)}>
                      <Sparkles className="h-4 w-4 shrink-0 text-violet-600" />
                      {t(`ai.${tool}.title`)}
                    </Button>
                  ))}
                </div>
              </EditorSection>
              <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-5 text-center">
                <p className="font-semibold">{t("editor.download.ready")}</p>
                <p className="mt-1 text-sm text-muted">{t("editor.download.readyText")}</p>
                <Button variant="gradient" size="lg" className="mt-3" onClick={() => setDialog("download")}>
                  <Download className="h-5 w-5" />
                  {t("editor.download.button")}
                </Button>
              </div>
            </>
          )}

          <div className="flex items-center justify-between gap-2 pt-2">
            <Button variant="outline" disabled={step === 0} onClick={() => goTo(step - 1)}>
              <ArrowLeft className="h-4 w-4" />
              {t("editor.back")}
            </Button>
            {step < STEPS.length - 1 && (
              <Button onClick={() => goTo(step + 1)}>
                {t("editor.next", { name: t(`editor.steps.${STEPS[step + 1]}`) })}
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Preview: beside the form on desktop, a toggle on phones */}
        <aside className={cn("min-w-0 space-y-3 lg:sticky lg:top-4 lg:self-start", view === "edit" && "hidden lg:block")} aria-label={t("editor.preview")}>
          <StrengthCard score={strength.score} items={strength.items} onJump={goTo} compact={view === "preview"} />
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{t("editor.preview")}</p>
            <label className="flex items-center gap-2 text-xs text-muted">
              <input type="checkbox" className="h-4 w-4 accent-primary" checked={showBreaks} onChange={(e) => setShowBreaks(e.target.checked)} />
              {t("editor.showPageBreaks")}
            </label>
          </div>
          <div className="lg:max-h-[calc(100vh-14rem)] lg:overflow-y-auto lg:rounded-lg">{preview}</div>
        </aside>
      </div>

      {/* Phone: switch between editing and the preview */}
      <div className="fixed inset-x-0 bottom-3 z-40 flex justify-center lg:hidden">
        <div className="flex rounded-full border bg-card p-1 shadow-xl" role="tablist" aria-label={t("editor.viewMode")}>
          {(["edit", "preview"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              role="tab"
              aria-selected={view === mode}
              onClick={() => setView(mode)}
              className={cn("flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-medium", view === mode ? "bg-primary text-white" : "text-muted")}
            >
              {mode === "edit" ? <Pencil className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {t(`editor.${mode}`)}
            </button>
          ))}
        </div>
      </div>

      <PrintableResume content={doc.content} templateId={doc.templateId} theme={doc.theme} sectionOrder={doc.sectionOrder} language={doc.language} watermark={watermark} />

      <AiToolsDialog
        open={dialog === "ai"}
        onOpenChange={(open) => setDialog(open ? "ai" : null)}
        tool={aiTool}
        onToolChange={setAiTool}
        resumeId={resume._id}
        content={doc.content}
        setContent={setContent}
        language={doc.language}
        saveNow={draft.saveNow}
      />
      <ImportDialog
        open={dialog === "import"}
        onOpenChange={(open) => setDialog(open ? "import" : null)}
        resumeId={resume._id}
        hasContent={hasContent}
        onImported={(result) => {
          update((d) => ({ ...d, content: normalizeContent(result.content) }));
          goTo(0);
        }}
      />
      <DownloadDialog
        open={dialog === "download"}
        onOpenChange={(open) => setDialog(open ? "download" : null)}
        resumeId={resume._id}
        title={doc.title}
        language={doc.language}
        watermark={watermark}
        saveNow={draft.saveNow}
      />
    </div>
  );
}
