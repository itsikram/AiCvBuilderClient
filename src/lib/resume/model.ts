import type { Education, Experience, ResumeContent, Training } from "@/types";

export type CvLang = "en" | "bn";

/** Section ids in the order a Bangladeshi CV usually follows (matches the API default). */
export const SECTION_IDS = [
  "objective",
  "summary",
  "experience",
  "education",
  "training",
  "skills",
  "projects",
  "certifications",
  "languages",
  "awards",
  "publications",
  "volunteer",
  "courses",
  "memberships",
  "interests",
  "custom",
  "personalDetails",
  "references",
] as const;

export type SectionId = (typeof SECTION_IDS)[number];

const isSectionId = (value: string): value is SectionId => (SECTION_IDS as readonly string[]).includes(value);

const has = (value: unknown): boolean => {
  if (Array.isArray(value)) return value.some(has);
  if (value && typeof value === "object") {
    return Object.entries(value).some(([key, v]) => key !== "id" && key !== "current" && has(v));
  }
  return typeof value === "string" ? value.trim().length > 0 : false;
};

/** Whether a section has anything to print. */
export const sectionHasContent = (id: SectionId, c: ResumeContent): boolean => {
  switch (id) {
    case "objective":
      return has(c.careerObjective);
    case "summary":
      return has(c.personalInfo.summary);
    case "experience":
      return has(c.experience);
    case "education":
      return has(c.education);
    case "training":
      return has(c.trainings);
    case "skills":
      return has(c.skills);
    case "projects":
      return has(c.projects);
    case "certifications":
      return has(c.certifications);
    case "languages":
      return has(c.languages);
    case "awards":
      return has(c.awards);
    case "publications":
      return has(c.publications);
    case "volunteer":
      return has(c.volunteerExperience);
    case "courses":
      return has(c.courses);
    case "memberships":
      return has(c.memberships);
    case "interests":
      return has(c.interests);
    case "custom":
      return has(c.customSections);
    case "personalDetails":
      return has(c.personalDetails);
    case "references":
      return has(c.references);
  }
};

/**
 * The full display order: the CV's saved order first (older CVs saved only five
 * ids), then every other section in the default order. Unknown ids are dropped.
 */
export const fullSectionOrder = (saved: string[] | undefined): SectionId[] => {
  const known = (saved ?? []).filter(isSectionId);
  return [...new Set([...known, ...SECTION_IDS])];
};

export const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;

export const emptyContent = (lang: CvLang = "en"): ResumeContent => ({
  personalInfo: {
    fullName: "",
    email: "",
    phone: "",
    location: lang === "bn" ? "ঢাকা, বাংলাদেশ" : "Dhaka, Bangladesh",
    summary: "",
    jobTitle: "",
    profilePhotoSize: "medium",
    profilePhotoAlignment: "right",
  },
  careerObjective: "",
  personalDetails: { nationality: lang === "bn" ? "বাংলাদেশী" : "Bangladeshi" },
  experience: [],
  education: [],
  trainings: [],
  projects: [],
  skills: [],
  languages: [
    { id: uid(), name: lang === "bn" ? "বাংলা" : "Bangla", proficiency: "native" },
    { id: uid(), name: lang === "bn" ? "ইংরেজি" : "English", proficiency: "fluent" },
  ],
  certifications: [],
  awards: [],
  publications: [],
  volunteerExperience: [],
  references: [],
  interests: [],
  courses: [],
  memberships: [],
  customSections: [],
});

const list = <T,>(value: T[] | undefined | null): T[] => (Array.isArray(value) ? value : []);
const withId = <T extends { id?: string }>(items: T[]): T[] => items.map((item) => ({ ...item, id: item.id || uid() }));

/** Fills in sections that older or imported CVs lack, so editors never see undefined. */
export const normalizeContent = (content: Partial<ResumeContent> | undefined): ResumeContent => {
  const base = emptyContent();
  const c = content ?? {};
  return {
    ...base,
    ...c,
    personalInfo: { ...base.personalInfo, ...(c.personalInfo ?? {}) },
    careerObjective: c.careerObjective ?? "",
    personalDetails: { ...(c.personalDetails ?? {}) },
    experience: withId(list(c.experience)).map((e) => ({ ...e, bullets: list(e.bullets) })),
    education: withId(list(c.education)),
    trainings: withId(list(c.trainings)),
    projects: withId(list(c.projects)).map((p) => ({ ...p, technologies: list(p.technologies) })),
    skills: list(c.skills),
    languages: withId(list(c.languages)),
    certifications: withId(list(c.certifications)),
    awards: withId(list(c.awards)),
    publications: withId(list(c.publications)),
    volunteerExperience: withId(list(c.volunteerExperience)),
    references: withId(list(c.references)),
    interests: list(c.interests),
    courses: withId(list(c.courses)),
    memberships: withId(list(c.memberships)),
    customSections: list(c.customSections),
  };
};

export const newExperience = (): Experience => ({
  id: uid(),
  company: "",
  position: "",
  location: "",
  startDate: "",
  endDate: "",
  current: false,
  bullets: [""],
});

export const newEducation = (level: string = "honours"): Education => ({
  id: uid(),
  level,
  institution: "",
  degree: "",
  field: "",
  board: "",
  startDate: "",
  endDate: "",
  passingYear: "",
  gpa: "",
  gpaScale: level === "ssc" || level === "hsc" ? "5.00" : "4.00",
});

export const newTraining = (): Training => ({ id: uid(), title: "", institute: "", duration: "", year: "", description: "" });

export const EDUCATION_LEVELS = ["ssc", "hsc", "diploma", "honours", "bachelor", "masters", "phd", "other"] as const;

/** Content without the (large, base64) photo, for sending to AI endpoints. */
export const contentForAi = (content: ResumeContent): ResumeContent => ({
  ...content,
  personalInfo: { ...content.personalInfo, profilePhoto: "" },
});

// ---------------------------------------------------------------------------
// Dot paths ("experience.0.bullets.2") used by AI suggestions
// ---------------------------------------------------------------------------

export const getAtPath = (target: unknown, path: string): unknown =>
  path.split(".").reduce<unknown>((node, key) => (node == null ? undefined : (node as Record<string, unknown>)[key]), target);

/** Immutable set: copies each object/array along the path. */
export const setAtPath = <T,>(target: T, path: string, value: unknown): T => {
  const [head, ...rest] = path.split(".");
  const source = (target ?? {}) as Record<string, unknown>;
  const copy = (Array.isArray(source) ? [...source] : { ...source }) as Record<string, unknown>;
  copy[head] = rest.length ? setAtPath(source[head], rest.join("."), value) : value;
  return copy as T;
};

// ---------------------------------------------------------------------------
// Completeness score
// ---------------------------------------------------------------------------

export interface CompletenessItem {
  /** i18n key under editor.checks */
  key: string;
  done: boolean;
  weight: number;
  /** Editor step that fixes it (0-based) */
  step: number;
}

export const completeness = (c: ResumeContent): { score: number; items: CompletenessItem[] } => {
  const p = c.personalInfo;
  const education = c.education.filter((e) => has(e.degree) || has(e.institution));
  const experienceOrTraining = has(c.experience) || has(c.trainings) || has(c.projects);
  const items: CompletenessItem[] = [
    { key: "name", done: has(p.fullName), weight: 10, step: 0 },
    { key: "phone", done: has(p.phone), weight: 10, step: 0 },
    { key: "email", done: has(p.email), weight: 8, step: 0 },
    { key: "jobTitle", done: has(p.jobTitle), weight: 6, step: 0 },
    { key: "objective", done: has(c.careerObjective) || has(p.summary), weight: 12, step: 0 },
    { key: "education", done: education.length > 0, weight: 15, step: 1 },
    { key: "results", done: education.length > 0 && education.every((e) => has(e.gpa)), weight: 6, step: 1 },
    { key: "experience", done: experienceOrTraining, weight: 12, step: 1 },
    { key: "skills", done: c.skills.filter((s) => s.trim()).length >= 5, weight: 10, step: 1 },
    { key: "languages", done: has(c.languages), weight: 3, step: 1 },
    { key: "personalDetails", done: has(c.personalDetails?.fatherName) && has(c.personalDetails?.dateOfBirth), weight: 5, step: 2 },
    { key: "references", done: c.references.some((r) => has(r.name)), weight: 3, step: 2 },
  ];
  const total = items.reduce((sum, i) => sum + i.weight, 0);
  const got = items.reduce((sum, i) => sum + (i.done ? i.weight : 0), 0);
  return { score: Math.round((got / total) * 100), items };
};
