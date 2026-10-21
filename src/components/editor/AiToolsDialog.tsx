import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { Link } from "react-router-dom";
import { Check, Languages, Loader2, SpellCheck, Target, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { useAiTask } from "@/lib/ai";
import { cn } from "@/lib/utils";
import { contentForAi, getAtPath, setAtPath, type CvLang } from "@/lib/resume/model";
import type { Resume, ResumeContent } from "@/types";
import { QuotaNote } from "./ai";

export type AiTool = "tailor" | "grammar" | "translate";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tool: AiTool;
  onToolChange: (tool: AiTool) => void;
  resumeId: string;
  content: ResumeContent;
  setContent: (recipe: (content: ResumeContent) => ResumeContent) => void;
  language: CvLang;
  /** Saves pending edits first, so the translated copy includes them */
  saveNow: () => Promise<void>;
}

interface TailorEdit {
  key: string;
  type: "rewrite" | "add_skill";
  path: string;
  before: string;
  after: string;
  reason: string;
}

interface TailorResult {
  matchScore: number;
  verdict: string;
  matchedKeywords: string[];
  missingKeywords: string[];
  edits: TailorEdit[];
}

interface GrammarIssue {
  path: string;
  original: string;
  corrected: string;
  explanation: string;
}

const SECTION_OF: Record<string, string> = {
  trainings: "training",
  volunteerExperience: "volunteer",
  customSections: "custom",
};

/** "experience.0.bullets.2" -> "Work Experience · Accounts Intern" */
function pathLabel(path: string, content: ResumeContent, t: TFunction) {
  if (path === "careerObjective") return t("cv.sections.objective");
  if (path === "personalInfo.summary") return t("cv.sections.summary");
  if (path.startsWith("personalInfo.")) return t(`editor.personal.${path.split(".")[1]}`);
  if (path === "skills") return t("cv.sections.skills");
  const [section, index] = path.split(".");
  const item = getAtPath(content, `${section}.${index}`) as Record<string, string> | undefined;
  const name = item?.position || item?.degree || item?.title || item?.name || item?.role || "";
  return [t(`cv.sections.${SECTION_OF[section] ?? section}`, { defaultValue: section }), name].filter(Boolean).join(" · ");
}

function ScoreRing({ score }: { score: number }) {
  const color = score >= 75 ? "#16a34a" : score >= 50 ? "#d97706" : "#dc2626";
  return (
    <div className="relative h-20 w-20 shrink-0" role="img" aria-label={`${score}/100`}>
      <svg viewBox="0 0 36 36" className="h-20 w-20 -rotate-90">
        <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" className="text-secondary" strokeWidth="3.5" />
        <circle cx="18" cy="18" r="15.9" fill="none" stroke={color} strokeWidth="3.5" strokeDasharray={`${score} 100`} strokeLinecap="round" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xl font-bold">{score}</span>
    </div>
  );
}

function Chips({ items, tone }: { items: string[]; tone: "good" | "warn" }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((k) => (
        <span key={k} className={cn("rounded-full px-2.5 py-0.5 text-xs", tone === "good" ? "bg-green-100 text-green-900" : "bg-amber-100 text-amber-900")}>
          {k}
        </span>
      ))}
    </div>
  );
}

function TailorTool({ content, setContent, language }: Pick<Props, "content" | "setContent" | "language">) {
  const { t } = useTranslation();
  const toast = useToast();
  const [job, setJob] = useState("");
  const [decisions, setDecisions] = useState<Record<string, "accepted" | "skipped">>({});
  const task = useAiTask<object, TailorResult>("/resumes/ai/tailor");
  const result = task.data;

  const apply = (edit: TailorEdit, current: ResumeContent): ResumeContent | null => {
    if (edit.type === "add_skill") {
      const have = current.skills.some((s) => s.trim().toLowerCase() === edit.after.toLowerCase());
      return have ? current : { ...current, skills: [...current.skills.filter((s) => s.trim()), edit.after] };
    }
    // Only replace text the suggestion was made for; the user may have edited it since
    if (getAtPath(current, edit.path) !== edit.before) return null;
    return setAtPath(current, edit.path, edit.after);
  };

  const accept = (edits: TailorEdit[]) => {
    // Updaters may run after this function returns, so check against what's rendered
    const stale = edits.filter((edit) => apply(edit, content) === null).length;
    setContent((current) => edits.reduce((next, edit) => apply(edit, next) ?? next, current));
    setDecisions((d) => ({ ...d, ...Object.fromEntries(edits.map((e) => [e.key, "accepted" as const])) }));
    if (stale) toast.add(t("ai.tailor.stale"), "error");
    else toast.add(t("ai.tailor.applied"), "success");
  };

  const run = () => {
    setDecisions({});
    task.mutate({ jobDescription: job, language, content: contentForAi(content) });
  };

  if (!result || task.isPending) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted">{t("ai.tailor.intro")}</p>
        <label htmlFor="tailor-job" className="sr-only">
          {t("ai.tailor.placeholder")}
        </label>
        <textarea
          id="tailor-job"
          className="min-h-[200px] w-full rounded-lg border bg-background p-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:text-sm"
          placeholder={t("ai.tailor.placeholder")}
          value={job}
          onChange={(e) => setJob(e.target.value)}
        />
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="gradient" disabled={task.isPending || job.trim().length < 20} onClick={run}>
            {task.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Target className="h-4 w-4" />}
            {task.isPending ? t("ai.working") : t("ai.tailor.run")}
          </Button>
          <QuotaNote />
        </div>
      </div>
    );
  }

  const pending = result.edits.filter((e) => !decisions[e.key]);
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <ScoreRing score={result.matchScore} />
        <div>
          <p className="text-sm font-medium">{t("ai.tailor.score")}</p>
          <p className="text-sm text-muted">{result.verdict}</p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {result.matchedKeywords.length > 0 && (
          <div>
            <p className="mb-1.5 text-sm font-medium">{t("ai.tailor.matched")}</p>
            <Chips items={result.matchedKeywords} tone="good" />
          </div>
        )}
        {result.missingKeywords.length > 0 && (
          <div>
            <p className="mb-1.5 text-sm font-medium">{t("ai.tailor.missing")}</p>
            <Chips items={result.missingKeywords} tone="warn" />
            <p className="mt-1.5 text-xs text-muted">{t("ai.tailor.missingHint")}</p>
          </div>
        )}
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="font-medium">{t("ai.tailor.edits")}</p>
          {pending.length > 1 && (
            <Button type="button" size="sm" variant="outline" onClick={() => accept(pending)}>
              {t("ai.tailor.acceptAll")}
            </Button>
          )}
        </div>
        {result.edits.length === 0 && <p className="text-sm text-muted">{t("ai.tailor.noEdits")}</p>}
        <ul className="space-y-3">
          {result.edits.map((edit) => {
            const decision = decisions[edit.key];
            return (
              <li key={edit.key} className={cn("rounded-lg border p-3", decision && "opacity-60")}>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
                  {edit.type === "add_skill" ? t("ai.tailor.addSkill") : pathLabel(edit.path, content, t)}
                </p>
                {edit.type === "rewrite" && (
                  <p className="mb-1 text-sm text-muted">
                    <span className="font-medium">{t("ai.tailor.now")}:</span> <span className="line-through decoration-red-400/70">{edit.before}</span>
                  </p>
                )}
                <p className="text-sm">
                  <span className="font-medium text-green-700">{t("ai.tailor.suggested")}:</span> {edit.after}
                </p>
                {edit.reason && <p className="mt-1 text-xs text-muted">{edit.reason}</p>}
                <div className="mt-2 flex gap-2">
                  {decision ? (
                    <span className="inline-flex items-center gap-1 text-sm">
                      {decision === "accepted" ? <Check className="h-4 w-4 text-green-600" /> : <X className="h-4 w-4" />}
                      {t(`ai.tailor.${decision}`)}
                    </span>
                  ) : (
                    <>
                      <Button type="button" size="sm" onClick={() => accept([edit])}>
                        <Check className="h-4 w-4" /> {t("ai.tailor.accept")}
                      </Button>
                      <Button type="button" size="sm" variant="ghost" onClick={() => setDecisions((d) => ({ ...d, [edit.key]: "skipped" }))}>
                        {t("ai.tailor.skip")}
                      </Button>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
      <Button type="button" variant="outline" onClick={() => task.reset()}>
        {t("ai.tailor.another")}
      </Button>
    </div>
  );
}

function GrammarTool({ content, setContent, language }: Pick<Props, "content" | "setContent" | "language">) {
  const { t } = useTranslation();
  const toast = useToast();
  const [done, setDone] = useState<Record<string, "fixed" | "ignored">>({});
  const task = useAiTask<object, { issues: GrammarIssue[] }>("/resumes/ai/grammar");

  const fix = (issues: GrammarIssue[]) => {
    const stale = issues.filter((issue) => getAtPath(content, issue.path) !== issue.original).length;
    setContent((current) =>
      issues.reduce((next, issue) => (getAtPath(next, issue.path) === issue.original ? setAtPath(next, issue.path, issue.corrected) : next), current)
    );
    setDone((d) => ({ ...d, ...Object.fromEntries(issues.map((i) => [i.path, "fixed" as const])) }));
    if (stale) toast.add(t("ai.tailor.stale"), "error");
  };

  const issues = task.data?.issues ?? [];
  const open = issues.filter((i) => !done[i.path]);
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">{t("ai.grammar.intro")}</p>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="gradient"
          disabled={task.isPending}
          onClick={() => {
            setDone({});
            task.mutate({ language, content: contentForAi(content) });
          }}
        >
          {task.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <SpellCheck className="h-4 w-4" />}
          {task.isPending ? t("ai.working") : t("ai.grammar.run")}
        </Button>
        {open.length > 1 && (
          <Button type="button" variant="outline" onClick={() => fix(open)}>
            {t("ai.grammar.fixAll")}
          </Button>
        )}
        <QuotaNote />
      </div>
      {task.data && !task.isPending && issues.length === 0 && <p className="rounded-lg bg-green-50 p-3 text-sm text-green-900">{t("ai.grammar.none")}</p>}
      <ul className="space-y-3">
        {issues.map((issue) => (
          <li key={issue.path} className={cn("rounded-lg border p-3", done[issue.path] && "opacity-60")}>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted">{pathLabel(issue.path, content, t)}</p>
            <p className="text-sm text-muted line-through decoration-red-400/70">{issue.original}</p>
            <p className="text-sm">{issue.corrected}</p>
            {issue.explanation && <p className="mt-1 text-xs text-muted">{issue.explanation}</p>}
            <div className="mt-2 flex gap-2">
              {done[issue.path] ? (
                <span className="text-sm">{done[issue.path] === "fixed" ? t("ai.grammar.fixed") : t("ai.grammar.ignore")}</span>
              ) : (
                <>
                  <Button type="button" size="sm" onClick={() => fix([issue])}>
                    {t("ai.grammar.fix")}
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setDone((d) => ({ ...d, [issue.path]: "ignored" }))}>
                    {t("ai.grammar.ignore")}
                  </Button>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TranslateTool({ resumeId, language, saveNow }: Pick<Props, "resumeId" | "language" | "saveNow">) {
  const { t } = useTranslation();
  const task = useAiTask<{ targetLanguage: CvLang }, Resume>(() => `/resumes/${resumeId}/translate`);
  const target: CvLang = language === "bn" ? "en" : "bn";

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">{t("ai.translate.intro")}</p>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="gradient"
          disabled={task.isPending}
          onClick={async () => {
            await saveNow();
            task.mutate({ targetLanguage: target });
          }}
        >
          {task.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Languages className="h-4 w-4" />}
          {t(target === "bn" ? "ai.translate.toBn" : "ai.translate.toEn")}
        </Button>
        <QuotaNote />
      </div>
      {task.isPending && (
        <p className="text-sm text-muted" role="status">
          {t("ai.translate.working")}
        </p>
      )}
      {task.data && (
        <div className="rounded-lg bg-green-50 p-3 text-sm text-green-900">
          {t("ai.translate.done")}{" "}
          <Link className="font-medium underline" to={`/dashboard/resumes/${task.data._id}`}>
            {t("ai.translate.open")}
          </Link>
        </div>
      )}
    </div>
  );
}

const TOOLS: Array<{ id: AiTool; icon: typeof Target }> = [
  { id: "tailor", icon: Target },
  { id: "grammar", icon: SpellCheck },
  { id: "translate", icon: Languages },
];

export function AiToolsDialog(props: Props) {
  const { t } = useTranslation();
  const { open, onOpenChange, tool, onToolChange } = props;
  return (
    <Dialog open={open} onOpenChange={onOpenChange} title={t("ai.tools")} description={t("ai.honest")} size="lg">
      <div className="mb-4 flex gap-1 rounded-lg bg-secondary p-1" role="tablist" aria-label={t("ai.tools")}>
        {TOOLS.map(({ id, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tool === id}
            onClick={() => onToolChange(id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-2 text-xs font-medium sm:text-sm",
              tool === id ? "bg-background shadow-sm" : "text-muted hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            <span className="truncate">{t(`ai.${id}.title`)}</span>
          </button>
        ))}
      </div>
      <div role="tabpanel">
        {/* Each tool keeps its own state while the dialog is open */}
        <div hidden={tool !== "tailor"}>
          <TailorTool {...props} />
        </div>
        <div hidden={tool !== "grammar"}>
          <GrammarTool {...props} />
        </div>
        <div hidden={tool !== "translate"}>
          <TranslateTool {...props} />
        </div>
      </div>
    </Dialog>
  );
}
