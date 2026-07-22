import { http } from "@/api";
import { endpoints } from "@/lib/endpoints";
import { toList } from "@/lib/list";
import type { TenantDeposit } from "@/types";

export const tenantDepositService = {
  async list(apartmentId: string): Promise<TenantDeposit[]> {
    const res = await http.get(endpoints.tenantDeposits.list(apartmentId));
    return toList<TenantDeposit>(res).items;
  },

  async create(apartmentId: string, payload: unknown): Promise<TenantDeposit> {
    return http.post<TenantDeposit>(
      endpoints.tenantDeposits.create(apartmentId),
      payload
    );
  },

  async update(
    apartmentId: string,
    depositId: string,
    payload: unknown
  ): Promise<TenantDeposit> {
    return http.patch<TenantDeposit>(
      endpoints.tenantDeposits.update(apartmentId, depositId),
      payload
    );
  },

  async remove(apartmentId: string, depositId: string): Promise<void> {
    await http.delete(
      endpoints.tenantDeposits.remove(apartmentId, depositId)
    );
  },

  async settle(
    apartmentId: string,
    depositId: string,
    payload: unknown
  ): Promise<TenantDeposit> {
    return http.post<TenantDeposit>(
      endpoints.tenantDeposits.settle(apartmentId, depositId),
      payload
    );
  },

  async reverse(
    apartmentId: string,
    depositId: string
  ): Promise<TenantDeposit> {
    return http.post<TenantDeposit>(
      endpoints.tenantDeposits.reverse(apartmentId, depositId)
    );
  },
};
