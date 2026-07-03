import { buildQuery, http } from "@/api";
import { endpoints } from "@/lib/endpoints";
import { toList } from "@/lib/list";
import type { Expense, PaginationMeta } from "@/types";
import type { FinanceListParams } from "@/services/income.service";

export const expenseService = {
  async list(
    apartmentId: string,
    params?: FinanceListParams
  ): Promise<{ items: Expense[]; meta?: PaginationMeta }> {
    const res = await http.get(
      endpoints.expenses.list(apartmentId) + buildQuery(params)
    );
    return toList<Expense>(res);
  },

  async create(apartmentId: string, payload: unknown): Promise<Expense> {
    return http.post<Expense>(endpoints.expenses.create(apartmentId), payload);
  },

  async update(
    apartmentId: string,
    expenseId: string,
    payload: unknown
  ): Promise<Expense> {
    return http.patch<Expense>(
      endpoints.expenses.update(apartmentId, expenseId),
      payload
    );
  },

  /** ยกเลิกรายการ (แทนการลบ) → status = VOID */
  async void(apartmentId: string, expenseId: string): Promise<Expense> {
    return http.patch<Expense>(endpoints.expenses.void(apartmentId, expenseId));
  },
};
