// Single source of truth for brand and canonical-origin values used in the client.

export const SITE_NAME = "AI CV Builder BD";
export const SITE_NAME_BN = "এআই সিভি বিল্ডার বিডি";

/** Canonical public origin without a trailing slash, e.g. https://aicvbuilderbd.online */
export const SITE_URL = (
  import.meta.env.VITE_SITE_URL ||
  import.meta.env.VITE_APP_URL ||
  "https://aicvbuilderbd.online"
).replace(/\/+$/, "");

export const SUPPORT_EMAIL = "support@aicvbuilderbd.online";

export const absoluteUrl = (path = "/") =>
  /^https?:\/\//i.test(path) ? path : `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;

export const siteName = (lang: string) => (lang === "bn" ? SITE_NAME_BN : SITE_NAME);
