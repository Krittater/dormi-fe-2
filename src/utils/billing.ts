import type { BillingPeriod } from "@/types";
import { MONTH_CODES } from "@/constants/months";

export function formatBillingPeriodLabel(
  period: Pick<BillingPeriod, "periodYear" | "periodMonth">,
  t: (code: string) => string
): string {
  const monthIndex = (period.periodMonth ?? 1) - 1;
  const monthCode = MONTH_CODES[monthIndex] ?? MONTH_CODES[0];
  return `${t(monthCode)} ${period.periodYear ?? ""}`;
}

/**
 * ป้ายชื่อรอบบิลจาก dropdown API ซึ่งส่งมาแค่ name และรูปแบบไม่คงที่
 * ("2026-08 (RENT)" / "2026 กรกฎาคม") — แปลงให้เป็น "เดือน ปี" แบบเดียวกันทั้งแอป
 */
export function formatBillingPeriodName(
  name: string | undefined,
  period: { periodYear?: number; periodMonth?: number } | undefined,
  t: (code: string) => string
): string {
  if (period?.periodMonth != null && period?.periodYear != null) {
    return formatBillingPeriodLabel(
      { periodYear: period.periodYear, periodMonth: period.periodMonth },
      t
    );
  }
  if (!name) return "";
  const numeric = name.match(/^(\d{4})-(\d{1,2})/);
  if (numeric) {
    return formatBillingPeriodLabel(
      { periodYear: Number(numeric[1]), periodMonth: Number(numeric[2]) },
      t
    );
  }
  const yearFirst = name.match(/^(\d{4})\s+(.+)$/);
  if (yearFirst) return `${yearFirst[2]} ${yearFirst[1]}`;
  return name;
}

export function filterBillingPeriodsByTab(
  items: BillingPeriod[],
  tab: string,
  allValue: string
): BillingPeriod[] {
  if (tab === allValue) return items;
  return items.filter((b) => b.status === tab);
}
