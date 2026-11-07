import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { AI_QUOTA_KEY } from "@/lib/ai";
import { useAuthStore, type User } from "@/store/authStore";

/** The signed-in user's free Premium trial, as GET /payments/trial reports it. */
export interface TrialInfo {
  /** Trial length on offer in days (0: none). Set per plan in Admin -> Plans. */
  days: number;
  available: boolean;
  reason?: "used" | "premium" | "unverified" | "none";
  /** True while the user's trial is running */
  active: boolean;
  startedAt?: string;
  endsAt?: string;
}

export const TRIAL_KEY = ["trial"] as const;

/** Whether the signed-in user can start the trial, or how long theirs runs. */
export const useTrial = (enabled = true) => {
  const authed = useAuthStore((state) => state.isAuthenticated);
  return useQuery({
    queryKey: TRIAL_KEY,
    queryFn: async () => (await api.get("/payments/trial")).data.data as TrialInfo,
    enabled: enabled && authed,
    staleTime: 60_000,
  });
};

/** Starts the trial and updates the stored user, the trial info and the AI quota (Premium limits). */
export const useStartTrial = () => {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);
  return useMutation({
    mutationFn: async () =>
      (await api.post("/payments/trial")).data as { message: string; data: { trial: TrialInfo; subscription: User["subscription"] } },
    onSuccess: ({ data }) => {
      setUser({ subscription: data.subscription });
      queryClient.setQueryData(TRIAL_KEY, data.trial);
      queryClient.invalidateQueries({ queryKey: AI_QUOTA_KEY });
    },
  });
};

/** Whole days left until `endsAt` (rounded up, so "1 day left" until the very end). */
export const daysLeft = (endsAt?: string) =>
  endsAt ? Math.max(0, Math.ceil((new Date(endsAt).getTime() - Date.now()) / 86_400_000)) : 0;

/** A number in the UI language's digits (Bangla text reads ৭, not 7). */
export const localNumber = (value: number, lang: string) => value.toLocaleString(lang === "bn" ? "bn-BD" : "en");

/**
 * Refreshes the stored user's plan and account flags from the server. The browser keeps the user
 * from sign-in, so without this a trial that ended or a payment an admin approved would only
 * show after logging in again. The server enforces the plan either way.
 */
export const useRefreshUser = () => {
  const authed = useAuthStore((state) => state.isAuthenticated);
  const setUser = useAuthStore((state) => state.setUser);
  const { data } = useQuery({
    queryKey: ["me"],
    queryFn: async () => (await api.get("/auth/me")).data.data as User,
    enabled: authed,
    staleTime: 5 * 60_000,
  });
  useEffect(() => {
    if (!data) return;
    setUser({ subscription: data.subscription, role: data.role, isEmailVerified: data.isEmailVerified, usage: data.usage });
  }, [data, setUser]);
};
