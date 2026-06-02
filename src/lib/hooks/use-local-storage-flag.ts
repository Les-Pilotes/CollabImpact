"use client";

import { useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function read(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * SSR-safe read of a localStorage key, kept in sync across tabs via the
 * `storage` event. Returns `null` until hydration completes; callers should
 * treat that as "unknown yet, render nothing" to avoid hydration mismatches.
 */
export function useLocalStorageValue(key: string): {
  value: string | null;
  hydrated: boolean;
  set: (value: string) => void;
  clear: () => void;
} {
  const value = useSyncExternalStore(
    subscribe,
    () => read(key),
    () => null, // server: nothing known
  );

  const hydrated = typeof window !== "undefined";

  return {
    value,
    hydrated,
    set(v: string) {
      if (typeof window === "undefined") return;
      window.localStorage.setItem(key, v);
      // useSyncExternalStore reads from localStorage on next render, but
      // localStorage doesn't fire `storage` for same-document writes.
      // Dispatching synthetic event forces the snapshot to re-read.
      window.dispatchEvent(new StorageEvent("storage", { key }));
    },
    clear() {
      if (typeof window === "undefined") return;
      window.localStorage.removeItem(key);
      window.dispatchEvent(new StorageEvent("storage", { key }));
    },
  };
}
