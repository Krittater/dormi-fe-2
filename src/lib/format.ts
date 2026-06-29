import { getIntlLocale, translate } from "@/i18n/runtime";

export function formatCurrency(
  value: number | string | null | undefined
): string {
  const n = typeof value === "number" ? value : Number(value);
  const safe = Number.isFinite(n) ? n : 0;
  return new Intl.NumberFormat(getIntlLocale(), {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safe);
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

export function formatPhone(value: string | null | undefined): string {
  if (!value) return "-";
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 9) {
    return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`;
  }
  return value;
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

/**
 * จำนวนวันจาก "วันนี้" ถึง "วันครบกำหนด" (ตัดเวลาออก นับเป็นวันเต็ม)
 *  > 0  = เหลืออีกกี่วัน
 *  = 0  = ครบกำหนดวันนี้
 *  < 0  = เลยกำหนดมาแล้ว (ค่าสัมบูรณ์ = เลยมากี่วัน)
 *  null = ไม่มีวันที่ / วันที่ไม่ถูกต้อง
 */
export function daysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  const due = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((due - today) / 86400000);
}
