import { queryOptions } from "@tanstack/react-query";

import { qk } from "@/queries/keys";
import { billingService } from "@/services/billing.service";
import { invoiceSetupService } from "@/services/invoice-setup.service";

export const billingQueries = {
  list: (apartmentId: string) =>
    queryOptions({
      queryKey: qk.billingPeriods.list(apartmentId),
      queryFn: () => billingService.list(apartmentId),
      enabled: Boolean(apartmentId),
    }),

  dropdown: (
    apartmentId: string,
    params?: { type?: string; limit?: number }
  ) =>
    queryOptions({
      queryKey: [...qk.billingPeriods.dropdown(apartmentId), params] as const,
      queryFn: () => billingService.dropdown(apartmentId, params),
      enabled: Boolean(apartmentId),
    }),

  detail: (apartmentId: string, billingPeriodId: string) =>
    queryOptions({
      queryKey: qk.billingPeriods.detail(apartmentId, billingPeriodId),
      queryFn: () => billingService.getById(apartmentId, billingPeriodId),
      enabled: Boolean(apartmentId) && Boolean(billingPeriodId),
    }),

  setups: (apartmentId: string) =>
    queryOptions({
      queryKey: qk.invoiceSetups.list(apartmentId),
      queryFn: () => invoiceSetupService.list(apartmentId),
      enabled: Boolean(apartmentId),
    }),
};
