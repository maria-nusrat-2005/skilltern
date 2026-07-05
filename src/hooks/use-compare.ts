import { useSyncExternalStore, useCallback } from "react";

const KEY = "skilltern:compare";
const EVENT = "skilltern:compare-change";
const MAX = 3;

let cachedRaw: string | null = null;
let cachedIds: string[] = [];
const EMPTY: string[] = [];

function read(): string[] {
  if (typeof window === "undefined") return EMPTY;
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    return EMPTY;
  }
  // Return a stable reference when the underlying value hasn't changed,
  // otherwise useSyncExternalStore loops forever ("Maximum update depth exceeded").
  if (raw === cachedRaw) return cachedIds;
  cachedRaw = raw;
  try {
    const arr = raw ? (JSON.parse(raw) as unknown) : [];
    cachedIds = Array.isArray(arr) ? arr.map(String) : [];
  } catch {
    cachedIds = [];
  }
  return cachedIds;
}

function write(ids: string[]) {
  window.localStorage.setItem(KEY, JSON.stringify(ids));
  window.dispatchEvent(new Event(EVENT));
}


function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

export function useCompare() {
  const ids = useSyncExternalStore(subscribe, read, () => EMPTY);

  const toggle = useCallback((id: string) => {
    const current = read();
    if (current.includes(id)) {
      write(current.filter((x) => x !== id));
    } else if (current.length < MAX) {
      write([...current, id]);
    }
  }, []);

  const remove = useCallback((id: string) => {
    write(read().filter((x) => x !== id));
  }, []);

  const clear = useCallback(() => write([]), []);

  return {
    ids,
    has: (id: string) => ids.includes(id),
    isFull: ids.length >= MAX,
    toggle,
    remove,
    clear,
    max: MAX,
  };
}
