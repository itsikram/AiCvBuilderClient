import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FONT_OPTIONS, templateStyle } from "@/components/resume/templates";
import type { Template } from "@/types";
import { CheckboxField, EditorSection, Grid, SelectField } from "./fields";

interface Props {
  templates: Template[] | undefined;
  templateId: string;
  theme: Record<string, string>;
  onTemplate: (slug: string) => void;
  onTheme: (theme: Record<string, string>) => void;
}

const CATEGORIES = ["all", "bangladeshi", "ats", "modern", "creative"] as const;
const COLOR_KEYS = ["accentColor", "headingColor", "textColor"] as const;

export function DesignPanel({ templates, templateId, theme, onTemplate, onTheme }: Props) {
  const { t } = useTranslation();
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("all");
  const style = templateStyle(templateId);
  const visible = (templates ?? []).filter((tpl) => category === "all" || tpl.category === category);
  const set = (key: string, value: string) => onTheme({ ...theme, [key]: value });
  const colorDefaults: Record<(typeof COLOR_KEYS)[number], string> = { accentColor: style.accent, headingColor: "#111827", textColor: "#1f2937" };

  return (
    <EditorSection id="sec-design" title={t("editor.design.title")}>
      <div>
        <p className="mb-2 text-sm font-medium">{t("editor.design.template")}</p>
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
                  <img
                    src={tpl.thumbnail || "/templates/fallback.svg"}
                    alt=""
                    width={240}
                    height={300}
                    loading="lazy"
                    className="aspect-[4/5] w-full bg-secondary object-cover object-top"
                    onError={(e) => ((e.target as HTMLImageElement).src = "/templates/fallback.svg")}
                  />
                  <span className="block px-2 py-1.5 text-xs font-medium">
                    {tpl.name}
                    {tpl.isPremium && <span className="ml-1 rounded bg-amber-100 px-1 text-[10px] text-amber-800">{t("editor.design.premium")}</span>}
                  </span>
                  {selected && (
                    <span className="absolute right-1.5 top-1.5 rounded-full bg-primary p-1 text-white">
                      <Check className="h-3.5 w-3.5" />
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

      <Grid cols={3}>
        {COLOR_KEYS.map((key) => (
          <label key={key} className="text-sm font-medium">
            {t(`editor.design.${key === "accentColor" ? "accent" : key === "headingColor" ? "heading" : "text"}`)}
            <input type="color" className="mt-1 block h-11 w-full cursor-pointer rounded-lg border bg-background p-1" value={theme[key] || colorDefaults[key]} onChange={(e) => set(key, e.target.value)} />
          </label>
        ))}
      </Grid>
      <Grid>
        <SelectField label={t("editor.design.font")} value={FONT_OPTIONS.find((f) => theme.fontFamily?.startsWith(f.value))?.value ?? FONT_OPTIONS[0].value} onChange={(v) => set("fontFamily", v)} options={FONT_OPTIONS} />
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
        onClick={() => onTheme(Object.fromEntries(Object.entries(theme).filter(([k]) => !COLOR_KEYS.includes(k as never) && !k.startsWith("gradient"))))}
      >
        {t("editor.design.reset")}
      </Button>
    </EditorSection>
  );
}
