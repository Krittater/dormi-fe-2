import { http } from "@/api";
import { endpoints } from "@/lib/endpoints";
import { toList } from "@/lib/list";
import type { AccountingPeriod } from "@/types";

export const accountingPeriodService = {
  async list(apartmentId: string): Promise<AccountingPeriod[]> {
    const res = await http.get(endpoints.accountingPeriods.list(apartmentId));
    return toList<AccountingPeriod>(res).items;
  },

  async close(apartmentId: string, period: string): Promise<AccountingPeriod> {
    return http.post<AccountingPeriod>(
      endpoints.accountingPeriods.close(apartmentId, period)
    );
  },

  async reopen(
    apartmentId: string,
    period: string,
    reason: string
  ): Promise<AccountingPeriod> {
    return http.post<AccountingPeriod>(
      endpoints.accountingPeriods.reopen(apartmentId, period),
      { reason }
    );
  },
};
