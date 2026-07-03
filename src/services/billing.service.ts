import { buildQuery, http } from "@/api";
import { endpoints } from "@/lib/endpoints";
import { toList } from "@/lib/list";
import type {
  Apartment,
  ApartmentOverview,
  BillingPeriod,
  BillingPeriodGroup,
  BillingPeriodStatus,
} from "@/types";
import { BillingPeriodType } from "@/types";
import type { BillingPeriodGenerateValues } from "@/schemas/billing.schema";

/** One row per month: prefer the RENT period (the one invoices/actions apply to), else the first available type. */
function pickRepresentativePeriod(periods: BillingPeriod[]): BillingPeriod | undefined {
  return (
    periods.find((p) => p.type === BillingPeriodType.RENT) ?? periods[0]
  );
}

/** One row per month for meter recording — only ELECTRICITY/WATER periods have meter readings linked to them. */
function pickMeterPeriod(periods: BillingPeriod[]): BillingPeriod | undefined {
  return (
    periods.find((p) => p.type === BillingPeriodType.ELECTRICITY) ??
    periods.find((p) => p.type === BillingPeriodType.WATER)
  );
}

export const billingService = {
  async list(apartmentId: string): Promise<BillingPeriod[]> {
    const res = await http.get(endpoints.billingPeriods.list(apartmentId));
    const groups = toList<BillingPeriodGroup>(res).items;
    return groups
      .map((group) => pickRepresentativePeriod(group.periods ?? []))
      .filter((period): period is BillingPeriod => Boolean(period));
  },

  /** Periods for the meter-reading-by-period picker: one entry per month/year, never split by type. */
  async meterPeriodDropdown(apartmentId: string): Promise<BillingPeriod[]> {
    const res = await http.get(
      `${endpoints.billingPeriods.list(apartmentId)}${buildQuery({ limit: 100 })}`
    );
    const groups = toList<BillingPeriodGroup>(res).items;
    return groups
      .map((group) => pickMeterPeriod(group.periods ?? []))
      .filter((period): period is BillingPeriod => Boolean(period));
  },

  async dropdown(
    apartmentId: string
  ): Promise<Array<{ id: string; name?: string; periodYear?: number; periodMonth?: number }>> {
    const res = await http.get(endpoints.billingPeriods.dropdown(apartmentId));
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
    billingPeriodId: string
  ): Promise<unknown> {
    return http.post(
      endpoints.billingPeriods.publishInvoices(apartmentId, billingPeriodId)
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
