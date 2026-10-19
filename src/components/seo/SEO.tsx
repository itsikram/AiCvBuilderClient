import { createElement, Fragment, useContext, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { buildHead, HeadCollectorContext, safeJson, type SEOProps } from "./head";

export type { SEOProps } from "./head";

export function SEO(props: SEOProps) {
  const { pathname } = useLocation();
  const collector = useContext(HeadCollectorContext);
  const head = buildHead(props, pathname);

  useEffect(() => {
    document.documentElement.lang = head.lang === "bn" ? "bn-BD" : "en-BD";
  }, [head.lang]);

  // JSON-LD stays in the body on both server and client so hydration matches.
  const scripts = head.jsonLd.map((data, i) =>
    createElement("script", {
      key: `ld-${i}`,
      type: "application/ld+json",
      dangerouslySetInnerHTML: { __html: safeJson(data) },
    })
  );

  if (collector) {
    // Prerendering: the head tags are written into the HTML template instead.
    collector.set(head);
    return createElement(Fragment, null, ...scripts);
  }

  // React 19 hoists <title>, <meta> and <link> into <head>.
  return createElement(
    Fragment,
    null,
    createElement("title", null, head.title),
    ...head.tags.map((t, i) => createElement(t.tag, { key: `${t.tag}-${i}`, ...t.attrs })),
    ...scripts
  );
}
