export interface ResumeContent {
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
    portfolio?: string;
    github?: string;
    website?: string;
    summary: string;
    /** Target job title shown under the name */
    jobTitle?: string;
    profilePhoto?: string;
    profilePhotoSize?: "small" | "medium" | "large";
    profilePhotoAlignment?: "left" | "center" | "right";
  };
  careerObjective?: string;
  personalDetails?: PersonalDetails;
  experience: Experience[];
  education: Education[];
  trainings?: Training[];
  projects: Project[];
  skills: string[];
  languages: Language[];
  certifications: Certification[];
  awards: Award[];
  publications: Publication[];
  volunteerExperience: VolunteerExperience[];
  references: Reference[];
  interests: string[];
  courses: Course[];
  memberships: Membership[];
  customSections: { title: string; content: string }[];
}

export interface Experience {
  id: string;
  company: string;
  position: string;
  location?: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  bullets: string[];
}

export type EducationLevel = "ssc" | "hsc" | "diploma" | "honours" | "bachelor" | "masters" | "phd" | "other";

export interface Education {
  id: string;
  institution: string;
  degree: string;
  /** Group (Science/Commerce/Humanities) for SSC/HSC, subject/major otherwise */
  field?: string;
  startDate: string;
  endDate?: string;
  gpa?: string;
  level?: EducationLevel | string;
  /** Education board (SSC/HSC) or university */
  board?: string;
  /** "5.00" for SSC/HSC GPA, "4.00" for CGPA */
  gpaScale?: string;
  passingYear?: string;
}

export interface Training {
  id: string;
  title: string;
  institute: string;
  duration?: string;
  year?: string;
  description?: string;
}

/** Personal details section of a Bangladeshi CV */
export interface PersonalDetails {
  fatherName?: string;
  motherName?: string;
  dateOfBirth?: string;
  gender?: string;
  nationality?: string;
  religion?: string;
  maritalStatus?: string;
  nid?: string;
  bloodGroup?: string;
  permanentAddress?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  url?: string;
  technologies: string[];
}

export interface Language {
  id: string;
  name: string;
  proficiency: "native" | "fluent" | "intermediate" | "basic";
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string;
  credentialId?: string;
  credentialUrl?: string;
}

export interface Award {
  id: string;
  title: string;
  issuer: string;
  date: string;
  description?: string;
}

export interface Publication {
  id: string;
  title: string;
  publisher: string;
  date: string;
  url?: string;
  description?: string;
}

export interface VolunteerExperience {
  id: string;
  organization: string;
  role: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description: string;
}

export interface Reference {
  id: string;
  name: string;
  position: string;
  company: string;
  email?: string;
  phone?: string;
  relationship: string;
}

export interface Course {
  id: string;
  name: string;
  provider: string;
  date: string;
  certificateUrl?: string;
}

export interface Membership {
  id: string;
  organization: string;
  role?: string;
  startDate: string;
  endDate?: string;
  current: boolean;
}

export interface Resume {
  _id: string;
  title: string;
  slug: string;
  templateId: string;
  format: "international" | "bangladeshi" | "ats";
  content: ResumeContent;
  theme?: Record<string, string>;
  atsScore?: number;
  atsFeedback?: string[];
  isPublic: boolean;
  publicSlug?: string;
  language: "en" | "bn";
  sectionOrder: string[];
  updatedAt: string;
  createdAt: string;
}

export interface Template {
  _id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  thumbnail: string;
  isPremium: boolean;
  layout?: string;
  defaultTheme?: Record<string, string>;
  locked?: boolean;
}

export interface SubscriptionPlan {
  _id: string;
  name: string;
  slug: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  features: string[];
  limits: {
    maxResumes: number;
    maxAiRequests: number;
    watermarkPdf: boolean;
    premiumTemplates: boolean;
    atsChecker: boolean;
    coverLetters: boolean;
    aiOptimization: boolean;
  };
  /** Days of free trial (the Premium plan's is offered to users); 0 or missing: none */
  trialDays?: number;
  /** Price of a 7-day pass; 0 or missing: no 7-day option */
  priceWeekly?: number;
}

/** Something sold once (Admin -> Products): credit packs or a service done by a person. */
export interface Product {
  _id: string;
  slug: string;
  name: string;
  description: string;
  kind: "pdf_credits" | "ai_credits" | "screening_credits" | "service";
  price: number;
  currency: string;
  quantity: number;
  validDays: number;
  deliveryDays: number;
  isActive: boolean;
  sortOrder: number;
}

export interface Order {
  _id: string;
  status: "awaiting_payment" | "paid" | "in_progress" | "delivered" | "cancelled";
  amount: number;
  currency: string;
  notes?: string | null;
  resumeId?: string | null;
  deliveryMessage?: string | null;
  deliveredAt?: string | null;
  createdAt: string;
  product: Product;
  user?: { _id: string; name: string; email?: string } | null;
}

export interface JobCircular {
  _id: string;
  slug: string;
  title: string;
  organization: string;
  category: "government" | "bank" | "private" | "ngo" | "international" | "other";
  language: "en" | "bn";
  summary: string;
  vacancies?: number | null;
  location?: string | null;
  salary?: string | null;
  education?: string | null;
  applyStart?: string | null;
  deadline?: string | null;
  applyUrl?: string | null;
  sourceUrl?: string | null;
  photoSpec?: string | null;
  isPublished: boolean;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  /** Still accepting applications */
  isOpen: boolean;
}

export interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content?: string;
  coverImage?: string;
  tags: string[];
  language: string;
  publishedAt?: string;
  author?: { name: string; avatar?: string };
  viewCount: number;
  metaTitle?: string;
  metaDescription?: string;
  createdAt?: string;
  updatedAt?: string;
}
