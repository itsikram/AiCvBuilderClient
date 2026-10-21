/**
 * How each template slug (seeded by the API) is drawn. Colors are defaults: a
 * CV's own theme (accentColor etc.) overrides them.
 *
 * - classic: one column, underlined headings
 * - compact: one column, tighter spacing
 * - sidebar: skills, languages and other short lists in a left column
 * - bold:    dark full-width header band
 * - bd:      Bangladeshi standard format: photo top right, shaded headings,
 *            education and training as tables, personal details, declaration
 */
export type TemplateLayout = "classic" | "compact" | "sidebar" | "bold" | "bd";

export interface TemplateStyle {
  layout: TemplateLayout;
  accent: string;
  align: "left" | "center";
}

const t = (layout: TemplateLayout, accent: string, align: "left" | "center" = "left"): TemplateStyle => ({ layout, accent, align });

export const TEMPLATE_STYLES: Record<string, TemplateStyle> = {
  "modern-ats": t("classic", "#1d4ed8", "center"),
  "professional-bd": t("bd", "#047857"),
  "bd-government": t("bd", "#15803d"),
  "executive-pro": t("compact", "#27272a"),
  "creative-portfolio": t("sidebar", "#be123c"),
  international: t("classic", "#4338ca", "center"),
  "minimalist-clean": t("compact", "#374151"),
  "tech-professional": t("sidebar", "#0e7490"),
  "bold-modern": t("bold", "#5b21b6"),
  "academic-cv": t("classic", "#44403c"),
  "startup-ready": t("sidebar", "#0369a1"),
  "classic-professional": t("classic", "#334155", "center"),
  "global-corporate": t("classic", "#1e293b"),
  "finance-forward": t("compact", "#1e40af"),
  "consulting-elite": t("classic", "#3730a3"),
  "product-strategy": t("sidebar", "#115e59"),
  "data-analytics": t("sidebar", "#155e75"),
  "sales-growth": t("bold", "#92400e"),
  "customer-success": t("classic", "#065f46"),
  "remote-global": t("compact", "#5b21b6"),
  "legal-counsel": t("classic", "#27272a", "center"),
  "healthcare-operations": t("classic", "#0f766e"),
  "public-sector": t("bd", "#166534"),
  "humanitarian-program": t("sidebar", "#9f1239"),
  "communications-director": t("bold", "#9d174d"),
  "engineering-architecture": t("sidebar", "#075985"),
  "cloud-platform": t("classic", "#1e3a8a"),
  "venture-capital": t("bold", "#78350f"),
  "operations-precision": t("compact", "#1f2937"),
  "nonprofit-impact": t("classic", "#064e3b"),
  "recruiter-friendly": t("sidebar", "#9a3412"),
  "sustainability-lead": t("classic", "#3f6212"),
};

export const templateStyle = (slug?: string): TemplateStyle => TEMPLATE_STYLES[slug ?? ""] ?? TEMPLATE_STYLES["modern-ats"];

/** Font stacks offered in the design panel; Bangla always falls back to Hind Siliguri. */
export const FONT_OPTIONS = [
  { value: '"Inter Variable", Inter', label: "Inter" },
  { value: "Arial, Helvetica", label: "Arial" },
  { value: "Georgia", label: "Georgia" },
  { value: '"Times New Roman", Times', label: "Times New Roman" },
  { value: '"Hind Siliguri"', label: "Hind Siliguri (বাংলা)" },
];

export const fontStack = (value?: string) => {
  // Older CVs stored stacks like "Inter, ui-sans-serif, system-ui"
  const primary = (value || FONT_OPTIONS[0].value).replace(/^Inter\b(?! Variable)/, '"Inter Variable", Inter');
  const serif = /Georgia|Times/.test(primary);
  return `${primary}, "Hind Siliguri", "Noto Sans Bengali", ${serif ? "serif" : "system-ui, sans-serif"}`;
};
