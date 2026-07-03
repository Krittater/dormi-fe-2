import { http } from "@/api";
import { endpoints } from "@/lib/endpoints";
import { toList } from "@/lib/list";
import type { TransactionCategory } from "@/types";

export const transactionCategoryService = {
  async list(apartmentId: string): Promise<TransactionCategory[]> {
    const res = await http.get(
      endpoints.transactionCategories.list(apartmentId)
    );
    return toList<TransactionCategory>(res).items;
  },

  async create(
    apartmentId: string,
    payload: unknown
  ): Promise<TransactionCategory> {
    return http.post<TransactionCategory>(
      endpoints.transactionCategories.create(apartmentId),
      payload
    );
  },

  async update(
    apartmentId: string,
    categoryId: string,
    payload: unknown
  ): Promise<TransactionCategory> {
    return http.patch<TransactionCategory>(
      endpoints.transactionCategories.update(apartmentId, categoryId),
      payload
    );
  },

  async remove(apartmentId: string, categoryId: string): Promise<void> {
    await http.delete(
      endpoints.transactionCategories.remove(apartmentId, categoryId)
    );
  },
};
