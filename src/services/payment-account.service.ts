import { http } from "@/api";
import { endpoints } from "@/lib/endpoints";
import { toList } from "@/lib/list";
import type { PaymentAccount } from "@/types";

export const paymentAccountService = {
  async list(apartmentId: string): Promise<PaymentAccount[]> {
    const res = await http.get(endpoints.paymentAccounts.list(apartmentId));
    return toList<PaymentAccount>(res).items;
  },

  async create(apartmentId: string, payload: unknown): Promise<PaymentAccount> {
    return http.post<PaymentAccount>(
      endpoints.paymentAccounts.create(apartmentId),
      payload
    );
  },

  async update(
    apartmentId: string,
    accountId: string,
    payload: unknown
  ): Promise<PaymentAccount> {
    return http.patch<PaymentAccount>(
      endpoints.paymentAccounts.update(apartmentId, accountId),
      payload
    );
  },

  async remove(apartmentId: string, accountId: string): Promise<void> {
    await http.delete(endpoints.paymentAccounts.remove(apartmentId, accountId));
  },
};
