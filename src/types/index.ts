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
  };
  experience: Experience[];
  education: Education[];
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

export interface Education {
  id: string;
  institution: string;
  degree: string;
  field?: string;
  startDate: string;
  endDate?: string;
  gpa?: string;
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
}
