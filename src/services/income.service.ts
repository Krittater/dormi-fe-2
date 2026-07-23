import { buildQuery, http } from "@/api";
import { endpoints } from "@/lib/endpoints";
import { toList } from "@/lib/list";
import type { Income, PaginationMeta } from "@/types";

export interface FinanceListParams {
  period?: string;
  page?: number;
  limit?: number;
  status?: string;
  accountId?: string;
}

export const incomeService = {
  async list(
    apartmentId: string,
    params?: FinanceListParams
  ): Promise<{ items: Income[]; meta?: PaginationMeta }> {
    const res = await http.get(
      endpoints.incomes.list(apartmentId) + buildQuery(params)
    );
    return toList<Income>(res);
  },

  async create(apartmentId: string, payload: unknown): Promise<Income> {
    return http.post<Income>(endpoints.incomes.create(apartmentId), payload);
  },

  async update(
    apartmentId: string,
    incomeId: string,
    payload: unknown
  ): Promise<Income> {
    return http.patch<Income>(
      endpoints.incomes.update(apartmentId, incomeId),
      payload
    );
  },

  /** ยกเลิกรายการ (แทนการลบ) → status = VOID */
  async void(apartmentId: string, incomeId: string): Promise<Income> {
    return http.patch<Income>(endpoints.incomes.void(apartmentId, incomeId));
  },
};
