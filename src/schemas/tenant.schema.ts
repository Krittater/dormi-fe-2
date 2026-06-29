import { z } from "zod";

import type { TranslateFn } from "@/i18n";

export const makeTenantSchema = (t: TranslateFn) =>
  z.object({
    firstNameTH: z.string().min(1, t("enter-first-name")),
    lastNameTH: z.string().min(1, t("enter-last-name")),
    email: z.string().email(t("email-invalid")),
    phone: z.string().min(9, t("phone-invalid")),
    roomId: z.string().optional(),
    monthlyRentOverride: z.string().optional(),
    depositAmount: z.string().optional(),
    contractStartDate: z.string().optional(),
    contractEndDate: z.string().optional(),
  });

export type TenantFormValues = z.infer<ReturnType<typeof makeTenantSchema>>;
