import { GUIDE_META } from "./meta";
import type { GuideBody, GuideMeta } from "./types";

export type { GuideBody, GuideBodyLocale, GuideMeta, GuideMetaLocale, GuideSection } from "./types";

export const GUIDES: GuideMeta[] = GUIDE_META;

export const getGuide = (slug: string) => GUIDES.find((guide) => guide.slug === slug);

// One chunk per guide body, so each page downloads only its own article.
const bodies = import.meta.glob<{ default: GuideBody }>(["./*.ts", "!./index.ts", "!./meta.ts", "!./types.ts"]);

const cache = new Map<string, Promise<GuideBody>>();
const loaded = new Map<string, GuideBody>();

/** The guide body if it has already loaded, so rendering does not suspend. */
export const getLoadedGuideBody = (slug: string) => loaded.get(slug);

/** Stable promise per slug, suitable for React's use(). */
export const loadGuideBody = (slug: string): Promise<GuideBody> => {
  let promise = cache.get(slug);
  if (!promise) {
    const loader = bodies[`./${slug}.ts`];
    promise = loader
      ? loader().then((mod) => {
          loaded.set(slug, mod.default);
          return mod.default;
        })
      : Promise.reject(new Error(`Unknown guide: ${slug}`));
    cache.set(slug, promise);
  }
  return promise;
};
