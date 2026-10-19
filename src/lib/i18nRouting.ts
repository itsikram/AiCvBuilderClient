// Public marketing pages live at /path (English) and /bn/path (Bangla) so both
// languages are crawlable. App pages (dashboard, editor, auth, admin) are not
// prefixed; they use the visitor's saved language instead.

export type Lang = "en" | "bn";

export const LANGS: Lang[] = ["en", "bn"];

export const HREFLANG: Record<Lang, string> = { en: "en-BD", bn: "bn-BD" };

export const OG_LOCALE: Record<Lang, string> = { en: "en_US", bn: "bn_BD" };

/** Language encoded in a URL path: /bn and /bn/... are Bangla, everything else English. */
export const getLangFromPath = (pathname: string): Lang =>
  pathname === "/bn" || pathname.startsWith("/bn/") ? "bn" : "en";

/** Removes the /bn prefix: "/bn/templates" -> "/templates", "/bn" -> "/". */
export const stripLangPrefix = (pathname: string): string => {
  if (pathname === "/bn") return "/";
  return pathname.startsWith("/bn/") ? pathname.slice(3) : pathname;
};

/** Paths that exist in both languages (without the /bn prefix). */
const LOCALIZED_PREFIXES = [
  "/about",
  "/pricing",
  "/templates",
  "/blog",
  "/contact",
  "/cv-format-bangladesh",
  "/fresher-cv-format",
  "/government-job-cv",
  "/bdjobs-cv-format",
  "/biodata-format",
  "/cv-writing-tips",
  "/cover-letter-bangladesh",
];

export const isLocalizedPath = (path: string): boolean => {
  const clean = path.split(/[?#]/)[0];
  return (
    clean === "/" ||
    LOCALIZED_PREFIXES.some((prefix) => clean === prefix || clean.startsWith(`${prefix}/`))
  );
};

/** Turns an unprefixed public path into its URL for `lang`; other paths pass through. */
export const localizePath = (path: string, lang: Lang): string => {
  if (!path.startsWith("/") || lang === "en" || !isLocalizedPath(path)) return path;
  return path === "/" ? "/bn" : `/bn${path}`;
};

/** URL of the same page in the other language, or null when the page is not localized. */
export const alternatePath = (pathname: string, target: Lang): string | null => {
  const base = stripLangPrefix(pathname);
  if (!isLocalizedPath(base)) return null;
  return localizePath(base, target);
};
