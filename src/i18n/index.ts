import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import bn from "./locales/bn.json";
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

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, bn: { translation: bn } },
  lng: "en",
  fallbackLng: "en",
  supportedLngs: ["en", "bn"],
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
