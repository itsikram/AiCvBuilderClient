import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { TFunction } from "i18next";
import i18n from "@/i18n";
import type { Education, ResumeContent } from "@/types";
import { cn } from "@/lib/utils";
import { fullSectionOrder, normalizeContent, sectionHasContent, type CvLang, type SectionId } from "@/lib/resume/model";
import { fontStack, templateStyle, type TemplateLayout } from "./templates";

/**
 * Renders a CV as an A4 page. The same markup is used for the on-screen preview
 * (scaled to fit its container) and for printing / "Save as PDF" (real size), so
 * the PDF matches the preview, and the browser shapes Bangla text correctly.
 * Headings follow the CV's language, not the UI language.
 */
interface Props {
  content: ResumeContent;
  templateId?: string;
  theme?: Record<string, string>;
  sectionOrder?: string[];
  language?: CvLang;
  className?: string;
  /** Dashed lines where printed pages will end (approximate) */
  showPageBreaks?: boolean;
  /** "fit" scales the page to the container width; "print" renders it at real size */
  mode?: "fit" | "print";
  /** Free-plan footer line on exported PDFs */
  watermark?: boolean;
}

const MM = 96 / 25.4;
const PAGE_WIDTH = Math.round(210 * MM);
const PAD_X = 16; // mm
const PAD_Y = 14; // mm
// Printed with @page { margin: 12mm 0 } and no top margin on page 1 (index.css)
const FIRST_PAGE_MM = 297 - 12;
const NEXT_PAGE_MM = 297 - 24;

const SIDEBAR_SECTIONS: SectionId[] = ["skills", "languages", "certifications", "interests", "courses"];
const SPACING = { small: 8, medium: 13, large: 18 } as const;
const PHOTO_MM = { small: 22, medium: 28, large: 34 } as const;

/** "2024-01" or "2024-01-15" -> "Jan 2024" / "জানু, ২০২৪"; free text is kept as typed. */
const formatMonth = (value: string | undefined, lang: CvLang) => {
  const v = (value ?? "").trim();
  const m = v.match(/^(\d{4})-(\d{2})(?:-\d{2})?$/);
  if (!m) return v;
  const date = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, 1));
  return new Intl.DateTimeFormat(lang === "bn" ? "bn-BD" : "en-GB", { month: "short", year: "numeric", timeZone: "UTC" }).format(date);
};

const range = (start: string | undefined, end: string | undefined, current: boolean | undefined, lang: CvLang, t: TFunction) => {
  const from = formatMonth(start, lang);
  const to = current ? t("cv.present") : formatMonth(end, lang);
  return [from, to].filter(Boolean).join(" – ");
};

const joinParts = (...parts: Array<string | undefined | false>) => parts.filter((p) => p && String(p).trim()).join(" · ");

const isSchool = (e: Education) => e.level === "ssc" || e.level === "hsc";

const degreeLabel = (e: Education, t: TFunction) => e.degree?.trim() || (e.level ? t(`cv.levels.${e.level}`, { defaultValue: "" }) : "");

const resultLabel = (e: Education, t: TFunction) => {
  if (!e.gpa?.trim()) return "";
  const school = isSchool(e) || e.gpaScale === "5.00" || e.gpaScale === "5";
  const label = /^\d/.test(e.gpa.trim()) ? t(school ? "cv.gpa" : "cv.cgpa") : "";
  return e.gpaScale?.trim()
    ? t("cv.resultFormat", { label, gpa: e.gpa.trim(), scale: e.gpaScale.trim() }).trim()
    : `${label} ${e.gpa.trim()}`.trim();
};

interface Ctx {
  c: ResumeContent;
  t: TFunction;
  lang: CvLang;
  layout: TemplateLayout;
  accent: string;
  heading: string;
  headingSize: number;
  spacing: number;
  inSidebar?: boolean;
}

function Heading({ ctx, children }: { ctx: Ctx; children: ReactNode }) {
  const bd = ctx.layout === "bd";
  const style: CSSProperties = bd
    ? {
        color: ctx.heading,
        background: `${ctx.accent}1f`,
        borderLeft: `4px solid ${ctx.accent}`,
        padding: "2px 8px",
        fontSize: `${ctx.headingSize}pt`,
      }
    : {
        color: ctx.heading,
        borderBottom: `1.5px solid ${ctx.accent}`,
        paddingBottom: 2,
        fontSize: `${ctx.headingSize}pt`,
        // Letter spacing breaks Bangla conjuncts, and Bangla has no upper case
        ...(ctx.lang === "en" ? { letterSpacing: "0.06em", textTransform: "uppercase" } : {}),
      };
  return (
    <h2 className="cv-heading font-bold" style={{ ...style, marginBottom: 6 }}>
      {children}
    </h2>
  );
}

function Section({ ctx, title, children }: { ctx: Ctx; title: string; children: ReactNode }) {
  return (
    <section className="cv-section" style={{ marginBottom: ctx.spacing }}>
      <Heading ctx={ctx}>{title}</Heading>
      {children}
    </section>
  );
}

function EntryTitle({ title, sub, dates }: { title?: string; sub?: string; dates?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <p>
        {title && <strong>{title}</strong>}
        {title && sub ? ", " : ""}
        {sub && <span>{sub}</span>}
      </p>
      {dates && <p className="shrink-0 whitespace-nowrap text-[0.9em] opacity-75">{dates}</p>}
    </div>
  );
}

const inline = (items: string[]) => items.map((s) => s.trim()).filter(Boolean).join(" • ");

function Table({ head, rows, accent }: { head: string[]; rows: string[][]; accent: string }) {
  return (
    <table className="cv-table w-full border-collapse text-[0.92em]">
      <thead>
        <tr>
          {head.map((h) => (
            <th key={h} className="border px-1.5 py-1 text-left font-semibold" style={{ borderColor: `${accent}55`, background: `${accent}12` }}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} className="cv-entry">
            {row.map((cell, j) => (
              <td key={j} className="border px-1.5 py-1 align-top" style={{ borderColor: `${accent}55` }}>
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function renderSection(id: SectionId, ctx: Ctx): ReactNode {
  const { c, t, lang } = ctx;
  if (!sectionHasContent(id, c)) return null;
  const title = t(`cv.sections.${id}`);
  const bd = ctx.layout === "bd";

  switch (id) {
    case "objective":
      return (
        <Section key={id} ctx={ctx} title={title}>
          <p className="whitespace-pre-line text-justify">{c.careerObjective}</p>
        </Section>
      );
    case "summary":
      return (
        <Section key={id} ctx={ctx} title={title}>
          <p className="whitespace-pre-line text-justify">{c.personalInfo.summary}</p>
        </Section>
      );
    case "experience":
      return (
        <Section key={id} ctx={ctx} title={title}>
          {c.experience.map((e) => (
            <div key={e.id} className="cv-entry" style={{ marginBottom: 6 }}>
              <EntryTitle title={e.position} sub={joinParts(e.company, e.location)} dates={range(e.startDate, e.endDate, e.current, lang, t)} />
              {e.bullets.some((b) => b.trim()) && (
                <ul className="mt-0.5 list-disc space-y-0.5 pl-5">
                  {e.bullets.filter((b) => b.trim()).map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </Section>
      );
    case "education": {
      const items = c.education.filter((e) => degreeLabel(e, t) || e.institution);
      if (bd && !ctx.inSidebar) {
        return (
          <Section key={id} ctx={ctx} title={title}>
            <Table
              accent={ctx.accent}
              head={[t("cv.table.exam"), t("cv.table.group"), t("cv.table.institution"), t("cv.table.board"), t("cv.table.year"), t("cv.table.result")]}
              rows={items.map((e) => [degreeLabel(e, t), e.field ?? "", e.institution, e.board ?? "", e.passingYear || formatMonth(e.endDate, lang), resultLabel(e, t)])}
            />
          </Section>
        );
      }
      return (
        <Section key={id} ctx={ctx} title={title}>
          {items.map((e) => (
            <div key={e.id} className="cv-entry" style={{ marginBottom: 5 }}>
              <EntryTitle
                title={degreeLabel(e, t)}
                sub={e.field}
                dates={e.passingYear || range(e.startDate, e.endDate, false, lang, t)}
              />
              <p className="opacity-90">{joinParts(e.institution, e.board, resultLabel(e, t))}</p>
            </div>
          ))}
        </Section>
      );
    }
    case "training": {
      const items = (c.trainings ?? []).filter((x) => x.title?.trim() || x.institute?.trim());
      if (bd) {
        return (
          <Section key={id} ctx={ctx} title={title}>
            <Table
              accent={ctx.accent}
              head={[t("cv.table.training"), t("cv.table.institution"), t("cv.table.duration"), t("cv.table.year")]}
              rows={items.map((x) => [x.title, x.institute, x.duration ?? "", x.year ?? ""])}
            />
          </Section>
        );
      }
      return (
        <Section key={id} ctx={ctx} title={title}>
          {items.map((x) => (
            <div key={x.id} className="cv-entry" style={{ marginBottom: 4 }}>
              <EntryTitle title={x.title} sub={x.institute} dates={joinParts(x.duration, x.year)} />
              {x.description && <p className="opacity-90">{x.description}</p>}
            </div>
          ))}
        </Section>
      );
    }
    case "skills":
      return (
        <Section key={id} ctx={ctx} title={title}>
          {ctx.inSidebar ? (
            <ul className="space-y-0.5">
              {c.skills.filter((s) => s.trim()).map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          ) : (
            <p>{inline(c.skills)}</p>
          )}
        </Section>
      );
    case "languages": {
      const items = c.languages.filter((l) => l.name.trim()).map((l) => `${l.name} (${t(`cv.proficiency.${l.proficiency}`)})`);
      return (
        <Section key={id} ctx={ctx} title={title}>
          {ctx.inSidebar ? (
            <ul className="space-y-0.5">
              {items.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          ) : (
            <p>{inline(items)}</p>
          )}
        </Section>
      );
    }
    case "projects":
      return (
        <Section key={id} ctx={ctx} title={title}>
          {c.projects.map((p) => (
            <div key={p.id} className="cv-entry" style={{ marginBottom: 5 }}>
              <EntryTitle title={p.name} sub={p.url} />
              {p.description && <p className="whitespace-pre-line">{p.description}</p>}
              {p.technologies.length > 0 && <p className="text-[0.9em] opacity-75">{p.technologies.join(", ")}</p>}
            </div>
          ))}
        </Section>
      );
    case "certifications":
      return (
        <Section key={id} ctx={ctx} title={title}>
          {c.certifications.map((x) => (
            <div key={x.id} className="cv-entry" style={{ marginBottom: 3 }}>
              {ctx.inSidebar ? (
                <>
                  <p className="font-semibold">{x.name}</p>
                  <p className="text-[0.9em] opacity-80">{joinParts(x.issuer, formatMonth(x.date, lang))}</p>
                </>
              ) : (
                <EntryTitle title={x.name} sub={x.issuer} dates={formatMonth(x.date, lang)} />
              )}
            </div>
          ))}
        </Section>
      );
    case "awards":
      return (
        <Section key={id} ctx={ctx} title={title}>
          {c.awards.map((x) => (
            <div key={x.id} className="cv-entry" style={{ marginBottom: 4 }}>
              <EntryTitle title={x.title} sub={x.issuer} dates={formatMonth(x.date, lang)} />
              {x.description && <p className="opacity-90">{x.description}</p>}
            </div>
          ))}
        </Section>
      );
    case "publications":
      return (
        <Section key={id} ctx={ctx} title={title}>
          {c.publications.map((x) => (
            <div key={x.id} className="cv-entry" style={{ marginBottom: 4 }}>
              <EntryTitle title={x.title} sub={x.publisher} dates={formatMonth(x.date, lang)} />
              {x.description && <p className="opacity-90">{x.description}</p>}
            </div>
          ))}
        </Section>
      );
    case "volunteer":
      return (
        <Section key={id} ctx={ctx} title={title}>
          {c.volunteerExperience.map((x) => (
            <div key={x.id} className="cv-entry" style={{ marginBottom: 4 }}>
              <EntryTitle title={x.role} sub={x.organization} dates={range(x.startDate, x.endDate, x.current, lang, t)} />
              {x.description && <p className="opacity-90">{x.description}</p>}
            </div>
          ))}
        </Section>
      );
    case "courses":
      return (
        <Section key={id} ctx={ctx} title={title}>
          {c.courses.map((x) => (
            <div key={x.id} className="cv-entry" style={{ marginBottom: 3 }}>
              <EntryTitle title={x.name} sub={x.provider} dates={ctx.inSidebar ? undefined : formatMonth(x.date, lang)} />
            </div>
          ))}
        </Section>
      );
    case "memberships":
      return (
        <Section key={id} ctx={ctx} title={title}>
          {c.memberships.map((x) => (
            <div key={x.id} className="cv-entry" style={{ marginBottom: 3 }}>
              <EntryTitle title={x.organization} sub={x.role} dates={range(x.startDate, x.endDate, x.current, lang, t)} />
            </div>
          ))}
        </Section>
      );
    case "interests":
      return (
        <Section key={id} ctx={ctx} title={title}>
          <p>{inline(c.interests)}</p>
        </Section>
      );
    case "custom":
      return c.customSections
        .filter((s) => s.title.trim() || s.content.trim())
        .map((s, i) => (
          <Section key={`custom-${i}`} ctx={ctx} title={s.title}>
            <p className="whitespace-pre-line">{s.content}</p>
          </Section>
        ));
    case "personalDetails": {
      const d = c.personalDetails ?? {};
      const rows = (
        ["fatherName", "motherName", "dateOfBirth", "gender", "nationality", "religion", "maritalStatus", "bloodGroup", "nid", "permanentAddress"] as const
      )
        .filter((k) => d[k]?.trim())
        .map((k) => [t(`cv.details.${k}`), k === "dateOfBirth" ? formatDay(d[k]!, lang) : d[k]!]);
      return (
        <Section key={id} ctx={ctx} title={title}>
          <table className="w-full border-collapse">
            <tbody>
              {rows.map(([label, value]) => (
                <tr key={label} className="cv-entry">
                  <td className="w-[34%] py-0.5 pr-2 align-top font-medium">{label}</td>
                  <td className="w-3 py-0.5 align-top">:</td>
                  <td className="py-0.5 align-top">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      );
    }
    case "references":
      return (
        <Section key={id} ctx={ctx} title={title}>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            {c.references.filter((r) => r.name.trim()).map((r) => (
              <div key={r.id} className="cv-entry">
                <p className="font-semibold">{r.name}</p>
                {(r.position || r.company) && <p>{joinParts(r.position, r.company)}</p>}
                {r.phone && <p>{t("cv.phone")}: {r.phone}</p>}
                {r.email && <p>{t("cv.email")}: {r.email}</p>}
                {r.relationship && <p className="opacity-80">{t("cv.relationship")}: {r.relationship}</p>}
              </div>
            ))}
          </div>
        </Section>
      );
  }
}

/** "1999-05-21" -> "21 May 1999" / "২১ মে, ১৯৯৯"; free text is kept as typed. */
const formatDay = (value: string, lang: CvLang) => {
  const m = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return value;
  const date = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return new Intl.DateTimeFormat(lang === "bn" ? "bn-BD" : "en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(date);
};

function CvPage({ content, templateId, theme = {}, sectionOrder, language = "en", watermark, print }: Props & { print: boolean }) {
  const c = normalizeContent(content);
  const t = i18n.getFixedT(language);
  const style = templateStyle(templateId);
  const layout = style.layout;
  const accent = theme.accentColor || style.accent;
  const text = theme.textColor || "#1f2937";
  const heading = theme.headingColor || text;
  const body = Number(theme.bodyFontSize) || 10;
  const ctx: Ctx = {
    c,
    t,
    lang: language,
    layout,
    accent,
    heading,
    headingSize: Number(theme.headingFontSize) || 11.5,
    spacing: SPACING[(theme.sectionSpacing as keyof typeof SPACING) || "medium"] ?? SPACING.medium,
  };
  const p = c.personalInfo;
  const order = fullSectionOrder(sectionOrder);
  const sidebar = layout === "sidebar";
  const main = order.filter((id) => !sidebar || !SIDEBAR_SECTIONS.includes(id));
  const side = sidebar ? order.filter((id) => SIDEBAR_SECTIONS.includes(id)) : [];

  const photoSize = PHOTO_MM[p.profilePhotoSize ?? "medium"] ?? PHOTO_MM.medium;
  const photo = p.profilePhoto ? (
    <img
      src={p.profilePhoto}
      alt=""
      className={cn("shrink-0 object-cover", layout === "bd" ? "rounded-sm border" : "rounded-full")}
      style={
        layout === "bd"
          ? { width: `${photoSize}mm`, height: `${photoSize * 1.22}mm`, borderColor: `${accent}66` }
          : { width: `${photoSize}mm`, height: `${photoSize}mm` }
      }
    />
  ) : null;

  const bold = layout === "bold";
  const centered = style.align === "center" && layout !== "bd" && p.profilePhotoAlignment !== "left" && p.profilePhotoAlignment !== "right";
  const contact = [p.phone, p.email, p.location].filter((x) => x?.trim());
  const links = [p.linkedin, p.github, p.portfolio, p.website].filter((x) => x?.trim());
  const headerBg = theme.gradientStart && theme.gradientEnd
    ? `linear-gradient(${theme.gradientDirection === "to-bottom" ? "180deg" : "90deg"}, ${theme.gradientStart}, ${theme.gradientEnd})`
    : accent;

  const header = (
    <header
      className={cn("cv-header flex gap-4", centered ? "flex-col items-center text-center" : "items-start", photo && p.profilePhotoAlignment === "left" && !centered && "flex-row-reverse justify-end")}
      style={
        bold
          ? { background: headerBg, color: "#fff", margin: `-${PAD_Y}mm -${PAD_X}mm 16px`, padding: `${PAD_Y}mm ${PAD_X}mm 18px` }
          : { marginBottom: 14, paddingBottom: layout === "bd" ? 8 : 10, borderBottom: layout === "bd" ? `2px solid ${accent}` : undefined }
      }
    >
      {centered && photo}
      <div className="min-w-0 flex-1">
        <h1 className="font-bold leading-tight" style={{ fontSize: `${Number(theme.nameFontSize) || 22}pt`, color: bold ? "#fff" : heading }}>
          {p.fullName || t("cv.yourName")}
        </h1>
        {p.jobTitle && (
          <p className="mt-0.5 font-semibold" style={{ color: bold ? "#ffffffd9" : accent, fontSize: "1.1em" }}>
            {p.jobTitle}
          </p>
        )}
        {layout === "bd" ? (
          <div className="mt-1.5 space-y-0.5 text-[0.95em]">
            {p.location && <p>{t("cv.address")}: {p.location}</p>}
            {p.phone && <p>{t("cv.mobile")}: {p.phone}</p>}
            {p.email && <p>{t("cv.email")}: {p.email}</p>}
            {links.length > 0 && <p className="break-all">{links.join(" · ")}</p>}
          </div>
        ) : (
          <>
            {contact.length > 0 && <p className="mt-1 text-[0.95em]">{contact.join("  |  ")}</p>}
            {links.length > 0 && (
              <p className="mt-0.5 break-all text-[0.9em]" style={{ color: bold ? "#ffffffd9" : accent }}>
                {links.join("  |  ")}
              </p>
            )}
          </>
        )}
      </div>
      {!centered && photo}
    </header>
  );

  return (
    <article
      className={cn("cv-page relative", print ? "cv-page--print" : "shadow-lg ring-1 ring-black/5")}
      lang={language === "bn" ? "bn" : "en"}
      style={{
        width: "210mm",
        minHeight: print ? undefined : "297mm",
        padding: `${PAD_Y}mm ${PAD_X}mm`,
        background: theme.backgroundColor || "#ffffff",
        color: text,
        fontFamily: fontStack(theme.fontFamily),
        fontSize: `${body}pt`,
        lineHeight: language === "bn" ? 1.55 : 1.4,
        boxSizing: "border-box",
        overflowWrap: "break-word",
      }}
    >
      {header}
      {sidebar ? (
        <div className="grid grid-cols-[32%_1fr] gap-6">
          <aside className="cv-sidebar">{side.map((id) => renderSection(id, { ...ctx, inSidebar: true }))}</aside>
          <main>{main.map((id) => renderSection(id, ctx))}</main>
        </div>
      ) : (
        <main>{main.map((id) => renderSection(id, ctx))}</main>
      )}

      {layout === "bd" && theme.showDeclaration !== "false" && (
        <section className="cv-entry" style={{ marginTop: ctx.spacing }}>
          <Heading ctx={ctx}>{t("cv.sections.declaration")}</Heading>
          <p className="text-justify">{t("cv.declarationText")}</p>
          <div className="mt-10 w-48 border-t pt-1 text-center" style={{ borderColor: text }}>
            <p className="font-semibold">{p.fullName}</p>
            <p className="text-[0.9em] opacity-80">{t("cv.signature")}</p>
          </div>
        </section>
      )}

      {watermark && (
        <p className="cv-watermark mt-6 text-center text-[7.5pt] opacity-60" style={{ color: "#6b7280" }}>
          {t("cv.watermark")}
        </p>
      )}
    </article>
  );
}

/** Scales a fixed-width A4 page down to the available width. */
function FitToWidth({ children, showPageBreaks }: { children: ReactNode; showPageBreaks?: boolean }) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ scale: 1, pageHeight: 0 });

  useEffect(() => {
    const measure = () => {
      if (!outer.current || !inner.current) return;
      setSize({ scale: Math.min(1, outer.current.clientWidth / PAGE_WIDTH), pageHeight: inner.current.offsetHeight });
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (outer.current) observer.observe(outer.current);
    if (inner.current) observer.observe(inner.current);
    return () => observer.disconnect();
  }, []);

  const { scale, pageHeight } = size;
  const height = pageHeight ? pageHeight * scale : undefined;
  const breaks: number[] = [];
  if (showPageBreaks) {
    for (let y = FIRST_PAGE_MM * MM; y < pageHeight - 40; y += NEXT_PAGE_MM * MM) breaks.push(y);
  }

  return (
    <div ref={outer} className="w-full overflow-hidden" style={{ height }}>
      <div ref={inner} className="relative origin-top-left" style={{ width: PAGE_WIDTH, transform: `scale(${scale})` }}>
        {children}
        {breaks.map((y, i) => (
          <div key={y} className="pointer-events-none absolute inset-x-0 border-t-2 border-dashed border-red-400" style={{ top: y }} aria-hidden>
            <span className="absolute left-2 -top-5 rounded bg-red-50 px-1.5 text-[11px] text-red-600">
              {i18n.t("editor.pageEnds", { page: i + 1 })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ResumePreview({ className, mode = "fit", showPageBreaks, ...props }: Props) {
  if (mode === "print") return <CvPage {...props} print />;
  return (
    <div className={className}>
      <FitToWidth showPageBreaks={showPageBreaks}>
        <CvPage {...props} print={false} />
      </FitToWidth>
    </div>
  );
}
