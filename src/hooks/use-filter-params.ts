"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type FilterDefaults = Record<string, string>;

interface UseFilterParamsOptions {
  defaults: FilterDefaults;
  /** Keys debounced before writing to URL (e.g. search) */
  debounceKeys?: string[];
  debounceMs?: number;
}

function filterValuesEqual(a: FilterDefaults, b: FilterDefaults): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    if (a[key] !== b[key]) return false;
  }
  return true;
}

function readFromSearchParams(
  searchParams: ReturnType<typeof useSearchParams>,
  defaults: FilterDefaults
): FilterDefaults {
  const next = { ...defaults };
  for (const key of Object.keys(defaults)) {
    const fromUrl = searchParams.get(key);
    if (fromUrl != null) next[key] = fromUrl;
  }
  return next;
}

export function useFilterParams({
  defaults,
  debounceKeys = [],
  debounceMs = 300,
}: UseFilterParamsOptions) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const defaultsRef = useRef(defaults);
  defaultsRef.current = defaults;

  const debounceKeysRef = useRef(debounceKeys);
  debounceKeysRef.current = debounceKeys;

  const paramsKey = searchParams.toString();

  const [values, setValuesState] = useState<FilterDefaults>(() =>
    readFromSearchParams(searchParams, defaultsRef.current)
  );
  const [pending, setPending] = useState<FilterDefaults>({});

  // Sync from URL on external navigation; paramsKey is the only stable URL signal
  useEffect(() => {
    const next = readFromSearchParams(searchParams, defaultsRef.current);
    setValuesState((prev) => (filterValuesEqual(prev, next) ? prev : next));
    setPending({});
    // searchParams is read from closure when paramsKey changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey]);

  const writeUrl = useCallback(
    (next: FilterDefaults) => {
      const d = defaultsRef.current;
      const params = new URLSearchParams();
      for (const [key, val] of Object.entries(next)) {
        const defaultVal = d[key];
        if (val !== "" && val !== defaultVal) {
          params.set(key, val);
        }
      }
      const qs = params.toString();
      if (qs === paramsKey) return;
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [paramsKey, pathname, router]
  );

  const pendingKey = JSON.stringify(pending);
  useEffect(() => {
    if (Object.keys(pending).length === 0) return;
    const timer = setTimeout(() => {
      setValuesState((current) => {
        const merged = { ...current, ...pending };
        writeUrl(merged);
        return merged;
      });
      setPending({});
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [pendingKey, debounceMs, writeUrl]);

  const setValue = useCallback(
    (key: string, value: string) => {
      if (debounceKeysRef.current.includes(key)) {
        setPending((p) => ({ ...p, [key]: value }));
        setValuesState((v) => ({ ...v, [key]: value }));
        return;
      }
      setValuesState((v) => {
        const next = { ...v, [key]: value };
        writeUrl(next);
        return next;
      });
    },
    [writeUrl]
  );

  const clearAll = useCallback(() => {
    const d = defaultsRef.current;
    setValuesState(d);
    setPending({});
    router.replace(pathname, { scroll: false });
  }, [pathname, router]);

  const hasActiveFilters = useMemo(
    () =>
      Object.keys(defaultsRef.current).some(
        (key) => values[key] !== defaultsRef.current[key]
      ),
    [values]
  );

  return { values, setValue, clearAll, hasActiveFilters };
}
