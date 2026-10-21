// Build-time renderer used by scripts/prerender.mjs. Not shipped to browsers.
import { prerender } from "react-dom/static";
import { StaticRouter } from "react-router-dom";
import i18n from "@/i18n";
import { AppProviders, AppShell, type InitialQueryData } from "@/App";
import { HeadCollectorContext, type HeadData } from "@/components/seo/head";
import { getLangFromPath } from "@/lib/i18nRouting";
import { GUIDES } from "@/content/guides";
import { preloadRoute } from "@/lib/lazyPage";

/** Every public URL to prerender, in both languages, plus the 404 page. */
export const PRERENDER_ROUTES: string[] = (() => {
  const base = ["/", "/about", "/pricing", "/templates", "/blog", "/contact", ...GUIDES.map((g) => `/${g.slug}`)];
  return [...base, ...base.map((path) => (path === "/" ? "/bn" : `/bn${path}`))];
})();

export const GUIDE_DATES: Record<string, string> = Object.fromEntries(
  GUIDES.map((guide) => [`/${guide.slug}`, guide.updated])
);

export async function render(
  url: string,
  initialData?: InitialQueryData
): Promise<{ html: string; head: HeadData | undefined; lang: string }> {
  const lang = getLangFromPath(url);
  await i18n.changeLanguage(lang);
  let head: HeadData | undefined;
  const collector = { set: (data: HeadData) => void (head = data) };

  const tree = () => (
    <HeadCollectorContext.Provider value={collector}>
      <AppProviders initialData={initialData}>
        <StaticRouter location={url}>
          <AppShell />
        </StaticRouter>
      </AppProviders>
    </HeadCollectorContext.Provider>
  );

  // Load the route's code and content first so nothing suspends and the output
  // has no inline streaming scripts (which the CSP would block).
  await preloadRoute(url);
  const errors: unknown[] = [];
  const { prelude } = await prerender(tree(), {
    // Never outline large Suspense boundaries into streaming chunks: this is a static file
    progressiveChunkSize: Number.POSITIVE_INFINITY,
    onError: (error) => void errors.push(error),
  });
  const html = await new Response(prelude).text();
  if (errors.length) throw new AggregateError(errors, `Rendering ${url} failed`);
  return { html, head, lang };
}
