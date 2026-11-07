"use client";

import { useCallback, useEffect, useState } from "react";
import { api, errorMessage } from "./api";

export interface UseApiResult<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  reload: () => void;
  setData: React.Dispatch<React.SetStateAction<T | null>>;
}

interface CacheEntry {
  data: unknown;
  time: number;
}

const STORAGE_KEY = "mmu_api_cache_v1";
const MAX_PERSISTED = 40;
const cache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<unknown>>();
let persistent: Map<string, CacheEntry> | null = null;

function ttlFor(path: string) {
  return path.startsWith("/public/") ? 60_000 : 30_000;
}

function isPublic(path: string) {
  return path.startsWith("/public/");
}

function readCacheEntry<T>(path: string): CacheEntry | null {
  const entry = cache.get(path);
  if (!entry) return null;
  if (Date.now() - entry.time > ttlFor(path)) {
    cache.delete(path);
    return null;
  }
  return entry;
}

function readPersistent<T>(path: string): CacheEntry | null {
  if (typeof window === "undefined" || !isPublic(path)) return null;
  const stored = loadPersistent();
  const entry = stored.get(path);
  if (!entry) return null;
  if (Date.now() - entry.time > ttlFor(path)) {
    stored.delete(path);
    return null;
  }
  return entry;
}

function loadPersistent() {
  if (persistent) return persistent;
  persistent = new Map();
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, CacheEntry>) : {};
    for (const [key, entry] of Object.entries(parsed)) {
      if (!isPublic(key) || !entry || typeof entry !== "object") continue;
      const time = Number(entry.time);
      if (!Number.isFinite(time) || Date.now() - time > ttlFor(key)) continue;
      persistent.set(key, { data: entry.data, time });
    }
  } catch {
    persistent.clear();
  }
  return persistent;
}

function writePersistent(path: string, entry: CacheEntry) {
  if (typeof window === "undefined" || !isPublic(path)) return;
  const stored = loadPersistent();
  stored.set(path, entry);
  while (stored.size > MAX_PERSISTED) {
    const oldest = stored.keys().next().value;
    if (!oldest) break;
    stored.delete(oldest);
  }
  persist(stored);
}

function persist(stored: Map<string, CacheEntry>) {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(stored)));
  } catch {
    // Storage may be unavailable or full; the in-memory cache still works.
  }
}

function clearPersistent(prefix?: string) {
  if (typeof window === "undefined") return;
  const stored = loadPersistent();
  if (!prefix) {
    stored.clear();
  } else {
    for (const key of stored.keys()) {
      if (key.startsWith(prefix)) stored.delete(key);
    }
  }
  persist(stored);
}

function readCache<T>(path: string): T | null {
  const entry = readCacheEntry<T>(path);
  return entry ? (entry.data as T) : null;
}

function fetchShared<T>(path: string): Promise<T> {
  const existing = inFlight.get(path);
  if (existing) return existing as Promise<T>;
  const request = api<T>(path)
    .then((result) => {
      const entry = { data: result, time: Date.now() };
      cache.set(path, entry);
      writePersistent(path, entry);
      return result;
    })
    .finally(() => {
      inFlight.delete(path);
    });
  inFlight.set(path, request);
  return request;
}

export function invalidateApiCache(prefix?: string): void {
  if (!prefix) {
    cache.clear();
    clearPersistent();
    return;
  }
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
  clearPersistent(prefix);
}

export function seedApiCache<T>(path: string, data: T): void {
  if (!path || data === undefined || data === null) return;
  cache.set(path, { data, time: Date.now() });
}

export function prefetchApi(path: string): void {
  const cached = readCacheEntry(path);
  if (cached) return;
  void fetchShared(path).catch(() => undefined);
}

export function useApi<T>(path: string | null, options: { enabled?: boolean } = {}): UseApiResult<T> {
  const enabled = options.enabled !== false;
  const [data, setData] = useState<T | null>(() => (path && enabled ? readCache<T>(path) : null));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(path) && enabled && !data);
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => {
    if (path) {
      cache.delete(path);
      clearPersistent(path);
    }
    setNonce((value) => value + 1);
  }, [path]);

  useEffect(() => {
    if (!path || !enabled) {
      setLoading(false);
      return;
    }

    let active = true;
    const cached = nonce === 0 ? readCacheEntry<T>(path) || readPersistent<T>(path) : null;
    const fresh = cached ? Date.now() - cached.time < ttlFor(path) : false;

    if (cached) {
      setData(cached.data as T);
      setLoading(false);
    } else {
      setLoading(true);
    }
    setError(null);

    if (fresh) return;

    fetchShared<T>(path)
      .then((result) => {
        if (!active) return;
        setData(result);
      })
      .catch((caught) => {
        if (!active) return;
        setError(errorMessage(caught));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [path, enabled, nonce]);

  return { data, error, loading, reload, setData };
}

export function useDebounced<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
