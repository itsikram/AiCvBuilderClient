import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Lightbulb, Loader2, Plus, RefreshCw, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { requestsLeft, TONES, useAiQuota, useAiTask, type Tone } from "@/lib/ai";
import { contentForAi, type CvLang } from "@/lib/resume/model";
import { cn } from "@/lib/utils";
import type { ResumeContent } from "@/types";

/** "AI requests left today: 7 of 10" */
export function QuotaNote({ className }: { className?: string }) {
  const { t } = useTranslation();
  const { data } = useAiQuota();
  if (!data) return null;
  const left = requestsLeft(data);
  const text =
    left === null
      ? t("ai.quotaUnlimited")
      : left === 0
        ? t("ai.quotaEmpty")
        : t("ai.quota", { left, limit: data.dailyLimit === -1 ? data.monthlyLimit : data.dailyLimit });
  return <p className={cn("text-xs", left === 0 ? "text-red-600" : "text-muted", className)}>{text}</p>;
}

function TonePicker({ value, onChange }: { value: Tone; onChange: (tone: Tone) => void }) {
  const { t } = useTranslation();
  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-medium">{t("ai.tone")}</legend>
      <div className="flex flex-wrap gap-2" role="radiogroup">
        {TONES.map((tone) => (
          <button
            key={tone}
            type="button"
            role="radio"
            aria-checked={value === tone}
            onClick={() => onChange(tone)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm focus-visible:outline-2 focus-visible:outline-primary",
              value === tone ? "border-primary bg-primary text-white" : "hover:bg-secondary"
            )}
          >
            {t(`ai.tones.${tone}`)}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

const Working = () => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-2 py-6 text-sm text-muted" role="status">
      <Loader2 className="h-4 w-4 animate-spin" /> {t("ai.working")}
    </div>
  );
};

const Tip = ({ text }: { text?: string }) => {
  const { t } = useTranslation();
  if (!text?.trim()) return null;
  return (
    <p className="flex gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
      <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <span>
        <strong>{t("ai.tip")}:</strong> {text}
      </span>
    </p>
  );
};

interface WriteProps {
  kind: "summary" | "objective";
  content: ResumeContent;
  language: CvLang;
  onPick: (text: string) => void;
}

/** "Write with AI" for the career objective or summary: three options to pick from. */
export function AiWriteButton({ kind, content, language, onPick }: WriteProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [tone, setTone] = useState<Tone>("formal");
  const task = useAiTask<object, { options: string[]; tip: string }>("/resumes/ai/write-summary");
  const current = kind === "summary" ? content.personalInfo.summary : content.careerObjective;

  const run = () => task.mutate({ kind, tone, language, jobTitle: content.personalInfo.jobTitle, content: contentForAi(content) });

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Sparkles className="h-4 w-4 text-violet-600" />
        {current?.trim() ? t("ai.improve") : t("ai.write")}
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        busy={task.isPending}
        title={t(kind === "summary" ? "editor.summary.title" : "editor.objective.title")}
        description={t("ai.honest")}
        size="lg"
      >
        <div className="space-y-4">
          <TonePicker value={tone} onChange={setTone} />
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="gradient" onClick={run} disabled={task.isPending}>
              {task.data ? <RefreshCw className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
              {task.data ? t("ai.again") : current?.trim() ? t("ai.improve") : t("ai.write")}
            </Button>
            <QuotaNote />
          </div>
          {task.isPending && <Working />}
          {task.data && !task.isPending && (
            <div className="space-y-3">
              <p className="text-sm text-muted">{t("ai.pickOne")}</p>
              {task.data.options.map((option, i) => (
                <div key={i} className="rounded-lg border p-3">
                  <p className="whitespace-pre-line text-sm leading-relaxed">{option}</p>
                  <Button
                    type="button"
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      onPick(option);
                      setOpen(false);
                    }}
                  >
                    {t("ai.use")}
                  </Button>
                </div>
              ))}
              <Tip text={task.data.tip} />
            </div>
          )}
        </div>
      </Dialog>
    </>
  );
}

interface BulletsProps {
  position: string;
  company: string;
  bullets: string[];
  jobTitle?: string;
  language: CvLang;
  onApply: (bullets: string[], mode: "replace" | "append") => void;
}

/** Rewrites one job's duty lines with action verbs (numbers only if the user gave them). */
export function AiBulletsButton({ position, company, bullets, jobTitle, language, onApply }: BulletsProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [tone, setTone] = useState<Tone>("confident");
  const task = useAiTask<object, { bullets: string[]; tips: string[] }>("/resumes/ai/rewrite-bullets");
  const filled = bullets.filter((b) => b.trim());

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Wand2 className="h-4 w-4 text-violet-600" />
        {t("ai.polish")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen} busy={task.isPending} title={`${t("ai.polish")}: ${position || t("editor.experience.position")}`} description={t("ai.honest")} size="lg">
        <div className="space-y-4">
          {!filled.length && !position.trim() ? (
            <p className="text-sm text-muted">{t("ai.needText")}</p>
          ) : (
            <>
              <TonePicker value={tone} onChange={setTone} />
              <div className="flex flex-wrap items-center gap-3">
                <Button type="button" variant="gradient" disabled={task.isPending} onClick={() => task.mutate({ position, company, bullets: filled, jobTitle, tone, language })}>
                  <Wand2 className="h-4 w-4" />
                  {task.data ? t("ai.again") : t("ai.polish")}
                </Button>
                <QuotaNote />
              </div>
            </>
          )}
          {task.isPending && <Working />}
          {task.data && !task.isPending && (
            <div className="space-y-3">
              <ul className="list-disc space-y-1.5 rounded-lg border p-3 pl-8 text-sm">
                {task.data.bullets.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
              {task.data.tips.map((tip, i) => (
                <Tip key={i} text={tip} />
              ))}
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  onClick={() => {
                    onApply(task.data!.bullets, "replace");
                    setOpen(false);
                  }}
                >
                  {t("ai.replaceLines")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    onApply(task.data!.bullets, "append");
                    setOpen(false);
                  }}
                >
                  {t("ai.addLines")}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Dialog>
    </>
  );
}

/** Inline skill suggestions for the target job title. */
export function AiSkillSuggestions({ jobTitle, skills, language, onAdd }: { jobTitle?: string; skills: string[]; language: CvLang; onAdd: (skills: string[]) => void }) {
  const { t } = useTranslation();
  const task = useAiTask<object, { skills: string[] }>("/resumes/ai/suggest-skills");
  const have = new Set(skills.map((s) => s.trim().toLowerCase()));
  const suggestions = (task.data?.skills ?? []).filter((s) => !have.has(s.toLowerCase()));

  if (!jobTitle?.trim()) return <p className="text-xs text-muted">{t("ai.needJobTitle")}</p>;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" size="sm" disabled={task.isPending} onClick={() => task.mutate({ jobTitle, currentSkills: skills, language })}>
          {task.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-violet-600" />}
          {t("ai.suggestSkills")}
        </Button>
        <QuotaNote />
      </div>
      {task.data && (
        <div className="rounded-lg border border-dashed p-3">
          <p className="mb-2 text-sm font-medium">{t("ai.skillsFor", { title: jobTitle })}</p>
          {suggestions.length ? (
            <div className="flex flex-wrap gap-2">
              {suggestions.map((skill) => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => onAdd([skill])}
                  className="inline-flex items-center gap-1 rounded-full border border-primary/40 px-3 py-1 text-sm text-primary hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-primary"
                  aria-label={t("ai.addSkill", { skill })}
                >
                  <Plus className="h-3.5 w-3.5" /> {skill}
                </button>
              ))}
              <Button type="button" size="sm" variant="ghost" onClick={() => onAdd(suggestions)}>
                {t("ai.addAll")}
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted">{t("ai.noSuggestions")}</p>
          )}
        </div>
      )}
    </div>
  );
}
