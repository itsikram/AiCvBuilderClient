import { memo, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, ChevronDown, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FONT_OPTIONS, templateStyle, themeWithoutColors } from "@/components/resume/templates";
import { ResumePreview } from "@/components/resume/ResumePreview";
import type { CvLang } from "@/lib/resume/model";
import type { ResumeContent, Template } from "@/types";
import { CheckboxField, EditorSection, Grid, SelectField } from "./fields";

interface Props {
  templates: Template[] | undefined;
  templateId: string;
  theme: Record<string, string>;
  onTemplate: (slug: string) => void;
  onTheme: (theme: Record<string, string>) => void;
  /** The CV itself, drawn in every template card */
  content: ResumeContent;
  sectionOrder: string[];
  language: CvLang;
}

const CATEGORIES = ["all", "bangladeshi", "ats", "modern", "creative"] as const;
const COLOR_KEYS = ["accentColor", "headingColor", "textColor"] as const;

interface ThumbProps {
  slug: string;
  content: ResumeContent;
  theme: Record<string, string>;
  sectionOrder: string[];
  language: CvLang;
}

/** The first page of this CV in a template, drawn only once the card scrolls near the screen. */
const TemplateThumb = memo(function TemplateThumb({ slug, ...props }: ThumbProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || near) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: "300px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [near]);
  return (
    <div ref={ref} className="pointer-events-none aspect-[210/297] w-full overflow-hidden bg-white" aria-hidden inert>
      {near ? <ResumePreview templateId={slug} {...props} /> : <div className="h-full w-full animate-pulse bg-secondary" />}
    </div>
  );
});

export function DesignPanel({ templates, templateId, theme, onTemplate, onTheme, content, sectionOrder, language }: Props) {
  const { t } = useTranslation();
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("all");
  const [customOpen, setCustomOpen] = useState(false);
  // Cards show each template's own colours, as choosing one does
  const thumbTheme = useMemo(() => themeWithoutColors(theme), [theme]);
  const style = templateStyle(templateId);
  const visible = (templates ?? []).filter((tpl) => category === "all" || tpl.category === category);
  const set = (key: string, value: string) => onTheme({ ...theme, [key]: value });
  const colorDefaults: Record<(typeof COLOR_KEYS)[number], string> = { accentColor: style.accent, headingColor: "#111827", textColor: "#1f2937" };

  return (
    <EditorSection id="sec-design" title={t("editor.design.title")}>
      <div>
        <p className="text-sm font-medium">{t("editor.design.template")}</p>
        <p className="mb-3 mt-0.5 text-sm text-muted">{t("editor.design.templateHint")}</p>
        <div className="mb-3 flex flex-wrap gap-2" role="tablist">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              role="tab"
              aria-selected={category === c}
              onClick={() => setCategory(c)}
              className={cn("rounded-full border px-3 py-1 text-sm", category === c ? "border-primary bg-primary text-white" : "hover:bg-secondary")}
            >
              {t(`editor.design.categories.${c}`)}
            </button>
          ))}
        </div>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {visible.map((tpl) => {
            const selected = tpl.slug === templateId;
            return (
              <li key={tpl._id}>
                <button
                  type="button"
                  disabled={tpl.locked}
                  aria-pressed={selected}
                  onClick={() => onTemplate(tpl.slug)}
                  className={cn(
                    "group relative w-full overflow-hidden rounded-lg border-2 bg-background text-left transition focus-visible:outline-2 focus-visible:outline-primary",
                    selected ? "border-primary" : "border-transparent ring-1 ring-border hover:ring-primary/50",
                    tpl.locked && "cursor-not-allowed opacity-60"
                  )}
                >
                  <TemplateThumb slug={tpl.slug} content={content} theme={thumbTheme} sectionOrder={sectionOrder} language={language} />
                  <span className="block border-t px-2 py-1.5 text-xs font-medium">
                    {tpl.name}
                    {tpl.isPremium && <span className="ml-1 rounded bg-amber-100 px-1 text-[10px] text-amber-800">{t("editor.design.premium")}</span>}
                  </span>
                  {selected && (
                    <span className="absolute right-1.5 top-1.5 rounded-full bg-primary p-1 text-white shadow">
                      <Check className="h-4 w-4" />
                    </span>
                  )}
                  {tpl.locked && (
                    <span className="absolute inset-x-0 top-1/3 mx-2 flex items-center justify-center gap-1 rounded bg-black/70 px-2 py-1 text-[11px] text-white">
                      <Lock className="h-3 w-3" /> {t("editor.design.locked")}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
        {templates?.some((tpl) => tpl.locked) && (
          <Link to="/dashboard/billing" className="mt-2 inline-block text-sm text-primary underline underline-offset-2">
            {t("editor.design.locked")}
          </Link>
        )}
      </div>

      <div>
        <button
          type="button"
          className="flex items-center gap-1 text-sm font-medium text-primary"
          aria-expanded={customOpen}
          aria-controls="design-custom"
          onClick={() => setCustomOpen((v) => !v)}
        >
          <ChevronDown className={cn("h-4 w-4 transition-transform", !customOpen && "-rotate-90")} aria-hidden />
          {t("editor.design.customize")} <span className="font-normal text-muted">({t("common.optional")})</span>
        </button>
        {customOpen && (
          <div id="design-custom" className="mt-3 space-y-4">
            <Grid cols={3}>
              {COLOR_KEYS.map((key) => (
                <label key={key} className="text-sm font-medium">
                  {t(`editor.design.${key === "accentColor" ? "accent" : key === "headingColor" ? "heading" : "text"}`)}
                  <input type="color" className="mt-1 block h-11 w-full cursor-pointer rounded-lg border bg-background p-1" value={theme[key] || colorDefaults[key]} onChange={(e) => set(key, e.target.value)} />
                </label>
              ))}
            </Grid>
            <Grid>
              <SelectField label={t("editor.design.font")} value={FONT_OPTIONS.find((f) => (theme.fontFamily || style.font)?.startsWith(f.value))?.value ?? FONT_OPTIONS[0].value} onChange={(v) => set("fontFamily", v)} options={FONT_OPTIONS} />
              <SelectField
                label={t("editor.design.spacing")}
                value={theme.sectionSpacing || "medium"}
                onChange={(v) => set("sectionSpacing", v)}
                options={[
                  { value: "small", label: t("editor.design.spacingSmall") },
                  { value: "medium", label: t("editor.design.spacingMedium") },
                  { value: "large", label: t("editor.design.spacingLarge") },
                ]}
              />
            </Grid>
            <Grid cols={3}>
              <SelectField label={t("editor.design.nameSize")} value={theme.nameFontSize || "22"} onChange={(v) => set("nameFontSize", v)} options={["18", "20", "22", "24", "26", "28"].map((v) => ({ value: v, label: v }))} />
              <SelectField label={t("editor.design.headingSize")} value={theme.headingFontSize || "11.5"} onChange={(v) => set("headingFontSize", v)} options={["10.5", "11", "11.5", "12", "13", "14"].map((v) => ({ value: v, label: v }))} />
              <SelectField label={t("editor.design.bodySize")} value={theme.bodyFontSize || "10"} onChange={(v) => set("bodyFontSize", v)} options={["9", "9.5", "10", "10.5", "11", "12"].map((v) => ({ value: v, label: v }))} />
            </Grid>
            {style.layout === "bold" && (
              <Grid cols={3}>
                {(["gradientStart", "gradientEnd"] as const).map((key) => (
                  <label key={key} className="text-sm font-medium">
                    {t(`editor.design.${key}`)}
                    <input type="color" className="mt-1 block h-11 w-full cursor-pointer rounded-lg border bg-background p-1" value={theme[key] || style.accent} onChange={(e) => set(key, e.target.value)} />
                  </label>
                ))}
                <SelectField
                  label={t("editor.design.gradientDirection")}
                  value={theme.gradientDirection || "to-right"}
                  onChange={(v) => set("gradientDirection", v)}
                  options={[
                    { value: "to-right", label: "→" },
                    { value: "to-bottom", label: "↓" },
                  ]}
                />
              </Grid>
            )}
            {style.layout === "bd" && (
              <CheckboxField label={t("editor.design.declaration")} checked={theme.showDeclaration !== "false"} onChange={(v) => set("showDeclaration", v ? "true" : "false")} />
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onTheme(themeWithoutColors(theme))}
            >
              {t("editor.design.reset")}
            </Button>
          </div>
        )}
      </div>
    </EditorSection>
  );
}
