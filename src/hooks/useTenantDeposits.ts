"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useT } from "@/i18n";
import { getApiErrorMessage } from "@/lib/format";
import { qk } from "@/queries/keys";
import { tenantDepositQueries } from "@/queries/finance.query";
import { tenantDepositService } from "@/services/tenant-deposit.service";

export function useTenantDeposits(apartmentId: string) {
  return useQuery(tenantDepositQueries.list(apartmentId));
}

export function useTenantDepositActions(apartmentId: string) {
  const t = useT();
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({
      queryKey: qk.tenantDeposits.all(apartmentId),
    });
  };

  // เคลียร์มัดจำสร้าง income/expense → invalidate ยอดสรุป + รายการเงิน + audit ด้วย
  const invalidateSettle = () => {
    invalidate();
    queryClient.invalidateQueries({ queryKey: qk.finance.all(apartmentId) });
    queryClient.invalidateQueries({ queryKey: qk.incomes.all(apartmentId) });
    queryClient.invalidateQueries({ queryKey: qk.expenses.all(apartmentId) });
    queryClient.invalidateQueries({ queryKey: qk.auditLogs.all(apartmentId) });
  };

  const create = useMutation({
    mutationFn: (payload: unknown) =>
      tenantDepositService.create(apartmentId, payload),
    onSuccess: () => {
      toast.success(t("deposit-added"));
      invalidate();
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const update = useMutation({
    mutationFn: ({
      depositId,
      payload,
    }: {
      depositId: string;
      payload: unknown;
    }) => tenantDepositService.update(apartmentId, depositId, payload),
    onSuccess: () => {
      toast.success(t("deposit-updated"));
      invalidate();
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const remove = useMutation({
    mutationFn: (depositId: string) =>
      tenantDepositService.remove(apartmentId, depositId),
    onSuccess: () => {
      toast.success(t("deposit-deleted"));
      invalidate();
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const settle = useMutation({
    mutationFn: ({
      depositId,
      payload,
    }: {
      depositId: string;
      payload: unknown;
    }) => tenantDepositService.settle(apartmentId, depositId, payload),
    onSuccess: () => {
      toast.success(t("deposit-settled"));
      invalidateSettle();
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  return { create, update, remove, settle };
}
