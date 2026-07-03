"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useT } from "@/i18n";
import { getApiErrorMessage } from "@/lib/format";
import { qk } from "@/queries/keys";
import { accountingPeriodQueries } from "@/queries/finance.query";
import { accountingPeriodService } from "@/services/accounting-period.service";

export function useAccountingPeriods(apartmentId: string) {
  return useQuery(accountingPeriodQueries.list(apartmentId));
}

export function useAccountingPeriodActions(apartmentId: string) {
  const t = useT();
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({
      queryKey: qk.accountingPeriods.all(apartmentId),
    });
  };

  const close = useMutation({
    mutationFn: (period: string) =>
      accountingPeriodService.close(apartmentId, period),
    onSuccess: () => {
      toast.success(t("period-closed"));
      invalidate();
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const reopen = useMutation({
    mutationFn: ({ period, reason }: { period: string; reason: string }) =>
      accountingPeriodService.reopen(apartmentId, period, reason),
    onSuccess: () => {
      toast.success(t("period-reopened"));
      invalidate();
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  return { close, reopen };
}
