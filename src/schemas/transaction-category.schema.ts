import { z } from "zod";

import type { TranslateFn } from "@/i18n";
import { TransactionCategoryType } from "@/types";

export const makeTransactionCategorySchema = (t: TranslateFn) =>
  z.object({
    name: z.string().min(1, t("enter-name")),
    type: z.nativeEnum(TransactionCategoryType),
    isLiability: z.boolean(),
    isActive: z.boolean(),
  });

export type TransactionCategoryFormValues = z.infer<
  ReturnType<typeof makeTransactionCategorySchema>
>;
