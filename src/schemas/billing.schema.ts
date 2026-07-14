import { z } from "zod";

export const billingPeriodGenerateSchema = z.object({
  periodYear: z.coerce.number().int().min(2000).max(2100),
  periodMonth: z.coerce.number().int().min(1).max(12),
  type: z.string().optional(),
  setupId: z.string().optional(),
});

export type BillingPeriodGenerateValues = z.infer<
  typeof billingPeriodGenerateSchema
>;

export const ANY_SETUP = "any" as const;
