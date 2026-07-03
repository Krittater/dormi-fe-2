import { z } from "zod";

import type { TranslateFn } from "@/i18n";
import { TenantDepositStatus } from "@/types";

export const makeTenantDepositSchema = (t: TranslateFn) =>
  z.object({
    tenantId: z.string().min(1, t("select-tenant")),
    roomId: z.string().optional(),
    amount: z.string().min(1, t("enter-amount")),
    receivedDate: z.string().min(1, t("enter-date")),
    status: z.nativeEnum(TenantDepositStatus),
    refundedAmount: z.string().optional(),
    settledDate: z.string().optional(),
    note: z.string().optional(),
  });

export type TenantDepositFormValues = z.infer<
  ReturnType<typeof makeTenantDepositSchema>
>;
