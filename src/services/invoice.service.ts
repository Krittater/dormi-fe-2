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
    // endpoint dropdown รับ status แบบ "เท่ากับ" เท่านั้น → ยิง 2 สถานะที่ยังใช้งานได้
    // (OPEN + GENERATED) แล้วรวม = ตัด CANCELLED/CLOSED ทิ้ง
    const [periodsOpen, periodsGenerated, rooms, tenants, billTypes] =
      await Promise.all([
        http.get(
          endpoints.billingPeriods.dropdown(apartmentId) +
            buildQuery({ type: "RENT", status: "OPEN", limit: 12 })
        ),
        http.get(
          endpoints.billingPeriods.dropdown(apartmentId) +
            buildQuery({ type: "RENT", status: "GENERATED", limit: 12 })
        ),
        http.get(endpoints.rooms.dropdown(apartmentId)),
        http.get(
          endpoints.tenants.list(apartmentId) + buildQuery({ limit: 100 })
        ),
        http.get(endpoints.invoices.billTypeDropdown(apartmentId)),
      ]);

    type PeriodItem = { id: string; name: string; createdAt?: string };
    // รวมสองสถานะแล้วเรียงใหม่สุดก่อน (createdAt — รอบบิลถูกสร้างไล่ตามเดือนอยู่แล้ว)
    const periods = [
      ...toList<PeriodItem>(periodsOpen).items,
      ...toList<PeriodItem>(periodsGenerated).items,
    ].sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));

    return {
      periods,
      rooms: toList<{ roomId?: string; id?: string; name: string }>(rooms).items,
      tenants: toList<{
        id?: string;
        tenantId?: string;
        roomId?: string | null;
        isActive?: boolean;
        moveInDate?: string | null;
        // ชื่ออยู่ใต้ user ตาม mapTenantSummary ของ backend
        user?: { firstNameTH?: string | null; lastNameTH?: string | null };
        // เผื่อ shape เดิม (top-level) — ใช้เป็น fallback ตอนแสดงชื่อ
        firstNameTH?: string;
        lastNameTH?: string;
      }>(tenants).items,
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
