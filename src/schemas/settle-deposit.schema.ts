import { z } from "zod";

import type { TranslateFn } from "@/i18n";

export const makeSettleDepositSchema = (t: TranslateFn) =>
  z.object({
    settledDate: z.string().min(1, t("enter-date")),
    refundAmount: z.string(),
    refundCategoryId: z.string().optional(),
    refundAccountId: z.string().optional(),
    forfeitCategoryId: z.string().optional(),
    forfeitAccountId: z.string().optional(),
    note: z.string().optional(),
  });

export type SettleDepositFormValues = z.infer<
  ReturnType<typeof makeSettleDepositSchema>
>;
