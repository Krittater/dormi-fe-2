import { buildQuery, http } from "@/api";
import { endpoints } from "@/lib/endpoints";

export interface FinanceSummary {
  period: string | null;
  totalIncome: number;
  totalExpense: number;
  net: number;
  invoiceTotal: number;
  invoicePaid: number;
  collectionRate: number | null; // % หรือ null ถ้ายังไม่มีบิล
}

export interface AccountBalance {
  accountId: string;
  name: string;
  type: string;
  isActive: boolean;
  income: number;
  expense: number;
  balance: number;
}

export interface AccountBalances {
  accounts: AccountBalance[];
  totalBalance: number;
}

export interface RevenueTrend {
  period: string;
  /** รายรับต่อวัน index 0 = วันที่ 1 (ยาว = จำนวนวันในเดือน) */
  daily: number[];
  total: number;
  prevTotal: number;
}

export const financeService = {
  async summary(
    apartmentId: string,
    params?: { period?: string }
  ): Promise<FinanceSummary> {
    return http.get<FinanceSummary>(
      endpoints.finance.summary(apartmentId) + buildQuery(params)
    );
  },

  async accountBalances(apartmentId: string): Promise<AccountBalances> {
    return http.get<AccountBalances>(
      endpoints.finance.accountBalances(apartmentId)
    );
  },

  async revenueTrend(
    apartmentId: string,
    period: string
  ): Promise<RevenueTrend> {
    return http.get<RevenueTrend>(
      endpoints.finance.revenueTrend(apartmentId) + buildQuery({ period })
    );
  },
};
