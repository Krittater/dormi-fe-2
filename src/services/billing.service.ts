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

/** One row per month: prefer the RENT period (the one invoices/actions apply to), else the first available type. */
function pickRepresentativePeriod(periods: BillingPeriod[]): BillingPeriod | undefined {
  return (
    periods.find((p) => p.type === BillingPeriodType.RENT) ?? periods[0]
  );
}

/** One row per month for meter recording — keeps both ELECTRICITY and WATER period IDs. */
export interface MeterPeriodGroup {
  key: string;
  periodYear: number;
  periodMonth: number;
  name: string;
  electricityPeriodId?: string;
  waterPeriodId?: string;
}

function buildMeterPeriodGroup(group: BillingPeriodGroup): MeterPeriodGroup | null {
  const periods = group.periods ?? [];
  const electricity = periods.find((p) => p.type === BillingPeriodType.ELECTRICITY);
  const water = periods.find((p) => p.type === BillingPeriodType.WATER);

  if (!electricity && !water) return null;

  return {
    key: `${group.periodYear}-${group.periodMonth}`,
    periodYear: group.periodYear,
    periodMonth: group.periodMonth,
    name:
      electricity?.name ??
      water?.name ??
      `${group.periodMonth}/${group.periodYear}`,
    electricityPeriodId: electricity?.id,
    waterPeriodId: water?.id,
  };
}

export const billingService = {
  async list(apartmentId: string): Promise<BillingPeriod[]> {
    const res = await http.get(endpoints.billingPeriods.list(apartmentId));
    const groups = toList<BillingPeriodGroup>(res).items;
    const periods = groups
      .map((group) => pickRepresentativePeriod(group.periods ?? []))
      .filter((period): period is BillingPeriod => Boolean(period));
    // #region agent log
    const sample = periods[0] as (BillingPeriod & Record<string, unknown>) | undefined;
    fetch('http://127.0.0.1:7741/ingest/3c08e7e7-ae2a-40d7-b163-da40d14b7a35',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'237d3a'},body:JSON.stringify({sessionId:'237d3a',runId:'pre-fix',hypothesisId:'B,E',location:'billing.service.ts:list',message:'billing period list field mapping',data:{apartmentId,groupCount:groups.length,periodCount:periods.length,sampleKeys:sample?Object.keys(sample):[],sampleName:sample?.name??null,sampleDisplayName:sample?.displayName??null,sampleInvoiceCount:sample?.invoiceCount??null,rawFirstPeriodKeys:groups[0]?.periods?.[0]?Object.keys(groups[0].periods[0] as object):[]},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    return periods;
  },

  /** Periods for the meter-reading-by-period picker: one entry per month with both utility period IDs. */
  async meterPeriodDropdown(apartmentId: string): Promise<MeterPeriodGroup[]> {
    const res = await http.get(
      `${endpoints.billingPeriods.list(apartmentId)}${buildQuery({ limit: 100 })}`
    );
    const groups = toList<BillingPeriodGroup>(res).items;
    return groups
      .map(buildMeterPeriodGroup)
      .filter((group): group is MeterPeriodGroup => Boolean(group));
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
    const period = await http.get<BillingPeriod & Record<string, unknown>>(
      endpoints.billingPeriods.byId(apartmentId, billingPeriodId)
    );
    // #region agent log
    fetch('http://127.0.0.1:7741/ingest/3c08e7e7-ae2a-40d7-b163-da40d14b7a35',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'237d3a'},body:JSON.stringify({sessionId:'237d3a',runId:'pre-fix',hypothesisId:'B,D',location:'billing.service.ts:getById',message:'billing period byId payload',data:{apartmentId,billingPeriodId,keys:period?Object.keys(period):[],name:period?.name??null,displayName:period?.displayName??null,status:period?.status??null,dueDate:period?.dueDate??null,periodStart:period?.periodStart??period?.periodStartDate??null,periodEnd:period?.periodEnd??period?.periodEndDate??null,invoiceCount:period?.invoiceCount??null,nestedInvoicesLen:Array.isArray(period?.invoices)?(period.invoices as unknown[]).length:null},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    return period;
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

  async getById(id: string): Promise<Apartment> {
    return http.get<Apartment>(endpoints.apartments.byId(id));
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
