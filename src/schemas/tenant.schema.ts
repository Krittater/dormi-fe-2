import { z } from "zod";

import type { TranslateFn } from "@/i18n";

// Mirrors the backend's `@IsPhoneNumber('TH')` check (create-tenant.dto.ts):
// Thai numbers without the country code are 0 followed by 8-9 digits
// (9 digits for landlines, 10 for mobiles).
const THAI_PHONE_REGEX = /^0\d{8,9}$/;

export const makeTenantSchema = (t: TranslateFn) =>
  z.object({
    firstNameTH: z.string().min(1, t("enter-first-name")).max(100, t("too-long")),
    lastNameTH: z.string().min(1, t("enter-last-name")).max(100, t("too-long")),
    email: z.string().email(t("email-invalid")),
    phone: z.string().regex(THAI_PHONE_REGEX, t("phone-invalid")),
    roomId: z.string().optional(),
    monthlyRentOverride: z.string().optional(),
    depositAmount: z.string().optional(),
    contractStartDate: z.string().optional(),
    contractEndDate: z.string().optional(),
  });

export type TenantFormValues = z.infer<ReturnType<typeof makeTenantSchema>>;
