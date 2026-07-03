"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useT } from "@/i18n";
import { getApiErrorMessage } from "@/lib/format";
import { qk } from "@/queries/keys";
import { paymentAccountQueries } from "@/queries/finance.query";
import { paymentAccountService } from "@/services/payment-account.service";

export function usePaymentAccounts(apartmentId: string) {
  return useQuery(paymentAccountQueries.list(apartmentId));
}

export function usePaymentAccountActions(apartmentId: string) {
  const t = useT();
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({
      queryKey: qk.paymentAccounts.all(apartmentId),
    });
  };

  const create = useMutation({
    mutationFn: (payload: unknown) =>
      paymentAccountService.create(apartmentId, payload),
    onSuccess: () => {
      toast.success(t("account-added"));
      invalidate();
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const update = useMutation({
    mutationFn: ({
      accountId,
      payload,
    }: {
      accountId: string;
      payload: unknown;
    }) => paymentAccountService.update(apartmentId, accountId, payload),
    onSuccess: () => {
      toast.success(t("account-updated"));
      invalidate();
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const remove = useMutation({
    mutationFn: (accountId: string) =>
      paymentAccountService.remove(apartmentId, accountId),
    onSuccess: () => {
      toast.success(t("account-deleted"));
      invalidate();
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  return { create, update, remove };
}
