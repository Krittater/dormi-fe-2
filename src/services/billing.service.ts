import { buildQuery, http } from "@/api";
import { endpoints } from "@/lib/endpoints";
import { toList } from "@/lib/list";
import type {
  Apartment,
  ApartmentOverview,
  BillingPeriod,
  BillingPeriodStatus,
} from "@/types";
import type { BillingPeriodGenerateValues } from "@/schemas/billing.schema";

export const billingService = {
  async list(apartmentId: string): Promise<BillingPeriod[]> {
    const res = await http.get(endpoints.billingPeriods.list(apartmentId));
    return toList<BillingPeriod>(res).items;
  },

  async dropdown(
    apartmentId: string,
    params?: { type?: string; limit?: number }
  ): Promise<Array<{ id: string; name?: string; periodYear?: number; periodMonth?: number }>> {
    const res = await http.get(
      endpoints.billingPeriods.dropdown(apartmentId) + buildQuery(params)
    );
    return toList<{ id: string; name?: string; periodYear?: number; periodMonth?: number }>(
      res
    ).items;
  },

  async getById(
    apartmentId: string,
    billingPeriodId: string
  ): Promise<BillingPeriod> {
    return http.get<BillingPeriod>(
      endpoints.billingPeriods.byId(apartmentId, billingPeriodId)
    );
  },

  async generate(
    apartmentId: string,
    payload: BillingPeriodGenerateValues
  ): Promise<BillingPeriod> {
    return http.post<BillingPeriod>(
      endpoints.billingPeriods.generate(apartmentId),
      payload
    );
  },

  async updateStatus(
    apartmentId: string,
    billingPeriodId: string,
    status: BillingPeriodStatus
  ): Promise<BillingPeriod> {
    return http.patch<BillingPeriod>(
      endpoints.billingPeriods.status(apartmentId, billingPeriodId),
      { status }
    );
  },

  async remove(apartmentId: string, billingPeriodId: string): Promise<void> {
    await http.delete(endpoints.billingPeriods.remove(apartmentId, billingPeriodId));
  },

  async generateInvoices(
    apartmentId: string,
    billingPeriodId: string,
    body?: Record<string, unknown>
  ): Promise<unknown> {
    return http.post(
      endpoints.billingPeriods.generateInvoices(apartmentId, billingPeriodId),
      body ?? {}
    );
  },

  async regenerateInvoices(
    apartmentId: string,
    billingPeriodId: string
  ): Promise<unknown> {
    return http.post(
      endpoints.billingPeriods.regenerateInvoices(apartmentId, billingPeriodId)
    );
  },

  async publishInvoices(
    apartmentId: string,
    billingPeriodId: string,
    body?: { invoiceIds?: string[] }
  ): Promise<unknown> {
    return http.post(
      endpoints.billingPeriods.publishInvoices(apartmentId, billingPeriodId),
      body ?? {}
    );
  },
};

export const apartmentService = {
  async list(): Promise<ApartmentOverview[]> {
    const res = await http.get(endpoints.apartments.list());
    return toList<ApartmentOverview>(res).items;
  },

  async create(payload: Partial<Apartment>): Promise<Apartment> {
    return http.post<Apartment>(endpoints.apartments.create(), payload);
  },

  async update(id: string, payload: Partial<Apartment>): Promise<Apartment> {
    return http.patch<Apartment>(endpoints.apartments.update(id), payload);
  },

  async remove(id: string): Promise<void> {
    await http.delete(endpoints.apartments.remove(id));
  },
};
