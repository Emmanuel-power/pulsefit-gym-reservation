import { useCallback, useSyncExternalStore } from "react";

/** Remembers the member's name & email in this browser so they don't retype it. No account needed. */
export interface Identity {
  name: string;
  email: string;
}

const KEY = "pulsefit.identity";
const listeners = new Set<() => void>();
let cached: { raw: string | null; value: Identity | null } = { raw: null, value: null };

function read(): Identity | null {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return cached.value;
  }
  if (raw !== cached.raw) {
    try {
      cached = { raw, value: raw ? (JSON.parse(raw) as Identity) : null };
    } catch {
      cached = { raw, value: null };
    }
  }
  return cached.value;
}

function write(value: Identity | null) {
  try {
    if (value) localStorage.setItem(KEY, JSON.stringify(value));
    else localStorage.removeItem(KEY);
  } catch {
    cached = { raw: cached.raw, value }; // storage unavailable; keep it in memory
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

export function useIdentity() {
  const identity = useSyncExternalStore(subscribe, read, () => null);
  const setIdentity = useCallback((value: Identity | null) => write(value), []);
  return [identity, setIdentity] as const;
}
