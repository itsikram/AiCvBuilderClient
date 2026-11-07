import { useCallback, useSyncExternalStore } from "react";

/**
 * Small per-tab store backed by sessionStorage, for AI results the user paid quota
 * for (coach chat, interview practice). Writes go through this module, not through a
 * component, so an AI answer that arrives after the user left the page is still kept.
 * Falls back to memory when storage is unavailable.
 */
type Listener = () => void;
const values = new Map<string, unknown>();
const listeners = new Map<string, Set<Listener>>();

function read<T>(key: string, initial: T): T {
  if (values.has(key)) return values.get(key) as T;
  let value = initial;
  try {
    const raw = sessionStorage.getItem(key);
    if (raw) value = JSON.parse(raw) as T;
  } catch {
    /* storage unavailable or corrupt: start fresh */
  }
  values.set(key, value);
  return value;
}

export function updateSessionState<T>(key: string, initial: T, next: T | ((previous: T) => T)) {
  const value = typeof next === "function" ? (next as (previous: T) => T)(read(key, initial)) : next;
  values.set(key, value);
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or blocked: keep the in-memory value */
  }
  listeners.get(key)?.forEach((listener) => listener());
}

/** Forgets everything (on logout, so the next person on a shared computer sees nothing). */
export function clearSessionState() {
  values.clear();
  try {
    sessionStorage.clear();
  } catch {
    /* storage unavailable */
  }
  listeners.forEach((set) => set.forEach((listener) => listener()));
}

/** Like useState, but shared through the store above. `initial` should be a module constant. */
export function useSessionState<T>(key: string, initial: T) {
  const subscribe = useCallback(
    (listener: Listener) => {
      const set = listeners.get(key) ?? new Set<Listener>();
      listeners.set(key, set);
      set.add(listener);
      return () => {
        set.delete(listener);
      };
    },
    [key]
  );
  const value = useSyncExternalStore(
    subscribe,
    () => read(key, initial),
    () => initial
  );
  const setValue = useCallback((next: T | ((previous: T) => T)) => updateSessionState(key, initial, next), [key, initial]);
  return [value, setValue] as const;
}
