import { createContext } from "react";
import { SITE_NAME, SITE_NAME_BN, absoluteUrl } from "@/lib/site";
import {
  HREFLANG,
  OG_LOCALE,
  alternatePath,
  getLangFromPath,
  stripLangPrefix,
  type Lang,
} from "@/lib/i18nRouting";

export interface SEOProps {
  /** Full page title. The brand is appended only when it fits within 60 characters. */
  title?: string;
  description?: string;
  /** Absolute or root-relative image; defaults to the OG image. */
  image?: string;
  type?: "website" | "article";
  noIndex?: boolean;
  /** Override the canonical path (defaults to the current path without query string). */
  canonicalPath?: string;
  /** Emit hreflang alternates; defaults to true for pages that exist in both languages. */
  alternates?: boolean;
  publishedTime?: string;
  modifiedTime?: string;
  jsonLd?: object | object[];
}

export interface HeadData {
  lang: Lang;
  title: string;
  tags: Array<{ tag: "meta" | "link"; attrs: Record<string, string> }>;
  jsonLd: object[];
  noIndex: boolean;
}

/** Set during prerendering; SEO writes its data here instead of rendering tags. */
export interface HeadCollector {
  set: (data: HeadData) => void;
}
export const HeadCollectorContext = createContext<HeadCollector | null>(null);

const DEFAULT_DESCRIPTION: Record<Lang, string> = {
  en: "Make a free ATS-friendly CV in Bangla or English. BD CV formats, AI writing help and instant PDF download for jobs in Bangladesh.",
  bn: "বাংলা বা ইংরেজিতে ফ্রি প্রফেশনাল সিভি তৈরি করুন। বাংলাদেশি সিভি ফরমেট, এআই লেখার সাহায্য ও সাথে সাথে পিডিএফ ডাউনলোড।",
};

const DEFAULT_TITLE: Record<Lang, string> = {
  en: "Free CV Maker BD – AI CV Builder for Bangladesh Jobs",
  bn: "ফ্রি সিভি তৈরি করুন – এআই সিভি বিল্ডার বিডি",
};

const withBrand = (title: string, lang: Lang) => {
  const brand = lang === "bn" ? SITE_NAME_BN : SITE_NAME;
  if (title.includes(SITE_NAME) || title.includes(SITE_NAME_BN)) return title;
  const branded = `${title} | ${brand}`;
  return branded.length <= 60 ? branded : title;
};

export function buildHead(props: SEOProps, pathname: string): HeadData {
  const lang = getLangFromPath(pathname);
  const title = props.title ? withBrand(props.title, lang) : DEFAULT_TITLE[lang];
  const description = props.description || DEFAULT_DESCRIPTION[lang];
  const canonical = absoluteUrl(props.canonicalPath ?? pathname);
  const image = absoluteUrl(props.image || "/og-image.jpg");
  const noIndex = Boolean(props.noIndex);

  if (import.meta.env.DEV) {
    if (title.length > 60) console.warn(`[SEO] title over 60 chars (${title.length}): ${title}`);
    if (description.length > 155) console.warn(`[SEO] description over 155 chars (${description.length}) on ${pathname}`);
  }

  const tags: HeadData["tags"] = [
    { tag: "meta", attrs: { name: "description", content: description } },
    { tag: "meta", attrs: { name: "robots", content: noIndex ? "noindex, nofollow" : "index, follow, max-image-preview:large" } },
  ];

  if (!noIndex) {
    tags.push({ tag: "link", attrs: { rel: "canonical", href: canonical } });
    const base = stripLangPrefix(props.canonicalPath ?? pathname);
    const enPath = alternatePath(base, "en");
    const bnPath = alternatePath(base, "bn");
    if (props.alternates !== false && enPath && bnPath) {
      tags.push(
        { tag: "link", attrs: { rel: "alternate", hrefLang: HREFLANG.en, href: absoluteUrl(enPath) } },
        { tag: "link", attrs: { rel: "alternate", hrefLang: HREFLANG.bn, href: absoluteUrl(bnPath) } },
        { tag: "link", attrs: { rel: "alternate", hrefLang: "x-default", href: absoluteUrl(enPath) } }
      );
    }
  }

  tags.push(
    { tag: "meta", attrs: { property: "og:title", content: title } },
    { tag: "meta", attrs: { property: "og:description", content: description } },
    { tag: "meta", attrs: { property: "og:url", content: canonical } },
    { tag: "meta", attrs: { property: "og:type", content: props.type || "website" } },
    { tag: "meta", attrs: { property: "og:image", content: image } },
    { tag: "meta", attrs: { property: "og:site_name", content: SITE_NAME } },
    { tag: "meta", attrs: { property: "og:locale", content: OG_LOCALE[lang] } },
    { tag: "meta", attrs: { name: "twitter:card", content: "summary_large_image" } },
    { tag: "meta", attrs: { name: "twitter:title", content: title } },
    { tag: "meta", attrs: { name: "twitter:description", content: description } },
    { tag: "meta", attrs: { name: "twitter:image", content: image } }
  );
  if (props.publishedTime) tags.push({ tag: "meta", attrs: { property: "article:published_time", content: props.publishedTime } });
  if (props.modifiedTime) tags.push({ tag: "meta", attrs: { property: "article:modified_time", content: props.modifiedTime } });

  const jsonLd = props.jsonLd ? (Array.isArray(props.jsonLd) ? props.jsonLd : [props.jsonLd]) : [];
  return { lang, title, tags, jsonLd, noIndex };
}

/** JSON for a <script> body: "</script>" and similar sequences cannot break out. */
export const safeJson = (value: unknown) => JSON.stringify(value).replace(/</g, "\\u003c");
