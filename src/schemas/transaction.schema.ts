import { z } from "zod";

import type { TranslateFn } from "@/i18n";
import { TransactionCategoryType } from "@/types";

/** ฟอร์ม "บันทึกรายการ" — ใช้ได้ทั้งรายรับและรายจ่าย (สลับด้วย type) */
export const makeTransactionSchema = (t: TranslateFn) =>
  z.object({
    type: z.nativeEnum(TransactionCategoryType),
    categoryId: z.string().min(1, t("select-category")),
    accountId: z.string().min(1, t("select-account")),
    amount: z.string().min(1, t("enter-amount")),
    date: z.string().min(1, t("enter-date")),
    roomId: z.string().optional(),
    invoiceId: z.string().optional(),
    note: z.string().optional(),
  });

export type TransactionFormValues = z.infer<
  ReturnType<typeof makeTransactionSchema>
>;
