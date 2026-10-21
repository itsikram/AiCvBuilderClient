import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, ImagePlus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { EDUCATION_LEVELS, newEducation, newExperience, newTraining, uid, type CvLang } from "@/lib/resume/model";
import type { Education, ResumeContent } from "@/types";
import { CheckboxField, EditorSection, Grid, SelectField, TextAreaField, TextField } from "./fields";
import { ItemList } from "./ItemList";
import { TagInput } from "./TagInput";
import { AiBulletsButton, AiSkillSuggestions, AiWriteButton } from "./ai";

export interface SectionProps {
  content: ResumeContent;
  setContent: (recipe: (content: ResumeContent) => ResumeContent) => void;
  language: CvLang;
}

const join = (...parts: Array<string | undefined>) => parts.map((p) => p?.trim()).filter(Boolean).join(", ");

// ---------------------------------------------------------------------------
// Photo: resized in the browser so the CV stays small (the API caps it at ~700 kB)
// ---------------------------------------------------------------------------

const resizeImage = (file: File, maxSize = 480): Promise<string> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("canvas"));
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("image"));
    };
    img.src = url;
  });

function PhotoField({ content, setContent }: SectionProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const p = content.personalInfo;
  const setInfo = (patch: Partial<ResumeContent["personalInfo"]>) => setContent((c) => ({ ...c, personalInfo: { ...c.personalInfo, ...patch } }));

  const choose = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.add(t("editor.personal.photoNotImage"), "error");
    try {
      setInfo({ profilePhoto: await resizeImage(file) });
    } catch {
      toast.add(t("editor.personal.photoFailed"), "error");
    }
  };

  return (
    <div className="rounded-lg border border-dashed p-3">
      <div className="flex flex-wrap items-center gap-4">
        {p.profilePhoto ? (
          <img src={p.profilePhoto} alt="" className="h-24 w-20 rounded-md border object-cover" />
        ) : (
          <div className="flex h-24 w-20 items-center justify-center rounded-md bg-secondary text-muted" aria-hidden>
            <ImagePlus className="h-7 w-7" />
          </div>
        )}
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm font-medium">{t("editor.personal.photo")}</p>
          <p className="text-xs text-muted">{t("editor.personal.photoHint")}</p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => input.current?.click()}>
              <ImagePlus className="h-4 w-4" />
              {p.profilePhoto ? t("editor.personal.changePhoto") : t("editor.personal.choosePhoto")}
            </Button>
            {p.profilePhoto && (
              <Button type="button" variant="ghost" size="sm" className="text-red-600" onClick={() => setInfo({ profilePhoto: "" })}>
                <Trash2 className="h-4 w-4" />
                {t("editor.personal.removePhoto")}
              </Button>
            )}
          </div>
          <input
            ref={input}
            type="file"
            accept="image/*"
            className="sr-only"
            tabIndex={-1}
            aria-label={t("editor.personal.choosePhoto")}
            onChange={(e) => {
              void choose(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </div>
      </div>
      {p.profilePhoto && (
        <Grid>
          <SelectField
            className="mt-3"
            label={t("editor.personal.photoSize")}
            value={p.profilePhotoSize || "medium"}
            onChange={(v) => setInfo({ profilePhotoSize: v as "small" | "medium" | "large" })}
            options={(["small", "medium", "large"] as const).map((v) => ({ value: v, label: t(`editor.personal.${v}`) }))}
          />
          <SelectField
            className="mt-3"
            label={t("editor.personal.photoPosition")}
            value={p.profilePhotoAlignment || "right"}
            onChange={(v) => setInfo({ profilePhotoAlignment: v as "left" | "center" | "right" })}
            options={(["right", "left", "center"] as const).map((v) => ({ value: v, label: t(`editor.personal.${v}`) }))}
          />
        </Grid>
      )}
    </div>
  );
}

export function PersonalSection(props: SectionProps) {
  const { t } = useTranslation();
  const { content, setContent } = props;
  const p = content.personalInfo;
  const [showLinks, setShowLinks] = useState(Boolean(p.linkedin || p.github || p.portfolio || p.website));
  const set = (key: keyof ResumeContent["personalInfo"]) => (value: string) =>
    setContent((c) => ({ ...c, personalInfo: { ...c.personalInfo, [key]: value } }));

  return (
    <EditorSection id="sec-personal" title={t("editor.personal.title")}>
      <Grid>
        <TextField label={t("editor.personal.fullName")} value={p.fullName} onChange={set("fullName")} autoComplete="name" />
        <TextField label={t("editor.personal.jobTitle")} value={p.jobTitle} onChange={set("jobTitle")} placeholder={t("editor.personal.jobTitlePlaceholder")} autoComplete="organization-title" />
        <TextField label={t("editor.personal.phone")} value={p.phone} onChange={set("phone")} type="tel" inputMode="tel" autoComplete="tel" placeholder={t("editor.personal.phonePlaceholder")} />
        <TextField label={t("editor.personal.email")} value={p.email} onChange={set("email")} type="email" inputMode="email" autoComplete="email" />
      </Grid>
      <TextField label={t("editor.personal.location")} value={p.location} onChange={set("location")} placeholder={t("editor.personal.locationPlaceholder")} autoComplete="street-address" />
      <PhotoField {...props} />
      <div>
        <button type="button" className="flex items-center gap-1 text-sm font-medium text-primary" aria-expanded={showLinks} onClick={() => setShowLinks((v) => !v)}>
          <ChevronDown className={cn("h-4 w-4 transition-transform", !showLinks && "-rotate-90")} aria-hidden />
          {t("editor.personal.links")} <span className="font-normal text-muted">({t("common.optional")})</span>
        </button>
        {showLinks && (
          <div className="mt-3">
            <Grid>
              <TextField label={t("editor.personal.linkedin")} value={p.linkedin} onChange={set("linkedin")} type="url" inputMode="url" placeholder="linkedin.com/in/…" />
              <TextField label={t("editor.personal.github")} value={p.github} onChange={set("github")} type="url" inputMode="url" />
              <TextField label={t("editor.personal.portfolio")} value={p.portfolio} onChange={set("portfolio")} type="url" inputMode="url" />
              <TextField label={t("editor.personal.website")} value={p.website} onChange={set("website")} type="url" inputMode="url" />
            </Grid>
          </div>
        )}
      </div>
    </EditorSection>
  );
}

export function ObjectiveSection({ content, setContent, language }: SectionProps) {
  const { t } = useTranslation();
  return (
    <EditorSection id="sec-objective" title={`${t("editor.objective.title")} & ${t("editor.summary.title")}`}>
      <TextAreaField
        label={t("editor.objective.title")}
        hint={t("editor.objective.hint")}
        placeholder={t("editor.objective.placeholder")}
        value={content.careerObjective}
        onChange={(v) => setContent((c) => ({ ...c, careerObjective: v }))}
        rows={3}
        actions={<AiWriteButton kind="objective" content={content} language={language} onPick={(text) => setContent((c) => ({ ...c, careerObjective: text }))} />}
      />
      <TextAreaField
        label={t("editor.summary.title")}
        hint={t("editor.summary.hint")}
        placeholder={t("editor.summary.placeholder")}
        value={content.personalInfo.summary}
        onChange={(v) => setContent((c) => ({ ...c, personalInfo: { ...c.personalInfo, summary: v } }))}
        rows={4}
        actions={
          <AiWriteButton kind="summary" content={content} language={language} onPick={(text) => setContent((c) => ({ ...c, personalInfo: { ...c.personalInfo, summary: text } }))} />
        }
      />
    </EditorSection>
  );
}

export function ExperienceSection({ content, setContent, language }: SectionProps) {
  const { t } = useTranslation();
  return (
    <EditorSection id="sec-experience" title={t("editor.experience.title")} hint={t("editor.experience.hint")}>
      <ItemList
        items={content.experience}
        onChange={(experience) => setContent((c) => ({ ...c, experience }))}
        create={newExperience}
        addLabel={t("editor.experience.add")}
        empty={t("editor.experience.empty")}
        summary={(e) => join(e.position, e.company)}
        fallbackName={(i) => t("editor.experience.item", { n: i + 1 })}
        render={(e, update) => (
          <>
            <Grid>
              <TextField label={t("editor.experience.position")} value={e.position} onChange={(v) => update({ position: v })} />
              <TextField label={t("editor.experience.company")} value={e.company} onChange={(v) => update({ company: v })} />
            </Grid>
            <Grid cols={3}>
              <TextField label={t("editor.experience.location")} value={e.location} onChange={(v) => update({ location: v })} />
              <TextField label={t("editor.experience.start")} type="month" value={e.startDate} onChange={(v) => update({ startDate: v })} />
              {!e.current && <TextField label={t("editor.experience.end")} type="month" value={e.endDate} onChange={(v) => update({ endDate: v })} />}
            </Grid>
            <CheckboxField label={t("editor.experience.current")} checked={e.current} onChange={(current) => update({ current, endDate: current ? "" : e.endDate })} />
            <fieldset className="space-y-2">
              <legend className="mb-1 text-sm font-medium">{t("editor.experience.duties")}</legend>
              {e.bullets.map((bullet, j) => (
                <div key={j} className="flex items-start gap-2">
                  <span className="mt-2.5 text-muted" aria-hidden>
                    •
                  </span>
                  <textarea
                    rows={1}
                    aria-label={`${t("editor.experience.duties")} ${j + 1}`}
                    className="min-h-11 flex-1 resize-y rounded-lg border bg-background px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:text-sm"
                    placeholder={j === 0 ? t("editor.experience.dutyPlaceholder") : undefined}
                    value={bullet}
                    onChange={(ev) => update({ bullets: e.bullets.map((b, k) => (k === j ? ev.target.value : b)) })}
                    onKeyDown={(ev) => {
                      if (ev.key === "Enter" && !ev.shiftKey) {
                        ev.preventDefault();
                        const bullets = [...e.bullets];
                        bullets.splice(j + 1, 0, "");
                        update({ bullets });
                        // Enter starts a new line item; focus it once it renders
                        const fieldset = ev.currentTarget.closest("fieldset");
                        requestAnimationFrame(() => fieldset?.querySelectorAll("textarea")[j + 1]?.focus());
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11 shrink-0"
                    aria-label={t("editor.experience.removeDuty")}
                    onClick={() => update({ bullets: e.bullets.length > 1 ? e.bullets.filter((_, k) => k !== j) : [""] })}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => update({ bullets: [...e.bullets, ""] })}>
                  <Plus className="h-4 w-4" />
                  {t("editor.experience.addDuty")}
                </Button>
                <AiBulletsButton
                  position={e.position}
                  company={e.company}
                  bullets={e.bullets}
                  jobTitle={content.personalInfo.jobTitle}
                  language={language}
                  onApply={(bullets, mode) => update({ bullets: mode === "replace" ? bullets : [...e.bullets.filter((b) => b.trim()), ...bullets] })}
                />
              </div>
            </fieldset>
          </>
        )}
      />
    </EditorSection>
  );
}

const isSchoolLevel = (level?: string) => level === "ssc" || level === "hsc";

export function EducationSection({ content, setContent }: SectionProps) {
  const { t } = useTranslation();
  const levelName = (e: Education) => (e.level ? t(`cv.levels.${e.level}`, { defaultValue: e.level }) : "");
  const missing = (level: string) => !content.education.some((e) => e.level === level);

  return (
    <EditorSection id="sec-education" title={t("editor.education.title")} hint={t("editor.education.hint")}>
      <ItemList
        items={content.education}
        onChange={(education) => setContent((c) => ({ ...c, education }))}
        create={() => newEducation("honours")}
        addLabel={t("editor.education.add")}
        empty={t("editor.education.empty")}
        summary={(e) => join(e.degree || levelName(e), e.institution, e.passingYear)}
        fallbackName={(i) => t("editor.education.item", { n: i + 1 })}
        extraActions={(add) => (
          <>
            {missing("ssc") && (
              <Button type="button" variant="ghost" onClick={() => add({ ...newEducation("ssc"), degree: "SSC" })}>
                <Plus className="h-4 w-4" />
                {t("editor.education.addSsc")}
              </Button>
            )}
            {missing("hsc") && (
              <Button type="button" variant="ghost" onClick={() => add({ ...newEducation("hsc"), degree: "HSC" })}>
                <Plus className="h-4 w-4" />
                {t("editor.education.addHsc")}
              </Button>
            )}
          </>
        )}
        render={(e, update) => {
          const school = isSchoolLevel(e.level);
          return (
            <>
              <Grid>
                <SelectField
                  label={t("editor.education.level")}
                  value={e.level || "other"}
                  onChange={(level) => update({ level, gpaScale: isSchoolLevel(level) ? "5.00" : e.gpaScale === "5.00" ? "4.00" : e.gpaScale })}
                  options={EDUCATION_LEVELS.map((level) => ({ value: level, label: t(`cv.levels.${level}`) }))}
                />
                <TextField label={t("editor.education.degree")} value={e.degree} onChange={(v) => update({ degree: v })} placeholder={school ? levelName(e) : t("editor.education.degreePlaceholder")} />
              </Grid>
              <Grid>
                <TextField
                  label={t("editor.education.group")}
                  value={e.field}
                  onChange={(v) => update({ field: v })}
                  placeholder={school ? t("editor.education.groupPlaceholderSchool") : t("editor.education.groupPlaceholder")}
                />
                <TextField label={t("editor.education.institution")} value={e.institution} onChange={(v) => update({ institution: v })} />
              </Grid>
              <Grid>
                <TextField
                  label={t("editor.education.board")}
                  value={e.board}
                  onChange={(v) => update({ board: v })}
                  placeholder={school ? t("editor.education.boardPlaceholderSchool") : t("editor.education.boardPlaceholder")}
                />
                <TextField label={t("editor.education.passingYear")} value={e.passingYear} onChange={(v) => update({ passingYear: v.replace(/[^\d০-৯]/g, "").slice(0, 4) })} inputMode="numeric" placeholder="2024" />
              </Grid>
              <Grid>
                <div className="grid grid-cols-[1fr_6rem] gap-2">
                  <TextField label={t("editor.education.result")} value={e.gpa} onChange={(v) => update({ gpa: v })} inputMode="decimal" placeholder={school ? "5.00" : "3.50"} />
                  <SelectField
                    label={t("editor.education.scale")}
                    value={e.gpaScale || (school ? "5.00" : "4.00")}
                    onChange={(v) => update({ gpaScale: v })}
                    options={["5.00", "4.00", ""].map((v) => ({ value: v, label: v || "—" }))}
                  />
                </div>
              </Grid>
            </>
          );
        }}
      />
    </EditorSection>
  );
}

export function TrainingSection({ content, setContent }: SectionProps) {
  const { t } = useTranslation();
  return (
    <EditorSection id="sec-training" title={t("editor.training.title")} hint={t("editor.training.hint")}>
      <ItemList
        items={content.trainings ?? []}
        onChange={(trainings) => setContent((c) => ({ ...c, trainings }))}
        create={newTraining}
        addLabel={t("editor.training.add")}
        empty={t("editor.training.empty")}
        summary={(x) => join(x.title, x.institute)}
        fallbackName={(i) => t("editor.training.item", { n: i + 1 })}
        render={(x, update) => (
          <>
            <Grid>
              <TextField label={t("editor.training.name")} value={x.title} onChange={(v) => update({ title: v })} />
              <TextField label={t("editor.training.institute")} value={x.institute} onChange={(v) => update({ institute: v })} />
              <TextField label={t("editor.training.duration")} value={x.duration} onChange={(v) => update({ duration: v })} placeholder={t("editor.training.durationPlaceholder")} />
              <TextField label={t("editor.training.year")} value={x.year} onChange={(v) => update({ year: v })} inputMode="numeric" />
            </Grid>
            <TextAreaField label={t("editor.training.description")} value={x.description} onChange={(v) => update({ description: v })} rows={2} />
          </>
        )}
      />
    </EditorSection>
  );
}

export function SkillsSection({ content, setContent, language }: SectionProps) {
  const { t } = useTranslation();
  const addSkills = (skills: string[]) =>
    setContent((c) => {
      const have = new Set(c.skills.map((s) => s.trim().toLowerCase()));
      return { ...c, skills: [...c.skills.filter((s) => s.trim()), ...skills.filter((s) => !have.has(s.toLowerCase()))] };
    });
  return (
    <EditorSection id="sec-skills" title={t("editor.skills.title")}>
      <TagInput label={t("editor.skills.title")} values={content.skills} onChange={(skills) => setContent((c) => ({ ...c, skills }))} placeholder={t("editor.skills.placeholder")} hint={t("editor.skills.hint")} />
      <AiSkillSuggestions jobTitle={content.personalInfo.jobTitle} skills={content.skills} language={language} onAdd={addSkills} />
    </EditorSection>
  );
}

export function LanguagesSection({ content, setContent }: SectionProps) {
  const { t } = useTranslation();
  return (
    <EditorSection id="sec-languages" title={t("editor.languages.title")}>
      <div className="space-y-2">
        {content.languages.map((lang, i) => (
          <div key={lang.id} className="grid grid-cols-[1fr_9rem_auto] items-end gap-2">
            <TextField label={t("editor.languages.name")} value={lang.name} onChange={(v) => setContent((c) => ({ ...c, languages: c.languages.map((l, j) => (j === i ? { ...l, name: v } : l)) }))} />
            <SelectField
              label={t("editor.languages.level")}
              value={lang.proficiency}
              onChange={(v) => setContent((c) => ({ ...c, languages: c.languages.map((l, j) => (j === i ? { ...l, proficiency: v as typeof l.proficiency } : l)) }))}
              options={(["native", "fluent", "intermediate", "basic"] as const).map((v) => ({ value: v, label: t(`cv.proficiency.${v}`) }))}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-11 w-11"
              aria-label={`${t("editor.remove")}: ${lang.name || t("editor.languages.name")}`}
              onClick={() => setContent((c) => ({ ...c, languages: c.languages.filter((_, j) => j !== i) }))}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => setContent((c) => ({ ...c, languages: [...c.languages, { id: uid(), name: "", proficiency: "intermediate" }] }))}>
          <Plus className="h-4 w-4" />
          {t("editor.languages.add")}
        </Button>
      </div>
    </EditorSection>
  );
}

const DETAIL_KEYS = ["fatherName", "motherName", "dateOfBirth", "gender", "nationality", "religion", "maritalStatus", "bloodGroup", "nid"] as const;

export function DetailsSection({ content, setContent }: SectionProps) {
  const { t } = useTranslation();
  const d = content.personalDetails ?? {};
  const set = (key: keyof NonNullable<ResumeContent["personalDetails"]>) => (value: string) =>
    setContent((c) => ({ ...c, personalDetails: { ...(c.personalDetails ?? {}), [key]: value } }));
  const lists: Partial<Record<(typeof DETAIL_KEYS)[number], string[]>> = {
    gender: t("editor.details.genders").split(/,\s*/),
    maritalStatus: t("editor.details.marital").split(/,\s*/),
    bloodGroup: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"],
  };
  return (
    <EditorSection id="sec-details" title={t("editor.details.title")} hint={t("editor.details.hint")}>
      <Grid>
        {DETAIL_KEYS.map((key) => (
          <div key={key}>
            <TextField
              label={t(`editor.details.${key}`)}
              value={d[key]}
              onChange={set(key)}
              type={key === "dateOfBirth" ? "date" : "text"}
              inputMode={key === "nid" ? "numeric" : undefined}
              list={lists[key] ? `list-${key}` : undefined}
            />
            {lists[key] && (
              <datalist id={`list-${key}`}>
                {lists[key]!.map((v) => (
                  <option key={v} value={v} />
                ))}
              </datalist>
            )}
          </div>
        ))}
      </Grid>
      <TextAreaField label={t("editor.details.permanentAddress")} value={d.permanentAddress} onChange={set("permanentAddress")} rows={2} />
    </EditorSection>
  );
}

export function ReferencesSection({ content, setContent }: SectionProps) {
  const { t } = useTranslation();
  return (
    <EditorSection id="sec-references" title={t("editor.references.title")} hint={t("editor.references.hint")}>
      <ItemList
        items={content.references}
        onChange={(references) => setContent((c) => ({ ...c, references }))}
        create={() => ({ id: uid(), name: "", position: "", company: "", email: "", phone: "", relationship: "" })}
        addLabel={t("editor.references.add")}
        empty={t("editor.references.empty")}
        summary={(r) => join(r.name, r.company)}
        fallbackName={(i) => t("editor.references.item", { n: i + 1 })}
        render={(r, update) => (
          <Grid>
            <TextField label={t("editor.references.name")} value={r.name} onChange={(v) => update({ name: v })} />
            <TextField label={t("editor.references.position")} value={r.position} onChange={(v) => update({ position: v })} />
            <TextField label={t("editor.references.company")} value={r.company} onChange={(v) => update({ company: v })} />
            <TextField label={t("editor.references.relationship")} value={r.relationship} onChange={(v) => update({ relationship: v })} placeholder={t("editor.references.relationshipPlaceholder")} />
            <TextField label={t("editor.references.phone")} value={r.phone} onChange={(v) => update({ phone: v })} type="tel" inputMode="tel" />
            <TextField label={t("editor.references.email")} value={r.email} onChange={(v) => update({ email: v })} type="email" inputMode="email" />
          </Grid>
        )}
      />
    </EditorSection>
  );
}

// ---------------------------------------------------------------------------
// Optional sections, each in a collapsible panel
// ---------------------------------------------------------------------------

function Collapsible({ title, count, children, defaultOpen }: { title: string; count: number; children: React.ReactNode; defaultOpen?: boolean }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(Boolean(defaultOpen));
  return (
    <div className="rounded-lg border">
      <button type="button" className="flex min-h-12 w-full items-center justify-between gap-2 px-3 text-left text-sm font-medium" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <span className="flex items-center gap-2">
          <ChevronDown className={cn("h-4 w-4 transition-transform", !open && "-rotate-90")} aria-hidden />
          {title}
        </span>
        {count > 0 && <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted">{t("editor.more.count", { count })}</span>}
      </button>
      {open && <div className="border-t p-3">{children}</div>}
    </div>
  );
}

export function MoreSections({ content, setContent }: SectionProps) {
  const { t } = useTranslation();
  const m = (key: string) => t(`editor.more.${key}`);
  const dates = (start: string | undefined, end: string | undefined, current: boolean, update: (p: { startDate?: string; endDate?: string; current?: boolean }) => void) => (
    <>
      <Grid>
        <TextField label={m("start")} type="month" value={start} onChange={(v) => update({ startDate: v })} />
        {!current && <TextField label={m("end")} type="month" value={end} onChange={(v) => update({ endDate: v })} />}
      </Grid>
      <CheckboxField label={m("current")} checked={current} onChange={(v) => update({ current: v, endDate: v ? "" : end })} />
    </>
  );

  return (
    <EditorSection id="sec-more" title={m("title")} hint={m("hint")}>
      <div className="space-y-2">
        <Collapsible title={m("projects")} count={content.projects.length}>
          <ItemList
            items={content.projects}
            onChange={(projects) => setContent((c) => ({ ...c, projects }))}
            create={() => ({ id: uid(), name: "", description: "", url: "", technologies: [] })}
            addLabel={t("editor.more.addItem", { name: m("projects") })}
            summary={(p) => p.name}
            fallbackName={(i) => `${m("projects")} ${i + 1}`}
            render={(p, update) => (
              <>
                <Grid>
                  <TextField label={m("name")} value={p.name} onChange={(v) => update({ name: v })} />
                  <TextField label={m("url")} value={p.url} onChange={(v) => update({ url: v })} type="url" inputMode="url" />
                </Grid>
                <TextAreaField label={m("description")} value={p.description} onChange={(v) => update({ description: v })} rows={3} />
                <TextField
                  label={m("technologies")}
                  value={p.technologies.join(", ")}
                  onChange={(v) => update({ technologies: v.split(",").map((s) => s.trimStart()) })}
                  onBlur={() => update({ technologies: p.technologies.map((s) => s.trim()).filter(Boolean) })}
                />
              </>
            )}
          />
        </Collapsible>

        <Collapsible title={m("certifications")} count={content.certifications.length}>
          <ItemList
            items={content.certifications}
            onChange={(certifications) => setContent((c) => ({ ...c, certifications }))}
            create={() => ({ id: uid(), name: "", issuer: "", date: "", credentialId: "", credentialUrl: "" })}
            addLabel={t("editor.more.addItem", { name: m("certifications") })}
            summary={(x) => join(x.name, x.issuer)}
            fallbackName={(i) => `${m("certifications")} ${i + 1}`}
            render={(x, update) => (
              <Grid cols={3}>
                <TextField label={m("name")} value={x.name} onChange={(v) => update({ name: v })} />
                <TextField label={m("issuer")} value={x.issuer} onChange={(v) => update({ issuer: v })} />
                <TextField label={m("date")} type="month" value={x.date} onChange={(v) => update({ date: v })} />
              </Grid>
            )}
          />
        </Collapsible>

        <Collapsible title={m("awards")} count={content.awards.length}>
          <ItemList
            items={content.awards}
            onChange={(awards) => setContent((c) => ({ ...c, awards }))}
            create={() => ({ id: uid(), title: "", issuer: "", date: "", description: "" })}
            addLabel={t("editor.more.addItem", { name: m("awards") })}
            summary={(x) => join(x.title, x.issuer)}
            fallbackName={(i) => `${m("awards")} ${i + 1}`}
            render={(x, update) => (
              <>
                <Grid cols={3}>
                  <TextField label={m("title2")} value={x.title} onChange={(v) => update({ title: v })} />
                  <TextField label={m("issuer")} value={x.issuer} onChange={(v) => update({ issuer: v })} />
                  <TextField label={m("date")} type="month" value={x.date} onChange={(v) => update({ date: v })} />
                </Grid>
                <TextAreaField label={m("description")} value={x.description} onChange={(v) => update({ description: v })} rows={2} />
              </>
            )}
          />
        </Collapsible>

        <Collapsible title={m("volunteer")} count={content.volunteerExperience.length}>
          <ItemList
            items={content.volunteerExperience}
            onChange={(volunteerExperience) => setContent((c) => ({ ...c, volunteerExperience }))}
            create={() => ({ id: uid(), organization: "", role: "", startDate: "", endDate: "", current: false, description: "" })}
            addLabel={t("editor.more.addItem", { name: m("volunteer") })}
            summary={(x) => join(x.role, x.organization)}
            fallbackName={(i) => `${m("volunteer")} ${i + 1}`}
            render={(x, update) => (
              <>
                <Grid>
                  <TextField label={m("role")} value={x.role} onChange={(v) => update({ role: v })} />
                  <TextField label={m("organization")} value={x.organization} onChange={(v) => update({ organization: v })} />
                </Grid>
                {dates(x.startDate, x.endDate, x.current, update)}
                <TextAreaField label={m("description")} value={x.description} onChange={(v) => update({ description: v })} rows={2} />
              </>
            )}
          />
        </Collapsible>

        <Collapsible title={m("publications")} count={content.publications.length}>
          <ItemList
            items={content.publications}
            onChange={(publications) => setContent((c) => ({ ...c, publications }))}
            create={() => ({ id: uid(), title: "", publisher: "", date: "", url: "", description: "" })}
            addLabel={t("editor.more.addItem", { name: m("publications") })}
            summary={(x) => x.title}
            fallbackName={(i) => `${m("publications")} ${i + 1}`}
            render={(x, update) => (
              <>
                <Grid cols={3}>
                  <TextField label={m("title2")} value={x.title} onChange={(v) => update({ title: v })} />
                  <TextField label={m("publisher")} value={x.publisher} onChange={(v) => update({ publisher: v })} />
                  <TextField label={m("date")} type="month" value={x.date} onChange={(v) => update({ date: v })} />
                </Grid>
                <TextField label={m("url")} value={x.url} onChange={(v) => update({ url: v })} type="url" inputMode="url" />
              </>
            )}
          />
        </Collapsible>

        <Collapsible title={m("courses")} count={content.courses.length}>
          <ItemList
            items={content.courses}
            onChange={(courses) => setContent((c) => ({ ...c, courses }))}
            create={() => ({ id: uid(), name: "", provider: "", date: "", certificateUrl: "" })}
            addLabel={t("editor.more.addItem", { name: m("courses") })}
            summary={(x) => join(x.name, x.provider)}
            fallbackName={(i) => `${m("courses")} ${i + 1}`}
            render={(x, update) => (
              <Grid cols={3}>
                <TextField label={m("name")} value={x.name} onChange={(v) => update({ name: v })} />
                <TextField label={m("provider")} value={x.provider} onChange={(v) => update({ provider: v })} />
                <TextField label={m("date")} type="month" value={x.date} onChange={(v) => update({ date: v })} />
              </Grid>
            )}
          />
        </Collapsible>

        <Collapsible title={m("memberships")} count={content.memberships.length}>
          <ItemList
            items={content.memberships}
            onChange={(memberships) => setContent((c) => ({ ...c, memberships }))}
            create={() => ({ id: uid(), organization: "", role: "", startDate: "", endDate: "", current: false })}
            addLabel={t("editor.more.addItem", { name: m("memberships") })}
            summary={(x) => join(x.organization, x.role)}
            fallbackName={(i) => `${m("memberships")} ${i + 1}`}
            render={(x, update) => (
              <>
                <Grid>
                  <TextField label={m("organization")} value={x.organization} onChange={(v) => update({ organization: v })} />
                  <TextField label={m("role")} value={x.role} onChange={(v) => update({ role: v })} />
                </Grid>
                {dates(x.startDate, x.endDate, x.current, update)}
              </>
            )}
          />
        </Collapsible>

        <Collapsible title={m("interests")} count={content.interests.length}>
          <TagInput label={m("interests")} values={content.interests} onChange={(interests) => setContent((c) => ({ ...c, interests }))} placeholder={m("interestsPlaceholder")} />
        </Collapsible>

        <Collapsible title={m("custom")} count={content.customSections.length}>
          <div className="space-y-3">
            {content.customSections.map((s, i) => (
              <div key={i} className="space-y-2 rounded-lg border p-3">
                <div className="flex items-end gap-2">
                  <TextField
                    className="flex-1"
                    label={m("customTitle")}
                    value={s.title}
                    onChange={(v) => setContent((c) => ({ ...c, customSections: c.customSections.map((x, j) => (j === i ? { ...x, title: v } : x)) }))}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11"
                    aria-label={`${t("editor.remove")}: ${s.title || m("custom")}`}
                    onClick={() => setContent((c) => ({ ...c, customSections: c.customSections.filter((_, j) => j !== i) }))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <TextAreaField
                  label={m("customContent")}
                  value={s.content}
                  onChange={(v) => setContent((c) => ({ ...c, customSections: c.customSections.map((x, j) => (j === i ? { ...x, content: v } : x)) }))}
                  rows={3}
                />
              </div>
            ))}
            <Button type="button" variant="outline" onClick={() => setContent((c) => ({ ...c, customSections: [...c.customSections, { title: "", content: "" }] }))}>
              <Plus className="h-4 w-4" />
              {t("editor.more.addItem", { name: m("custom") })}
            </Button>
          </div>
        </Collapsible>
      </div>
    </EditorSection>
  );
}
