import { getIntlLocale, translate } from "@/i18n/runtime";

export function formatCurrency(value: number | null | undefined): string {
  const n = typeof value === "number" ? value : 0;
  return new Intl.NumberFormat(getIntlLocale(), {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export function formatNumber(value: number | null | undefined): string {
  const n = typeof value === "number" ? value : 0;
  return new Intl.NumberFormat(getIntlLocale(), {
    maximumFractionDigits: 2,
  }).format(n);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat(getIntlLocale(), {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function getInitials(name?: string | null): string {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
}

export function getApiErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "message" in err) {
    return String((err as { message: unknown }).message);
  }
  return translate("generic-error");
}
