"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useT } from "@/i18n";
import { getApiErrorMessage } from "@/lib/format";
import { qk } from "@/queries/keys";
import { incomeQueries } from "@/queries/finance.query";
import {
  incomeService,
  type FinanceListParams,
} from "@/services/income.service";

export function useIncomes(apartmentId: string, params?: FinanceListParams) {
  return useQuery(incomeQueries.list(apartmentId, params));
}

export function useIncomeActions(apartmentId: string) {
  const t = useT();
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: qk.incomes.all(apartmentId) });
    // เงินเข้ากระทบยอดสรุป + สถานะบิล (paidAmount) → invalidate ด้วย
    queryClient.invalidateQueries({ queryKey: qk.finance.all(apartmentId) });
    queryClient.invalidateQueries({ queryKey: qk.invoices.all(apartmentId) });
  };

  const create = useMutation({
    mutationFn: (payload: unknown) =>
      incomeService.create(apartmentId, payload),
    onSuccess: () => {
      toast.success(t("transaction-saved"));
      invalidate();
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const update = useMutation({
    mutationFn: ({
      incomeId,
      payload,
    }: {
      incomeId: string;
      payload: unknown;
    }) => incomeService.update(apartmentId, incomeId, payload),
    onSuccess: () => {
      toast.success(t("transaction-updated"));
      invalidate();
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const voidEntry = useMutation({
    mutationFn: (incomeId: string) =>
      incomeService.void(apartmentId, incomeId),
    onSuccess: () => {
      toast.success(t("transaction-voided"));
      invalidate();
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  return { create, update, voidEntry };
}
