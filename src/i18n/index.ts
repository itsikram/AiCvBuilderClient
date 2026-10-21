import i18n, { type BackendModule } from "i18next";
import { initReactI18next } from "react-i18next";
import { getLangFromPath, isLocalizedPath, stripLangPrefix, type Lang } from "@/lib/i18nRouting";

const STORAGE_KEY = "i18nextLng";

const readStoredLanguage = (): Lang | null => {
  try {
    const saved = typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    return saved === "bn" || saved === "en" ? saved : null;
  } catch {
    return null;
  }
};

/**
 * Public pages take their language from the URL (/bn/...). App pages use the
 * visitor's saved choice, falling back to English.
 */
export const resolveInitialLanguage = (pathname: string): Lang => {
  if (isLocalizedPath(stripLangPrefix(pathname))) return getLangFromPath(pathname);
  return readStoredLanguage() ?? "en";
};

// Each language is its own chunk, loaded on first use, so visitors only download
// the one they read. scripts/check-i18n.mjs keeps both files in step, so no
// fallback language is needed.
const loaders: Record<Lang, () => Promise<{ default: Record<string, unknown> }>> = {
  en: () => import("./locales/en.json"),
  bn: () => import("./locales/bn.json"),
};

const lazyLocales: BackendModule = {
  type: "backend",
  init: () => undefined,
  read: (lng, _ns, callback) => {
    const load = loaders[lng as Lang];
    if (!load) return callback(new Error(`Unsupported language: ${lng}`), false);
    load().then(
      (m) => callback(null, m.default),
      (error: Error) => callback(error, false)
    );
  },
};

/** Resolves once the first language has loaded; render the app after it. */
export const i18nReady = i18n
  .use(lazyLocales)
  .use(initReactI18next)
  .init({
    lng: typeof window === "undefined" ? "en" : resolveInitialLanguage(window.location.pathname),
    fallbackLng: false,
    supportedLngs: ["en", "bn"],
    load: "languageOnly",
    interpolation: { escapeValue: false },
    returnNull: false,
  });

/** Switches the UI language and remembers it for app pages. */
export const setLanguage = (lang: Lang) => {
  if (i18n.language !== lang) i18n.changeLanguage(lang);
  try {
    if (typeof localStorage !== "undefined") localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* storage unavailable (private mode) */
  }
};

export default i18n;
