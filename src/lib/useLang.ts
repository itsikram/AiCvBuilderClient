import { useCallback } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getLangFromPath, isLocalizedPath, localizePath, stripLangPrefix, type Lang } from "@/lib/i18nRouting";
import { normalizeLanguage } from "@/lib/language";

/**
 * Current UI language plus `lp()`, which turns an unprefixed public path into
 * the URL for that language ("/pricing" -> "/bn/pricing" on Bangla pages).
 */
export function useLang() {
  const { pathname } = useLocation();
  const { i18n } = useTranslation();
  const onPublicPage = isLocalizedPath(stripLangPrefix(pathname));
  const lang: Lang = onPublicPage ? getLangFromPath(pathname) : normalizeLanguage(i18n.language);
  const lp = useCallback((path: string) => localizePath(path, lang), [lang]);
  return { lang, lp, onPublicPage };
}
