import { z } from "zod";

import {
  CUT_OFF_DATE,
  DEFAULT_ELECTRICITY_CUTOFF,
  DEFAULT_WATER_CUTOFF,
  DUE_DATE,
  ISSUE_DATE,
} from "@/constants/config";
import type { TranslateFn } from "@/i18n";
import { InvoiceType } from "@/types";

export const RATE_INVOICE_TYPES = [
  InvoiceType.ELECTRICITY,
  InvoiceType.WATER,
] as const;

export const makeInvoiceSetupSchema = (t: TranslateFn) =>
  z
    .object({
      type: z.nativeEnum(InvoiceType),
      cutOffDate: z.coerce.number().int().min(1).max(31),
      issueDate: z.coerce.number().int().min(1).max(31),
      dueDate: z.coerce.number().int().min(1).max(31),
      effectiveFrom: z.string().min(1, t("select-effective-date")),
      effectiveTo: z.string().optional(),
      ratePerUnit: z.string().optional(),
      isActive: z.boolean(),
    })
    .refine(
      (d) =>
        !RATE_INVOICE_TYPES.includes(d.type as (typeof RATE_INVOICE_TYPES)[number]) ||
        (d.ratePerUnit !== "" && d.ratePerUnit !== undefined),
      { message: t("rate-required-for-utilities"), path: ["ratePerUnit"] }
    );

export type InvoiceSetupFormValues = z.infer<
  ReturnType<typeof makeInvoiceSetupSchema>
>;

export const invoiceSetupDefaultValues: InvoiceSetupFormValues = {
  type: InvoiceType.RENT,
  cutOffDate: CUT_OFF_DATE,
  issueDate: ISSUE_DATE,
  dueDate: DUE_DATE,
  effectiveFrom: "",
  effectiveTo: "",
  ratePerUnit: "",
  isActive: true,
};

export const apartmentDefaultCutoffs = {
  invoiceCutOffDate: CUT_OFF_DATE,
  invoiceDueDate: DUE_DATE,
  electricityCutOffDate: DEFAULT_ELECTRICITY_CUTOFF,
  waterCutOffDate: DEFAULT_WATER_CUTOFF,
} as const;
