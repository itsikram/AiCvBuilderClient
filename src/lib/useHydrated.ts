import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * False during prerendering and the hydration pass, true afterwards. Use it to
 * show visitor-specific UI (auth state, theme icon) without hydration mismatches.
 */
export const useHydrated = () =>
  useSyncExternalStore(subscribe, () => true, () => false);
