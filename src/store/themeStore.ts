import { create } from "zustand";
import { persist } from "zustand/middleware";

type Theme = "light" | "dark" | "system";

/** Exactly one of .light/.dark on <html>; .light stops the CSS following a dark device setting. */
export const applyThemeClass = (resolved: "light" | "dark") => {
  document.documentElement.classList.toggle("dark", resolved === "dark");
  document.documentElement.classList.toggle("light", resolved === "light");
};

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark";
}

const getSystemTheme = (): "light" | "dark" =>
  window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: "system",
      resolvedTheme: "light",
      setTheme: (theme) => {
        const resolved = theme === "system" ? getSystemTheme() : theme;
        applyThemeClass(resolved);
        set({ theme, resolvedTheme: resolved });
      },
    }),
    {
      name: "aicvbuilderbd-theme",
      onRehydrateStorage: () => (state) => {
        if (state) {
          const resolved =
            state.theme === "system" ? getSystemTheme() : state.theme;
          applyThemeClass(resolved);
          state.resolvedTheme = resolved;
        }
      },
    }
  )
);
