import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { CornerDownRight, Lightbulb, Loader2, MessagesSquare, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { SelectField, TextAreaField, TextField } from "@/components/editor/fields";
import { QuotaNote, ScoreRing } from "@/components/editor/ai";
import api from "@/lib/api";
import { useAiTask } from "@/lib/ai";
import { useSessionState } from "@/lib/sessionState";
import { uid } from "@/lib/resume/model";
import { normalizeLanguage } from "@/lib/language";
import { useAuthStore } from "@/store/authStore";
import type { Resume } from "@/types";

const FOCUSES = ["mixed", "behavioral", "technical", "hr", "viva"] as const;
type Focus = (typeof FOCUSES)[number];
const COUNTS = [5, 8, 10, 12];
const MIN_ANSWER = 15;

interface Question {
  id: string;
  category: "behavioral" | "technical" | "situational" | "hr" | "role";
  question: string;
  whyAsked: string;
  tips: string[];
  sampleAnswer: string;
  /** Set on follow-up questions the user chose to practise */
  followUpOf?: string;
}

interface QuestionSet {
  /** Set by the client per generated set, so late feedback never lands on a newer set */
  setId?: string;
  jobTitle: string;
  questions: Question[];
  prepTips: string[];
}

interface Feedback {
  score: number;
  verdict: string;
  strengths: string[];
  improvements: string[];
  improvedAnswer: string;
  followUp: string;
}

interface InterviewState {
  resumeId: string;
  jobTitle: string;
  jobDescription: string;
  focus: Focus;
  count: number;
  set: QuestionSet | null;
  answers: Record<string, string>;
  feedback: Record<string, Feedback>;
}

const EMPTY: InterviewState = { resumeId: "", jobTitle: "", jobDescription: "", focus: "mixed", count: 8, set: null, answers: {}, feedback: {} };

function List({ title, items, className }: { title: string; items: string[]; className?: string }) {
  if (!items.length) return null;
  return (
    <div>
      <p className={className ?? "text-sm font-medium"}>{title}</p>
      <ul className="mt-1 list-inside list-disc space-y-1 text-sm">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function FeedbackPanel({ feedback, onFollowUp, followUpAdded }: { feedback: Feedback; onFollowUp: () => void; followUpAdded: boolean }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-4 rounded-lg border border-primary/30 bg-primary/5 p-4">
      <div className="flex items-center gap-4">
        <ScoreRing score={feedback.score} max={10} />
        <div>
          <p className="text-sm font-medium">{t("interview.score", { score: feedback.score })}</p>
          <p className="text-sm text-muted">{feedback.verdict}</p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <List title={t("interview.strengths")} items={feedback.strengths} className="text-sm font-medium text-green-700 dark:text-green-400" />
        <List title={t("interview.improvements")} items={feedback.improvements} className="text-sm font-medium text-amber-700 dark:text-amber-400" />
      </div>
      {feedback.improvedAnswer && (
        <div>
          <p className="text-sm font-medium">{t("interview.improvedAnswer")}</p>
          <p className="mt-1 whitespace-pre-line rounded-lg bg-background p-3 text-sm leading-relaxed">{feedback.improvedAnswer}</p>
        </div>
      )}
      {feedback.followUp && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-background p-3">
          <p className="text-sm">
            <span className="font-medium">{t("interview.followUp")}:</span> {feedback.followUp}
          </p>
          <Button type="button" size="sm" variant="outline" onClick={onFollowUp} disabled={followUpAdded}>
            <CornerDownRight className="h-4 w-4" /> {followUpAdded ? t("interview.followUpAdded") : t("interview.practiseFollowUp")}
          </Button>
        </div>
      )}
    </div>
  );
}

export default function InterviewCoachPage() {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const userId = useAuthStore((s) => s.user?.id ?? "guest");
  const [state, setState] = useSessionState<InterviewState>(`interview:${userId}`, EMPTY);
  const update = (patch: Partial<InterviewState>) => setState((s) => ({ ...s, ...patch }));
  const [pendingId, setPendingId] = useState<string | null>(null);
  // Short screen-reader announcements, instead of reading the whole question list aloud
  const [announcement, setAnnouncement] = useState("");
  const language = normalizeLanguage(i18n.language);

  const { data: resumes = [] } = useQuery({
    queryKey: ["resumes"],
    queryFn: async () => (await api.get("/resumes")).data.data as Resume[],
  });
  const selected = resumes.find((r) => r._id === state.resumeId);
  // A CV deleted since it was chosen is ignored
  const resumeId = selected ? selected._id : undefined;

  const generate = useAiTask<object, QuestionSet>("/resumes/ai/interview/questions");
  const evaluate = useAiTask<object, Feedback>("/resumes/ai/interview/feedback");

  const run = () => {
    if (!state.jobTitle.trim() && !state.jobDescription.trim() && !selected?.content?.personalInfo?.jobTitle) {
      toast.add(t("interview.needJob"), "error");
      return;
    }
    // mutateAsync, not mutate callbacks: results are stored even if the user has left the page
    generate
      .mutateAsync({ resumeId, jobTitle: state.jobTitle, jobDescription: state.jobDescription, focus: state.focus, count: state.count, language })
      .then((set) => {
        update({ set: { ...set, setId: uid() }, answers: {}, feedback: {} });
        setAnnouncement(t("interview.ready", { count: set.questions.length }));
      })
      .catch(() => undefined); // useAiTask shows the error
  };

  const askFeedback = (question: Question) => {
    const answer = (state.answers[question.id] ?? "").trim();
    if (answer.length < MIN_ANSWER) {
      toast.add(t("interview.answerTooShort"), "error");
      return;
    }
    const setId = state.set?.setId;
    setPendingId(question.id);
    evaluate
      .mutateAsync({
        resumeId,
        jobTitle: state.set?.jobTitle || state.jobTitle,
        jobDescription: state.jobDescription,
        question: question.question,
        answer,
        language,
      })
      .then((feedback) => {
        setState((s) => (s.set?.setId === setId ? { ...s, feedback: { ...s.feedback, [question.id]: feedback } } : s));
        setAnnouncement(t("interview.score", { score: feedback.score }));
      })
      .catch(() => undefined)
      .finally(() => setPendingId(null));
  };

  /** Adds the interviewer's likely follow-up right after the question, to practise next. */
  const addFollowUp = (question: Question, text: string) =>
    setState((s) => {
      if (!s.set || s.set.questions.some((q) => q.followUpOf === question.id)) return s;
      const questions = [...s.set.questions];
      const at = questions.findIndex((q) => q.id === question.id);
      questions.splice(at + 1, 0, {
        id: `${question.id}-f`,
        category: question.category,
        question: text,
        whyAsked: "",
        tips: [],
        sampleAnswer: "",
        followUpOf: question.id,
      });
      return { ...s, set: { ...s.set, questions } };
    });

  const set = state.set;
  // Follow-ups aren't numbered
  let n = 0;
  const numbers = (set?.questions ?? []).map((q) => (q.followUpOf ? 0 : ++n));
  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <MessagesSquare className="h-7 w-7 text-primary" aria-hidden />
          {t("interview.title")}
        </h1>
        <p className="mt-1 text-sm text-muted">{t("interview.intro")}</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <section className="h-fit space-y-4 rounded-xl border bg-card p-4 sm:p-5" aria-label={t("interview.setup")}>
          <SelectField
            label={t("interview.cv")}
            hint={t("interview.cvHint")}
            value={resumeId ?? ""}
            onChange={(value) => update({ resumeId: value })}
            options={[{ value: "", label: t("interview.noCv") }, ...resumes.map((r) => ({ value: r._id, label: r.title }))]}
          />
          <TextField
            label={t("interview.jobTitle")}
            placeholder={selected?.content?.personalInfo?.jobTitle || t("interview.jobTitlePlaceholder")}
            value={state.jobTitle}
            onChange={(value) => update({ jobTitle: value })}
            maxLength={120}
          />
          <TextAreaField
            label={t("interview.jobPost")}
            hint={t("interview.jobPostHint")}
            placeholder={t("ai.tailor.placeholder")}
            value={state.jobDescription}
            onChange={(value) => update({ jobDescription: value })}
            rows={5}
            maxLength={12000}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label={t("interview.focus")}
              value={state.focus}
              onChange={(value) => update({ focus: value as Focus })}
              options={FOCUSES.map((f) => ({ value: f, label: t(`interview.focuses.${f}`) }))}
            />
            <SelectField
              label={t("interview.count")}
              value={String(state.count)}
              onChange={(value) => update({ count: Number(value) })}
              options={COUNTS.map((n) => ({ value: String(n), label: t("interview.countOption", { count: n }) }))}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="gradient" onClick={run} disabled={generate.isPending || evaluate.isPending}>
              {generate.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {generate.isPending ? t("interview.generating") : set ? t("interview.regenerate") : t("interview.generate")}
            </Button>
            <QuotaNote />
          </div>
          <p className="text-xs text-muted">{t("ai.honest")}</p>
        </section>

        <section className="space-y-4" aria-labelledby="interview-questions" aria-busy={generate.isPending}>
          <p className="sr-only" role="status">
            {announcement}
          </p>
          <div className="flex items-center justify-between gap-2">
            <h2 id="interview-questions" className="font-semibold">
              {set?.jobTitle ? t("interview.questionsFor", { jobTitle: set.jobTitle }) : t("interview.questions")}
            </h2>
            {set && (
              <Button type="button" size="sm" variant="ghost" disabled={evaluate.isPending} onClick={() => update({ set: null, answers: {}, feedback: {} })}>
                <RotateCcw className="h-4 w-4" /> {t("interview.clear")}
              </Button>
            )}
          </div>

          {!set && !generate.isPending && <p className="rounded-xl border border-dashed p-6 text-sm text-muted">{t("interview.empty")}</p>}
          {generate.isPending && (
            <div className="flex items-center gap-2 rounded-xl border bg-card p-6 text-sm text-muted" role="status">
              <Loader2 className="h-4 w-4 animate-spin" /> {t("interview.generatingLong")}
            </div>
          )}

          {set && !generate.isPending && (
            <>
              {set.prepTips.length > 0 && (
                <div className="rounded-xl border border-amber-300/60 bg-amber-50 p-4 text-amber-950 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-100">
                  <p className="flex items-center gap-2 text-sm font-semibold">
                    <Lightbulb className="h-4 w-4" aria-hidden /> {t("interview.prepTips")}
                  </p>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
                    {set.prepTips.map((tip) => (
                      <li key={tip}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}

              <ol className="space-y-4">
                {set.questions.map((q, index) => {
                  const feedback = state.feedback[q.id];
                  const pending = pendingId === q.id;
                  return (
                    <li key={q.id} className={q.followUpOf ? "ml-4 sm:ml-8" : undefined}>
                      <article className="space-y-3 rounded-xl border bg-card p-4 sm:p-5">
                        <div className="flex flex-wrap items-center gap-2">
                          {q.followUpOf ? (
                            <Badge variant="outline">
                              <CornerDownRight className="mr-1 h-3 w-3" aria-hidden /> {t("interview.followUp")}
                            </Badge>
                          ) : (
                            <span className="text-sm font-semibold text-muted">{numbers[index]}.</span>
                          )}
                          <Badge variant="secondary">{t(`interview.categories.${q.category}`)}</Badge>
                        </div>
                        <h3 className="font-medium leading-snug">{q.question}</h3>

                        {(q.whyAsked || q.tips.length > 0) && (
                          <details className="group rounded-lg bg-secondary/50 px-3 py-2 text-sm">
                            <summary className="cursor-pointer font-medium">{t("interview.whyAsked")}</summary>
                            <div className="mt-2 space-y-2">
                              {q.whyAsked && <p className="text-muted">{q.whyAsked}</p>}
                              <List title={t("interview.tips")} items={q.tips} />
                            </div>
                          </details>
                        )}
                        {q.sampleAnswer && (
                          <details className="rounded-lg bg-secondary/50 px-3 py-2 text-sm">
                            <summary className="cursor-pointer font-medium">{t("interview.sampleAnswer")}</summary>
                            <p className="mt-2 whitespace-pre-line leading-relaxed">{q.sampleAnswer}</p>
                            <p className="mt-2 text-xs text-muted">{t("interview.sampleHint")}</p>
                          </details>
                        )}

                        <TextAreaField
                          label={t("interview.yourAnswer")}
                          placeholder={t("interview.yourAnswerPlaceholder")}
                          value={state.answers[q.id] ?? ""}
                          onChange={(value) => setState((s) => ({ ...s, answers: { ...s.answers, [q.id]: value } }))}
                          rows={4}
                          maxLength={5000}
                        />
                        <Button type="button" variant="outline" size="sm" onClick={() => askFeedback(q)} disabled={evaluate.isPending}>
                          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                          {pending ? t("ai.working") : feedback ? t("interview.feedbackAgain") : t("interview.getFeedback")}
                        </Button>

                        {feedback && (
                          <FeedbackPanel
                            feedback={feedback}
                            followUpAdded={set.questions.some((x) => x.followUpOf === q.id)}
                            onFollowUp={() => addFollowUp(q, feedback.followUp)}
                          />
                        )}
                      </article>
                    </li>
                  );
                })}
              </ol>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
