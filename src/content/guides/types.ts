import type { Lang } from "@/lib/i18nRouting";

export interface GuideSection {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
  /** Numbered steps; a section with steps also feeds HowTo structured data. */
  steps?: Array<{ name: string; text: string }>;
  /** A sample block shown in a monospace card, one line per entry. */
  example?: { title: string; lines: string[] };
}

/** Small per-language metadata, bundled everywhere (nav, footer, routes). */
export interface GuideMetaLocale {
  /** <title>, 60 characters or fewer */
  title: string;
  /** meta description, 155 characters or fewer */
  description: string;
  h1: string;
  /** Short label for breadcrumbs and cards */
  label: string;
}

/** Full article content, loaded only on the guide's own page. */
export interface GuideBodyLocale {
  /** Short answer shown first, above the fold */
  lead: string;
  sections: GuideSection[];
  faqs: Array<{ q: string; a: string }>;
  cta: { title: string; text: string; button: string };
}

export interface GuideMeta extends Record<Lang, GuideMetaLocale> {
  slug: string;
  /** ISO date of the last meaningful content update */
  updated: string;
  /** Builder entry point the CTA should open */
  ctaHref: string;
  related: string[];
}

export type GuideBody = Record<Lang, GuideBodyLocale>;
