import { dictionary } from "./dictionary";
import { DEFAULT_LOCALE, type Locale } from "./types";

const INTL_LOCALES: Record<Locale, string> = {
  // u-ca-gregory: บังคับปี ค.ศ. — th-TH เปล่า ๆ Intl จะใช้ปฏิทินพุทธ (พ.ศ.)
  // ทำให้ปีแสดงปนกันสองแบบทั้งแอป
  th: "th-TH-u-ca-gregory",
  en: "en-US",
  cn: "zh-CN",
};

let currentLocale: Locale = DEFAULT_LOCALE;

export function setRuntimeLocale(locale: Locale) {
  currentLocale = locale;
}

export function getRuntimeLocale(): Locale {
  return currentLocale;
}

export function getIntlLocale(): string {
  return INTL_LOCALES[currentLocale];
}

/** Translate outside React (utilities, stores). Components should use useT(). */
export function translate(
  code: string,
  params?: Record<string, string | number>,
): string {
  const entry = dictionary[code];
  const value = entry ? entry[currentLocale] || entry.en || code : code;
  if (!params) return value;
  return value.replace(/\{(\w+)\}/g, (match, key) =>
    key in params ? String(params[key]) : match,
  );
}
