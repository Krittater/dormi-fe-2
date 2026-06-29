export const MONTH_CODES = [
  "month-january",
  "month-february",
  "month-march",
  "month-april",
  "month-may",
  "month-june",
  "month-july",
  "month-august",
  "month-september",
  "month-october",
  "month-november",
  "month-december",
] as const;

export type MonthCode = (typeof MONTH_CODES)[number];
