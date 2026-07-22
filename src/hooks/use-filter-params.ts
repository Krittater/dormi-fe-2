"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type FilterDefaults = Record<string, string>;

interface UseFilterParamsOptions {
  defaults: FilterDefaults;
  /** Keys debounced before writing to URL (e.g. search) */
  debounceKeys?: string[];
  debounceMs?: number;
  /**
   * Keys ที่ไม่ใช่ตัวกรอง (เช่น view, page) — ไม่นับใน hasActiveFilters
   * ไม่งั้นสลับ view/เปลี่ยนหน้าแล้วปุ่ม "ล้างตัวกรอง" โผล่ทั้งที่ไม่ได้กรองอะไร
   */
  metaKeys?: string[];
  /** Keys ที่คงค่าเดิมไว้ตอน clearAll (เช่น view — ล้างตัวกรองไม่ควรสลับมุมมอง) */
  preserveOnClear?: string[];
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
  metaKeys = [],
  preserveOnClear = [],
}: UseFilterParamsOptions) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Latest-ref สำหรับ defaults/debounceKeys (caller ส่ง object literal ใหม่ทุก render)
  // เขียน ref ใน effect เท่านั้น — render ต้อง pure
  const defaultsRef = useRef(defaults);
  const debounceKeysRef = useRef(debounceKeys);
  const preserveOnClearRef = useRef(preserveOnClear);
  useEffect(() => {
    defaultsRef.current = defaults;
    debounceKeysRef.current = debounceKeys;
    preserveOnClearRef.current = preserveOnClear;
  });

  const paramsKey = searchParams.toString();

  const [values, setValuesState] = useState<FilterDefaults>(() =>
    readFromSearchParams(searchParams, defaults)
  );
  const [pending, setPending] = useState<FilterDefaults>({});

  // Latest values, updated synchronously so URL writes never run inside a
  // setState updater (React may replay updaters during render — a
  // router.replace there is a setState-in-render error)
  const valuesRef = useRef(values);

  // qs ทุกตัวที่เราเขียนเองและยังรอ echo — sync effect ต้องข้าม echo ของตัวเอง
  // ไม่งั้น pending (search ที่กำลังพิมพ์) จะถูกล้างกลางคัน ตัวอักษรหาย
  // เก็บเป็น Set เพราะพิมพ์เร็ว ๆ echo ของ write เก่าอาจมาถึงหลัง write ใหม่
  const selfWritesRef = useRef(new Set<string>());

  // Sync from URL on external navigation; paramsKey is the only stable URL signal
  useEffect(() => {
    if (selfWritesRef.current.delete(paramsKey)) return;
    // URL เปลี่ยนจากภายนอก (back/forward ฯลฯ) — self-write ค้างเก่าไม่เกี่ยวแล้ว
    selfWritesRef.current.clear();
    const next = readFromSearchParams(searchParams, defaultsRef.current);
    valuesRef.current = next;
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
      selfWritesRef.current.add(qs);
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [paramsKey, pathname, router]
  );

  const pendingKey = JSON.stringify(pending);
  useEffect(() => {
    if (Object.keys(pending).length === 0) return;
    const timer = setTimeout(() => {
      const merged = { ...valuesRef.current, ...pending };
      valuesRef.current = merged;
      setValuesState(merged);
      setPending({});
      writeUrl(merged);
    }, debounceMs);
    return () => clearTimeout(timer);
    // pending is read from closure when pendingKey changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingKey, debounceMs, writeUrl]);

  const setValue = useCallback(
    (key: string, value: string) => {
      const next = { ...valuesRef.current, [key]: value };
      valuesRef.current = next;
      setValuesState(next);
      if (debounceKeysRef.current.includes(key)) {
        setPending((p) => ({ ...p, [key]: value }));
        return;
      }
      writeUrl(next);
    },
    [writeUrl]
  );

  const clearAll = useCallback(() => {
    const d = defaultsRef.current;
    const next = { ...d };
    for (const key of preserveOnClearRef.current) {
      if (key in valuesRef.current) next[key] = valuesRef.current[key]!;
    }
    valuesRef.current = next;
    setValuesState(next);
    setPending({});
    writeUrl(next);
  }, [writeUrl]);

  const metaKeySet = new Set(metaKeys);
  const hasActiveFilters = Object.keys(defaults).some(
    (key) => !metaKeySet.has(key) && values[key] !== defaults[key]
  );

  return { values, setValue, clearAll, hasActiveFilters };
}
