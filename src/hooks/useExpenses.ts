"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useT } from "@/i18n";
import { getApiErrorMessage } from "@/lib/format";
import { qk } from "@/queries/keys";
import { expenseQueries } from "@/queries/finance.query";
import { expenseService } from "@/services/expense.service";
import type { FinanceListParams } from "@/services/income.service";

export function useExpenses(apartmentId: string, params?: FinanceListParams) {
  return useQuery(expenseQueries.list(apartmentId, params));
}

export function useExpenseActions(apartmentId: string) {
  const t = useT();
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: qk.expenses.all(apartmentId) });
    queryClient.invalidateQueries({ queryKey: qk.finance.all(apartmentId) });
  };

  const create = useMutation({
    mutationFn: (payload: unknown) =>
      expenseService.create(apartmentId, payload),
    onSuccess: () => {
      toast.success(t("transaction-saved"));
      invalidate();
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const update = useMutation({
    mutationFn: ({
      expenseId,
      payload,
    }: {
      expenseId: string;
      payload: unknown;
    }) => expenseService.update(apartmentId, expenseId, payload),
    onSuccess: () => {
      toast.success(t("transaction-updated"));
      invalidate();
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const voidEntry = useMutation({
    mutationFn: (expenseId: string) =>
      expenseService.void(apartmentId, expenseId),
    onSuccess: () => {
      toast.success(t("transaction-voided"));
      invalidate();
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  return { create, update, voidEntry };
}
