import { queryOptions } from "@tanstack/react-query";

import { qk } from "@/queries/keys";
import {
  apartmentOverviewService,
  invoiceService,
  type InvoiceListParams,
} from "@/services/invoice.service";
import { apartmentService } from "@/services/billing.service";

export const apartmentQueries = {
  list: () =>
    queryOptions({
      queryKey: qk.apartments.list(),
      queryFn: () => apartmentService.list(),
    }),

  detail: (apartmentId: string) =>
    queryOptions({
      queryKey: qk.apartments.detail(apartmentId),
      queryFn: () => apartmentService.getById(apartmentId),
      enabled: Boolean(apartmentId),
    }),

  overview: (apartmentId: string) =>
    queryOptions({
      queryKey: qk.rooms.overview(apartmentId),
      queryFn: () => apartmentOverviewService.getRoomOverview(apartmentId),
      enabled: Boolean(apartmentId),
    }),

  recentInvoices: (apartmentId: string) =>
    queryOptions({
      queryKey: [...qk.invoices.all(apartmentId), "recent"] as const,
      queryFn: () => apartmentOverviewService.getRecentInvoices(apartmentId),
      enabled: Boolean(apartmentId),
    }),

  billingPeriods: (apartmentId: string) =>
    queryOptions({
      queryKey: [...qk.billingPeriods.all(apartmentId), "overview"] as const,
      queryFn: () => apartmentOverviewService.getBillingPeriods(apartmentId),
      enabled: Boolean(apartmentId),
    }),
};

export const invoiceQueries = {
  list: (apartmentId: string, params?: InvoiceListParams) =>
    queryOptions({
      queryKey: qk.invoices.list(apartmentId, params),
      queryFn: () => invoiceService.list(apartmentId, params),
      enabled: Boolean(apartmentId),
    }),

  detail: (apartmentId: string, invoiceId: string) =>
    queryOptions({
      queryKey: qk.invoices.detail(apartmentId, invoiceId),
      queryFn: () => invoiceService.getDetail(apartmentId, invoiceId),
      enabled: Boolean(apartmentId) && Boolean(invoiceId),
    }),

  formDropdowns: (apartmentId: string) =>
    queryOptions({
      queryKey: qk.invoices.formDropdowns(apartmentId),
      queryFn: () => invoiceService.formDropdowns(apartmentId),
      enabled: Boolean(apartmentId),
    }),

  byBillingPeriod: (
    apartmentId: string,
    billingPeriodId: string,
    limit = 100
  ) =>
    queryOptions({
      queryKey: [
        ...qk.invoices.all(apartmentId),
        "byBillingPeriod",
        billingPeriodId,
        limit,
      ] as const,
      queryFn: () =>
        invoiceService.list(apartmentId, { billingPeriodId, limit }),
      enabled: Boolean(apartmentId) && Boolean(billingPeriodId),
    }),
};
