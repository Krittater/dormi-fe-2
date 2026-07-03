"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useT } from "@/i18n";
import { getApiErrorMessage } from "@/lib/format";
import { qk } from "@/queries/keys";
import { transactionCategoryQueries } from "@/queries/finance.query";
import { transactionCategoryService } from "@/services/transaction-category.service";

export function useTransactionCategories(apartmentId: string) {
  return useQuery(transactionCategoryQueries.list(apartmentId));
}

export function useTransactionCategoryActions(apartmentId: string) {
  const t = useT();
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({
      queryKey: qk.transactionCategories.all(apartmentId),
    });
  };

  const create = useMutation({
    mutationFn: (payload: unknown) =>
      transactionCategoryService.create(apartmentId, payload),
    onSuccess: () => {
      toast.success(t("category-added"));
      invalidate();
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const update = useMutation({
    mutationFn: ({
      categoryId,
      payload,
    }: {
      categoryId: string;
      payload: unknown;
    }) => transactionCategoryService.update(apartmentId, categoryId, payload),
    onSuccess: () => {
      toast.success(t("category-updated"));
      invalidate();
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const remove = useMutation({
    mutationFn: (categoryId: string) =>
      transactionCategoryService.remove(apartmentId, categoryId),
    onSuccess: () => {
      toast.success(t("category-deleted"));
      invalidate();
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  return { create, update, remove };
}
