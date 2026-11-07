import type { JobCircular } from "@/types";

export const JOB_CATEGORIES: JobCircular["category"][] = ["government", "bank", "private", "ngo", "international", "other"];

/** Where a circular lives: /bn/jobs/:slug for Bangla ones, /jobs/:slug for English. */
export const jobPath = (job: Pick<JobCircular, "slug" | "language">) => `${job.language === "bn" ? "/bn" : ""}/jobs/${job.slug}`;

/** A date as readers in Bangladesh expect it, in the page's language. */
export const formatDeadline = (iso: string, lang: string) =>
  new Date(iso).toLocaleDateString(lang === "bn" ? "bn-BD" : "en-GB", { dateStyle: "medium", timeZone: "Asia/Dhaka" });
