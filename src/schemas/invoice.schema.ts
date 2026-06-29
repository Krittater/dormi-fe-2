import { z } from "zod";

import type { TranslateFn } from "@/i18n";
import { InvoiceItemType } from "@/types";

export const makeInvoiceSchema = (t: TranslateFn) =>
  z.object({
    billingPeriodId: z.string().min(1, t("please-select-billing-period")),
    roomId: z.string().min(1, t("please-select-room")),
    tenantId: z.string().min(1, t("please-select-tenant")),
    issuedDate: z.string().min(1, t("please-select-issue-date")),
    dueDate: z.string().min(1, t("please-select-due-date")),
    billType: z.string().optional(),
    items: z
      .array(
        z.object({
          itemType: z.nativeEnum(InvoiceItemType),
          description: z.string().min(1, t("enter-description")),
          quantity: z.coerce.number().min(1),
          unitPrice: z.coerce.number().min(0),
        })
      )
      .min(1, t("at-least-one-item")),
  });

export type InvoiceFormValues = z.infer<ReturnType<typeof makeInvoiceSchema>>;
