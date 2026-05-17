import { create } from "zustand";
import { persist } from "zustand/middleware";

type Theme = "light" | "dark" | "system";

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
        document.documentElement.classList.toggle("dark", resolved === "dark");
        set({ theme, resolvedTheme: resolved });
      },
    }),
    {
      name: "chakricv-theme",
      onRehydrateStorage: () => (state) => {
        if (state) {
          const resolved =
            state.theme === "system" ? getSystemTheme() : state.theme;
          document.documentElement.classList.toggle("dark", resolved === "dark");
          state.resolvedTheme = resolved;
        }
      },
    }
  )
);
