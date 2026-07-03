"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useT } from "@/i18n";
import { qk } from "@/queries/keys";
import { invoiceQueries } from "@/queries/invoice.query";
import { invoiceSetupQueries } from "@/queries/room.query";
import { invoiceService, type InvoiceListParams } from "@/services/invoice.service";
import { invoiceSetupService } from "@/services/invoice-setup.service";
import type { InvoiceItem } from "@/types";

export function useInvoices(apartmentId: string, params?: InvoiceListParams) {
  return useQuery(invoiceQueries.list(apartmentId, params));
}

export function useInvoiceDetail(apartmentId: string, invoiceId: string) {
  return useQuery(invoiceQueries.detail(apartmentId, invoiceId));
}

export function useInvoiceFormDropdowns(apartmentId: string, enabled = false) {
  return useQuery({
    ...invoiceQueries.formDropdowns(apartmentId),
    enabled: enabled && Boolean(apartmentId),
  });
}

export function useInvoiceActions(apartmentId: string, invoiceId?: string) {
  const t = useT();
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: qk.invoices.all(apartmentId) });
    if (invoiceId) {
      queryClient.invalidateQueries({
        queryKey: qk.invoices.detail(apartmentId, invoiceId),
      });
    }
  };

  const create = useMutation({
    mutationFn: (payload: unknown) =>
      invoiceService.create(apartmentId, payload),
    onSuccess: () => {
      toast.success(t("invoice-created"));
      invalidate();
    },
  });

  const updateItems = useMutation({
    mutationFn: (items: InvoiceItem[]) =>
      invoiceService.updateItems(apartmentId, invoiceId!, items),
    onSuccess: () => {
      toast.success(t("items-saved"));
      invalidate();
    },
  });

  const cancel = useMutation({
    mutationFn: () => invoiceService.cancel(apartmentId, invoiceId!),
    onSuccess: () => {
      toast.success(t("invoice-cancelled"));
      invalidate();
    },
  });

  return { create, updateItems, cancel };
}

export function useInvoiceSetups(apartmentId: string) {
  return useQuery(invoiceSetupQueries.list(apartmentId));
}

export function useInvoiceSetupActions(apartmentId: string) {
  const t = useT();
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({
      queryKey: qk.invoiceSetups.all(apartmentId),
    });
  };

  const create = useMutation({
    mutationFn: (payload: unknown) =>
      invoiceSetupService.create(apartmentId, payload),
    onSuccess: () => {
      toast.success(t("invoice-setup-added"));
      invalidate();
    },
  });

  const update = useMutation({
    mutationFn: ({
      setupId,
      payload,
    }: {
      setupId: string;
      payload: unknown;
    }) => invoiceSetupService.update(setupId, payload),
    onSuccess: () => {
      toast.success(t("invoice-setup-updated"));
      invalidate();
    },
  });

  const remove = useMutation({
    mutationFn: (setupId: string) =>
      invoiceSetupService.remove(apartmentId, setupId),
    onSuccess: () => {
      toast.success(t("invoice-setup-deleted"));
      invalidate();
    },
  });

  return { create, update, remove };
}
