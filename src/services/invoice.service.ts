import { buildQuery, http } from "@/api";
import { endpoints } from "@/lib/endpoints";
import { toList } from "@/lib/list";
import { billingService } from "@/services/billing.service";
import type {
  Apartment,
  Invoice,
  InvoiceItem,
  PaginationMeta,
  RoomOverview,
} from "@/types";
import { mergeInvoiceDetail, normalizeInvoice } from "@/utils/invoice";

export interface InvoiceListParams {
  page?: number;
  limit?: number;
  status?: string;
  invoiceNumber?: string;
  billingPeriodId?: string;
}

export const invoiceService = {
  async list(
    apartmentId: string,
    params?: InvoiceListParams
  ): Promise<{ items: Invoice[]; meta?: PaginationMeta }> {
    const res = await http.get(
      endpoints.invoices.list(apartmentId) + buildQuery(params)
    );
    const norm = toList<Invoice>(res);
    return { items: norm.items.map(normalizeInvoice), meta: norm.meta };
  },

  async getById(apartmentId: string, invoiceId: string): Promise<Invoice> {
    return http.get<Invoice>(endpoints.invoices.byId(apartmentId, invoiceId));
  },

  async getDetail(
    apartmentId: string,
    invoiceId: string
  ): Promise<Invoice | null> {
    const [base, detail] = await Promise.all([
      http
        .get<Invoice>(endpoints.invoices.byId(apartmentId, invoiceId))
        .catch(() => null),
      http
        .get<Record<string, unknown>>(
          endpoints.invoices.detail(apartmentId, invoiceId)
        )
        .catch(() => null),
    ]);
    // #region agent log
    fetch('http://127.0.0.1:7741/ingest/3c08e7e7-ae2a-40d7-b163-da40d14b7a35',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'237d3a'},body:JSON.stringify({sessionId:'237d3a',runId:'pre-fix',hypothesisId:'A',location:'invoice.service.ts:getDetail',message:'invoice byId+details raw payloads',data:{apartmentId,invoiceId,baseOk:!!base,detailOk:!!detail,baseKeys:base?Object.keys(base as object):[],detailKeys:detail?Object.keys(detail):[],baseIssuedDate:(base as Record<string,unknown>|null)?.issuedDate??null,baseIssueDate:base?.issueDate??null,detailIssueDate:detail?.issueDate??null,baseRoomName:base?.roomName??null,baseTenantName:base?.tenantName??null,baseItemsLen:Array.isArray(base?.items)?base!.items!.length:null,detailItemsLen:Array.isArray(detail?.items)?(detail!.items as unknown[]).length:Array.isArray(detail?.invoiceItems)?(detail!.invoiceItems as unknown[]).length:null,sampleItem:((detail?.invoiceItems??detail?.items??base?.items) as unknown[]|undefined)?.[0]??null},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    return mergeInvoiceDetail(base, detail);
  },

  async create(apartmentId: string, payload: unknown): Promise<Invoice> {
    return http.post<Invoice>(endpoints.invoices.create(apartmentId), payload);
  },

  async updateItems(
    apartmentId: string,
    invoiceId: string,
    items: InvoiceItem[]
  ): Promise<Invoice> {
    return http.patch<Invoice>(
      endpoints.invoices.updateItems(apartmentId, invoiceId),
      { items }
    );
  },

  async cancel(apartmentId: string, invoiceId: string): Promise<void> {
    await http.delete(endpoints.invoices.cancel(apartmentId, invoiceId));
  },

  async billTypeDropdown(apartmentId: string) {
    const res = await http.get(endpoints.invoices.billTypeDropdown(apartmentId));
    return toList<{ code: string; name: string; description?: string }>(res).items;
  },

  async formDropdowns(apartmentId: string) {
    const [periods, rooms, tenants, billTypes] = await Promise.all([
      http.get(endpoints.billingPeriods.dropdown(apartmentId)),
      http.get(endpoints.rooms.dropdown(apartmentId)),
      http.get(endpoints.tenants.list(apartmentId) + buildQuery({ limit: 100 })),
      http.get(endpoints.invoices.billTypeDropdown(apartmentId)),
    ]);
    return {
      periods: toList<{ id: string; name: string }>(periods).items,
      rooms: toList<{ roomId?: string; id?: string; name: string }>(rooms).items,
      tenants: toList<{ id?: string; tenantId?: string; firstNameTH?: string; lastNameTH?: string }>(
        tenants
      ).items,
      billTypes: toList<{ code: string; name: string }>(billTypes).items,
    };
  },
};

export const apartmentOverviewService = {
  async getRoomOverview(apartmentId: string): Promise<RoomOverview> {
    return http.get<RoomOverview>(endpoints.rooms.overview(apartmentId));
  },

  async getRecentInvoices(apartmentId: string, limit = 100) {
    const res = await http.get(
      endpoints.invoices.list(apartmentId) + buildQuery({ limit })
    );
    return toList<Invoice>(res).items;
  },

  async getBillingPeriods(apartmentId: string) {
    return billingService.list(apartmentId);
  },
};
