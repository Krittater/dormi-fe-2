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

export function filterBillingPeriodsByTab(
  items: BillingPeriod[],
  tab: string,
  allValue: string
): BillingPeriod[] {
  if (tab === allValue) return items;
  return items.filter((b) => b.status === tab);
}
