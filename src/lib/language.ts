export type SupportedLanguage = "en" | "bn";

export const normalizeLanguage = (value?: string | null): SupportedLanguage => {
  if (typeof value !== "string") {
    return "en";
  }

  const normalized = value.toLowerCase();

  if (normalized.startsWith("bn")) {
    return "bn";
  }

  if (normalized.startsWith("en")) {
    return "en";
  }

  return "en";
};
