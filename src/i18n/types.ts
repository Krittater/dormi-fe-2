export type Locale = "th" | "en" | "cn";

export const LOCALES: Locale[] = ["th", "en", "cn"];

export const DEFAULT_LOCALE: Locale = "th";

export const LOCALE_LABELS: Record<Locale, string> = {
  th: "ไทย",
  en: "English",
  cn: "中文",
};

export interface Message {
  code: string;
  th: string;
  en: string;
  cn: string;
}
