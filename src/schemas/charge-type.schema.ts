import { z } from "zod";

import type { TranslateFn } from "@/i18n";
import { ChargeTypeCategory } from "@/types";

export const makeChargeTypeSchema = (t: TranslateFn) =>
  z.object({
    name: z.string().min(1, t("enter-name")),
    description: z.string().optional(),
    category: z.nativeEnum(ChargeTypeCategory),
    defaultAmount: z.string().optional(),
    isActive: z.boolean(),
  });

export type ChargeTypeFormValues = z.infer<
  ReturnType<typeof makeChargeTypeSchema>
>;
