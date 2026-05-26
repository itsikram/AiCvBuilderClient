import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: "user" | "admin";
  language: "en" | "bn";
  theme: "light" | "dark" | "system";
  isEmailVerified: boolean;
  subscription: {
    plan: "free" | "premium";
    status: string;
    expiresAt?: string;
  };
  referralCode: string;
  referralCount?: number;
  usage?: {
    resumesCreated: number;
    aiRequestsThisMonth: number;
  };
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  setUser: (user: Partial<User>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      setAuth: (user, accessToken) => {
        localStorage.setItem("accessToken", accessToken);
        set({ user, accessToken, isAuthenticated: true });
      },
      setUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
      logout: () => {
        localStorage.removeItem("accessToken");
        set({ user: null, accessToken: null, isAuthenticated: false });
      },
    }),
    {
      name: "chakricv-auth",
      partialize: (s) => ({ user: s.user, isAuthenticated: s.isAuthenticated }),
      // On rehydrate, validate the state
      onRehydrateStorage: () => (state) => {
        if (state) {
          // If there's no user but isAuthenticated is true, reset it
          if (!state.user && state.isAuthenticated) {
            state.isAuthenticated = false;
          }
          // If there's a user but no accessToken in localStorage, reset auth
          if (state.user && !localStorage.getItem("accessToken")) {
            state.isAuthenticated = false;
            state.user = null;
          }
        }
      },
    }
  )
);
