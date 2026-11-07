import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bot, Check, Loader2, Plus, Send, User as UserIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { SelectField, TextAreaField } from "@/components/editor/fields";
import { QuotaNote } from "@/components/editor/ai";
import api, { getErrorMessage } from "@/lib/api";
import { pathLabel, useAiTask, useSessionState, type CvEdit } from "@/lib/ai";
import { confirmAction } from "@/lib/confirm";
import { normalizeLanguage } from "@/lib/language";
import { uid } from "@/lib/resume/model";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import type { Resume } from "@/types";

type Decision = "applied" | "skipped" | "stale";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  /** Changes the coach proposed to the CV it was looking at (resumeId) */
  edits?: CvEdit[];
  resumeId?: string;
  decisions?: Record<string, Decision>;
  suggestions?: string[];
}

interface CoachState {
  resumeId: string;
  jobDescription: string;
  messages: Message[];
}

interface CoachReply {
  reply: string;
  edits: CvEdit[];
  suggestions: string[];
}

const STARTERS = ["review", "linkedin", "interview", "salary", "jobs", "abroad"] as const;
/** Messages sent per request; the server keeps the newest turns that fit its limit */
const HISTORY = 20;
const MAX_MESSAGE = 4000;
const EMPTY: CoachState = { resumeId: "", jobDescription: "", messages: [] };

function EditCard({
  edit,
  decision,
  label,
  busy,
  onApply,
  onSkip,
}: {
  edit: CvEdit;
  decision?: Decision;
  label: string;
  busy: boolean;
  onApply: () => void;
  onSkip: () => void;
}) {
  const { t } = useTranslation();
  return (
    <li className={cn("space-y-1.5 rounded-lg border bg-background p-3 text-sm", decision && "opacity-70")}>
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{edit.type === "add_skill" ? t("ai.tailor.addSkill") : label}</p>
      {edit.before && (
        <p>
          <span className="font-medium">{t("ai.tailor.now")}:</span> <span className="line-through decoration-red-400/70">{edit.before}</span>
        </p>
      )}
      <p>
        <span className="font-medium text-green-700 dark:text-green-400">{t("ai.tailor.suggested")}:</span> {edit.after}
      </p>
      {edit.reason && <p className="text-xs text-muted">{edit.reason}</p>}
      {decision ? (
        <p className={cn("text-xs font-medium", decision === "applied" ? "text-green-700 dark:text-green-400" : "text-muted")}>{t(`coach.decision.${decision}`)}</p>
      ) : (
        <div className="flex gap-2 pt-1">
          <Button type="button" size="sm" onClick={onApply} disabled={busy}>
            <Check className="h-4 w-4" /> {t("coach.apply")}
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={onSkip} disabled={busy}>
            <X className="h-4 w-4" /> {t("ai.tailor.skip")}
          </Button>
        </div>
      )}
    </li>
  );
}

export default function CareerCoachPage() {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id ?? "guest");
  const [state, setState] = useSessionState<CoachState>(`coach:${userId}`, EMPTY);
  const [input, setInput] = useState("");
  const [applying, setApplying] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const language = normalizeLanguage(i18n.language);

  const { data: resumes = [] } = useQuery({
    queryKey: ["resumes"],
    queryFn: async () => (await api.get("/resumes")).data.data as Resume[],
  });
  const selected = resumes.find((r) => r._id === state.resumeId);
  const resumeId = selected ? selected._id : undefined;
  const chat = useAiTask<object, CoachReply>("/resumes/ai/coach");

  // Keep the newest message in view (the empty chat's welcome stays at the top)
  const hasMessages = state.messages.length > 0;
  useEffect(() => {
    const el = scrollRef.current;
    if (el && (hasMessages || chat.isPending)) el.scrollTop = el.scrollHeight;
  }, [state.messages.length, hasMessages, chat.isPending]);

  const send = (text: string) => {
    const content = text.trim().slice(0, MAX_MESSAGE);
    if (!content || chat.isPending) return;
    const message: Message = { id: uid(), role: "user", content };
    const history = [...state.messages, message];
    setState((s) => ({ ...s, messages: history }));
    setInput("");
    chat.mutate(
      {
        resumeId,
        jobDescription: state.jobDescription,
        language,
        messages: history.slice(-HISTORY).map(({ role, content }) => ({ role, content })),
      },
      {
        onSuccess: (reply) =>
          setState((s) => ({
            ...s,
            messages: [
              ...s.messages,
              { id: uid(), role: "assistant", content: reply.reply, edits: reply.edits, resumeId, suggestions: reply.suggestions },
            ],
          })),
        // The error toast comes from useAiTask; put the unanswered message back so it can be sent again
        onError: () => {
          setState((s) => ({ ...s, messages: s.messages.filter((m) => m.id !== message.id) }));
          setInput(content);
        },
      }
    );
  };

  const decide = (messageId: string, decisions: Record<string, Decision>) =>
    setState((s) => ({
      ...s,
      messages: s.messages.map((m) => (m.id === messageId ? { ...m, decisions: { ...m.decisions, ...decisions } } : m)),
    }));

  const apply = async (message: Message, edits: CvEdit[]) => {
    if (!message.resumeId || !edits.length) return;
    setApplying(message.id);
    try {
      const { data } = await api.post(`/resumes/${message.resumeId}/apply-edits`, {
        edits: edits.map(({ type, path, before, after }) => ({ type, path, before, after })),
      });
      const results = data.data.results as Array<"applied" | "skipped">;
      decide(message.id, Object.fromEntries(edits.map((e, i) => [e.key, results[i] === "applied" ? "applied" : "stale"])));
      queryClient.invalidateQueries({ queryKey: ["resumes"] });
      queryClient.invalidateQueries({ queryKey: ["resume", message.resumeId] });
      toast.add(data.data.skipped ? t("ai.tailor.stale") : t("coach.applied"), data.data.skipped ? "error" : "success");
    } catch (error) {
      toast.add(getErrorMessage(error, t("common.error")), "error");
    } finally {
      setApplying(null);
    }
  };

  const newChat = async () => {
    if (state.messages.length && !(await confirmAction({ title: t("coach.newChatConfirm"), confirmLabel: t("coach.newChat") }))) return;
    setState((s) => ({ ...s, messages: [] }));
    setInput("");
    inputRef.current?.focus();
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    send(input);
  };

  // Enter sends, Shift+Enter adds a line; never while a Bangla/IME composition is open
  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send(input);
    }
  };

  const last = state.messages[state.messages.length - 1];
  const resumeOf = (id?: string) => resumes.find((r) => r._id === id)?.content;

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Bot className="h-7 w-7 text-primary" aria-hidden />
            {t("coach.title")}
          </h1>
          <p className="mt-1 text-sm text-muted">{t("coach.intro")}</p>
        </div>
        <Button type="button" variant="outline" onClick={() => void newChat()} disabled={chat.isPending}>
          <Plus className="h-4 w-4" /> {t("coach.newChat")}
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <section className="h-fit space-y-4 rounded-xl border bg-card p-4 sm:p-5" aria-label={t("coach.context")}>
          <SelectField
            label={t("coach.cv")}
            hint={t("coach.cvHint")}
            value={resumeId ?? ""}
            onChange={(value) => setState((s) => ({ ...s, resumeId: value }))}
            options={[{ value: "", label: t("coach.noCv") }, ...resumes.map((r) => ({ value: r._id, label: r.title }))]}
          />
          <TextAreaField
            label={t("coach.jobPost")}
            hint={t("coach.jobPostHint")}
            placeholder={t("ai.tailor.placeholder")}
            value={state.jobDescription}
            onChange={(value) => setState((s) => ({ ...s, jobDescription: value }))}
            rows={5}
            maxLength={12000}
          />
          <p className="text-xs text-muted">{t("coach.privacy")}</p>
        </section>

        <section className="flex min-h-[60vh] flex-col rounded-xl border bg-card" aria-label={t("coach.chat")}>
          <div ref={scrollRef} className="max-h-[65vh] flex-1 space-y-4 overflow-y-auto p-4 sm:p-5" aria-live="polite" aria-busy={chat.isPending}>
            {state.messages.length === 0 && (
              <div className="space-y-4 py-4 text-center">
                <Bot className="mx-auto h-10 w-10 text-primary" aria-hidden />
                <div>
                  <p className="font-semibold">{t("coach.welcomeTitle")}</p>
                  <p className="mx-auto mt-1 max-w-md text-sm text-muted">{t("coach.welcomeText")}</p>
                </div>
                <div className="mx-auto grid max-w-2xl gap-2 sm:grid-cols-2">
                  {STARTERS.map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => send(t(`coach.starters.${key}`))}
                      className="rounded-lg border px-3 py-2 text-left text-sm hover:bg-secondary focus-visible:outline-2 focus-visible:outline-primary"
                    >
                      {t(`coach.starters.${key}`)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {state.messages.map((message) => {
              const mine = message.role === "user";
              const edits = message.edits ?? [];
              const open = edits.filter((e) => !message.decisions?.[e.key]);
              return (
                <div key={message.id} className={cn("flex gap-2", mine && "flex-row-reverse")}>
                  <div className={cn("mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full", mine ? "bg-primary text-white" : "bg-secondary")} aria-hidden>
                    {mine ? <UserIcon className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>
                  <div className={cn("min-w-0 max-w-[85%] space-y-3", mine && "text-right")}>
                    <p className="sr-only">{mine ? t("coach.you") : t("coach.coach")}:</p>
                    <div
                      className={cn(
                        "inline-block whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-left text-sm leading-relaxed",
                        mine ? "bg-primary text-primary-foreground" : "bg-secondary"
                      )}
                    >
                      {message.content}
                    </div>
                    {edits.length > 0 && (
                      <div className="space-y-2 rounded-xl border border-primary/30 bg-primary/5 p-3 text-left">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-medium">{t("coach.edits", { title: resumes.find((r) => r._id === message.resumeId)?.title ?? "" })}</p>
                          {open.length > 1 && (
                            <Button type="button" size="sm" variant="outline" disabled={applying !== null} onClick={() => void apply(message, open)}>
                              {applying === message.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} {t("coach.applyAll")}
                            </Button>
                          )}
                        </div>
                        <ul className="space-y-2">
                          {edits.map((edit) => (
                            <EditCard
                              key={edit.key}
                              edit={edit}
                              decision={message.decisions?.[edit.key]}
                              label={pathLabel(edit.path, resumeOf(message.resumeId), t)}
                              busy={applying !== null}
                              onApply={() => void apply(message, [edit])}
                              onSkip={() => decide(message.id, { [edit.key]: "skipped" })}
                            />
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {chat.isPending && (
              <div className="flex items-center gap-2 text-sm text-muted" role="status">
                <Loader2 className="h-4 w-4 animate-spin" /> {t("coach.thinking")}
              </div>
            )}

            {!chat.isPending && last?.role === "assistant" && (last.suggestions?.length ?? 0) > 0 && (
              <div className="flex flex-wrap gap-2 pl-9">
                {last.suggestions!.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => send(suggestion)}
                    className="rounded-full border px-3 py-1.5 text-left text-xs hover:bg-secondary focus-visible:outline-2 focus-visible:outline-primary"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>

          <form onSubmit={onSubmit} className="space-y-2 border-t p-3 sm:p-4">
            <label htmlFor="coach-input" className="sr-only">
              {t("coach.placeholder")}
            </label>
            <div className="flex items-end gap-2">
              <textarea
                id="coach-input"
                ref={inputRef}
                rows={2}
                value={input}
                maxLength={MAX_MESSAGE}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={t("coach.placeholder")}
                className="min-h-[52px] w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-base leading-relaxed placeholder:text-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:text-sm"
              />
              <Button type="submit" variant="gradient" size="icon" disabled={chat.isPending || !input.trim()} aria-label={t("coach.send")}>
                {chat.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <QuotaNote />
              <p className="hidden text-xs text-muted sm:block">{t("coach.enterHint")}</p>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
