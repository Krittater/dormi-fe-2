import { z } from "zod";

import type { TranslateFn } from "@/i18n";
import { PaymentAccountType } from "@/types";

export const makePaymentAccountSchema = (t: TranslateFn) =>
  z.object({
    name: z.string().min(1, t("enter-name")),
    type: z.nativeEnum(PaymentAccountType),
    isActive: z.boolean(),
  });

export type PaymentAccountFormValues = z.infer<
  ReturnType<typeof makePaymentAccountSchema>
>;
