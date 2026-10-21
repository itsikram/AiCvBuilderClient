import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api, { getErrorMessage } from "@/lib/api";
import i18n from "@/i18n";
import { useToast } from "@/components/ui/toast";

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
