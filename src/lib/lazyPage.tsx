import { lazy, type ComponentType } from "react";
import { GUIDES, loadGuideBody } from "@/content/guides";

/**
 * lazy() with an explicit preload(). Once loaded, the page renders synchronously,
 * which the prerenderer relies on and which avoids a fallback flash on hydration.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function lazyPage<P extends Record<string, any>>(loader: () => Promise<{ default: ComponentType<P> }>) {
  let Loaded: ComponentType<P> | null = null;
  let pending: Promise<unknown> | null = null;
  const preload = () =>
    (pending ??= loader().then((mod) => {
      Loaded = mod.default;
      return mod;
    }));
  const Lazy = lazy(() => preload() as Promise<{ default: ComponentType<P> }>);
  const Page = (props: P) => (Loaded ? <Loaded {...props} /> : <Lazy {...props} />);
  return Object.assign(Page, { preload });
}

type Preload = () => Promise<unknown>;
let registry: { pages: Record<string, Preload>; guide: Preload; blogPost: Preload; notFound: Preload } | null = null;

export const registerRoutePreloads = (value: NonNullable<typeof registry>) => {
  registry = value;
};

/** Loads the code (and guide content) a public URL needs before rendering it. */
export async function preloadRoute(pathname: string): Promise<void> {
  if (!registry) return;
  const base = pathname.replace(/^\/bn(?=\/|$)/, "") || "/";
  const guide = GUIDES.find((g) => `/${g.slug}` === base);
  if (guide) {
    await Promise.all([registry.guide(), loadGuideBody(guide.slug)]);
  } else if (registry.pages[base]) {
    await registry.pages[base]();
  } else if (base.startsWith("/blog/")) {
    await registry.blogPost();
  } else if (base !== "/") {
    await registry.notFound();
  }
}
