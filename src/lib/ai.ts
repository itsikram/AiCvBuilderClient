import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TFunction } from "i18next";
import api, { getErrorMessage } from "@/lib/api";
import i18n from "@/i18n";
import { useToast } from "@/components/ui/toast";
import { getAtPath } from "@/lib/resume/model";
import type { ResumeContent } from "@/types";

export type Tone = "formal" | "confident" | "friendly";
export const TONES: Tone[] = ["formal", "confident", "friendly"];

export interface AiQuota {
  dailyLimit: number;
  usedToday: number;
  monthlyLimit: number;
  usedThisMonth: number;
  resetsAt: string;
  watermarkPdf: boolean;
}

export const AI_QUOTA_KEY = ["ai-quota"] as const;

export function useAiQuota() {
  return useQuery({
    queryKey: AI_QUOTA_KEY,
    queryFn: async () => (await api.get("/resumes/ai/quota")).data.data as AiQuota,
    staleTime: 30_000,
  });
}

/** Requests left today, taking the monthly cap into account; null = unlimited. */
export const requestsLeft = (q: AiQuota | undefined): number | null => {
  if (!q) return null;
  const caps = [
    q.dailyLimit === -1 ? Infinity : q.dailyLimit - q.usedToday,
    q.monthlyLimit === -1 ? Infinity : q.monthlyLimit - q.usedThisMonth,
  ];
  const left = Math.min(...caps);
  return Number.isFinite(left) ? Math.max(0, left) : null;
};

/**
 * POSTs to an AI endpoint and returns `data`. Errors become a toast with the
 * server's message (already user-friendly); the quota is refreshed either way.
 */
export function useAiTask<TBody, TResult>(path: string | ((body: TBody) => string)) {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: async (body: TBody) => {
      const url = typeof path === "function" ? path(body) : path;
      return (await api.post(url, body, { timeout: 120_000 })).data.data as TResult;
    },
    onError: (error) => toast.add(getErrorMessage(error, i18n.t("common.error")), "error"),
    onSettled: () => queryClient.invalidateQueries({ queryKey: AI_QUOTA_KEY }),
  });
}

/** A CV change the AI proposes and the user approves (tailoring, career coach). */
export interface CvEdit {
  key: string;
  type: "rewrite" | "add_skill";
  path: string;
  before: string;
  after: string;
  reason: string;
}

const SECTION_OF: Record<string, string> = {
  trainings: "training",
  volunteerExperience: "volunteer",
  customSections: "custom",
};

/** "experience.0.bullets.2" -> "Work Experience · Accounts Intern" */
export function pathLabel(path: string, content: ResumeContent | undefined, t: TFunction) {
  if (path === "careerObjective") return t("cv.sections.objective");
  if (path === "personalInfo.summary") return t("cv.sections.summary");
  if (path.startsWith("personalInfo.")) return t(`editor.personal.${path.split(".")[1]}`);
  if (path === "skills") return t("cv.sections.skills");
  const [section, index] = path.split(".");
  const item = getAtPath(content, `${section}.${index}`) as Record<string, string> | undefined;
  const name = item?.position || item?.degree || item?.title || item?.name || item?.role || "";
  return [t(`cv.sections.${SECTION_OF[section] ?? section}`, { defaultValue: section }), name].filter(Boolean).join(" · ");
}

/**
 * useState that survives navigating away within the tab (sessionStorage), so AI
 * results the user paid quota for aren't lost. Falls back to memory only when
 * storage is unavailable.
 */
export function useSessionState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = sessionStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage full or blocked: keep the in-memory value */
    }
  }, [key, value]);
  return [value, setValue] as const;
}
