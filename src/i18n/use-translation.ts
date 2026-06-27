"use client";

import { useCallback, useContext } from "react";

import { dictionary } from "./dictionary";
import { I18nContext } from "./provider";
import { DEFAULT_LOCALE, type Locale } from "./types";

export function useLocale() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useLocale must be used within an I18nProvider");
  }
  return ctx;
}

export type TranslateParams = Record<string, string | number>;
export type TranslateFn = (code: string, params?: TranslateParams) => string;

function interpolate(value: string, params?: TranslateParams): string {
  if (!params) return value;
  return value.replace(/\{(\w+)\}/g, (match, key) =>
    key in params ? String(params[key]) : match,
  );
}

export function useT(): TranslateFn {
  const ctx = useContext(I18nContext);
  const locale: Locale = ctx?.locale ?? DEFAULT_LOCALE;

  return useCallback(
    (code: string, params?: TranslateParams) => {
      const entry = dictionary[code];
      if (!entry) {
        if (process.env.NODE_ENV !== "production") {
          console.warn(`[i18n] Missing translation code: "${code}"`);
        }
        return code;
      }
      return interpolate(entry[locale] || entry.en || code, params);
    },
    [locale],
  );
}
