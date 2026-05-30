"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

// Same-tab writes don't fire the native "storage" event (that only fires in
// *other* tabs), so we broadcast our own event to notify subscribers locally.
const LOCAL_EVENT = "expense-tracker:storage";

/**
 * localStorage-backed state via useSyncExternalStore.
 *
 * Reads happen through the store (not a mount effect), so there's no
 * setState-in-effect; getServerSnapshot returns null so SSR and the initial
 * hydration render use `fallback`, then React re-renders with the real value
 * before paint — avoiding the hydration mismatch a lazy initializer would
 * cause. `parse`, `serialize` and `fallback` must be referentially stable.
 */
export function useLocalStorageState<T>(
  key: string,
  fallback: T,
  parse: (raw: string) => T,
  serialize: (value: T) => string,
): [T, (updater: T | ((prev: T) => T)) => void] {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const handler = (event: Event) => {
        // Ignore cross-tab writes for unrelated keys.
        if (
          event instanceof StorageEvent &&
          event.key !== null &&
          event.key !== key
        ) {
          return;
        }
        onStoreChange();
      };
      window.addEventListener("storage", handler);
      window.addEventListener(LOCAL_EVENT, handler);
      return () => {
        window.removeEventListener("storage", handler);
        window.removeEventListener(LOCAL_EVENT, handler);
      };
    },
    [key],
  );

  const getSnapshot = useCallback(() => {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }, [key]);

  const raw = useSyncExternalStore(subscribe, getSnapshot, () => null);

  const value = useMemo(
    () => (raw == null ? fallback : parse(raw)),
    [raw, fallback, parse],
  );

  const setValue = useCallback(
    (updater: T | ((prev: T) => T)) => {
      let current: T;
      try {
        const stored = window.localStorage.getItem(key);
        current = stored == null ? fallback : parse(stored);
      } catch {
        current = fallback;
      }
      const next =
        typeof updater === "function"
          ? (updater as (prev: T) => T)(current)
          : updater;
      try {
        window.localStorage.setItem(key, serialize(next));
      } catch {
        // Ignore write failures (private mode, quota exceeded).
      }
      window.dispatchEvent(new Event(LOCAL_EVENT));
    },
    [key, fallback, parse, serialize],
  );

  return [value, setValue];
}
