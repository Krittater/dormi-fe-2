"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { setRuntimeLocale } from "./runtime";
import { DEFAULT_LOCALE, LOCALES, type Locale } from "./types";

const STORAGE_KEY = "locale";

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const I18nContext = createContext<I18nContextValue | null>(null);

function isLocale(value: string | null | undefined): value is Locale {
  return !!value && (LOCALES as string[]).includes(value);
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    const stored =
      typeof window !== "undefined"
        ? window.localStorage.getItem(STORAGE_KEY)
        : null;
    if (isLocale(stored)) {
      setLocaleState(stored);
    }
  }, []);

  useEffect(() => {
    setRuntimeLocale(locale);
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
      document.cookie = `${STORAGE_KEY}=${next};path=/;max-age=31536000`;
    } catch {
      // ignore persistence errors (e.g. private mode)
    }
  }, []);

  const value = useMemo(() => ({ locale, setLocale }), [locale, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
