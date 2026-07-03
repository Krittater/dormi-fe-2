import { queryOptions } from "@tanstack/react-query";

import { qk } from "@/queries/keys";
import {
  incomeService,
  type FinanceListParams,
} from "@/services/income.service";
import { expenseService } from "@/services/expense.service";
import { financeService } from "@/services/finance.service";
import { paymentAccountService } from "@/services/payment-account.service";
import { transactionCategoryService } from "@/services/transaction-category.service";
import { tenantDepositService } from "@/services/tenant-deposit.service";
import { accountingPeriodService } from "@/services/accounting-period.service";
import {
  auditLogService,
  type AuditListParams,
} from "@/services/audit-log.service";

export const financeQueries = {
  summary: (apartmentId: string, params?: { period?: string }) =>
    queryOptions({
      queryKey: qk.finance.summary(apartmentId, params),
      queryFn: () => financeService.summary(apartmentId, params),
      enabled: Boolean(apartmentId),
    }),
};

export const incomeQueries = {
  list: (apartmentId: string, params?: FinanceListParams) =>
    queryOptions({
      queryKey: qk.incomes.list(apartmentId, params),
      queryFn: () => incomeService.list(apartmentId, params),
      enabled: Boolean(apartmentId),
    }),
};

export const expenseQueries = {
  list: (apartmentId: string, params?: FinanceListParams) =>
    queryOptions({
      queryKey: qk.expenses.list(apartmentId, params),
      queryFn: () => expenseService.list(apartmentId, params),
      enabled: Boolean(apartmentId),
    }),
};

export const paymentAccountQueries = {
  list: (apartmentId: string) =>
    queryOptions({
      queryKey: qk.paymentAccounts.list(apartmentId),
      queryFn: () => paymentAccountService.list(apartmentId),
      enabled: Boolean(apartmentId),
    }),
};

export const transactionCategoryQueries = {
  list: (apartmentId: string) =>
    queryOptions({
      queryKey: qk.transactionCategories.list(apartmentId),
      queryFn: () => transactionCategoryService.list(apartmentId),
      enabled: Boolean(apartmentId),
    }),
};

export const tenantDepositQueries = {
  list: (apartmentId: string) =>
    queryOptions({
      queryKey: qk.tenantDeposits.list(apartmentId),
      queryFn: () => tenantDepositService.list(apartmentId),
      enabled: Boolean(apartmentId),
    }),
};

export const accountingPeriodQueries = {
  list: (apartmentId: string) =>
    queryOptions({
      queryKey: qk.accountingPeriods.list(apartmentId),
      queryFn: () => accountingPeriodService.list(apartmentId),
      enabled: Boolean(apartmentId),
    }),
};

export const auditLogQueries = {
  list: (apartmentId: string, params?: AuditListParams) =>
    queryOptions({
      queryKey: qk.auditLogs.list(apartmentId, params),
      queryFn: () => auditLogService.list(apartmentId, params),
      enabled: Boolean(apartmentId),
    }),
};
