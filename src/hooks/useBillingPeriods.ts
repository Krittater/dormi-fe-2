"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useT } from "@/i18n";
import { billingQueries } from "@/queries/billing.query";
import { invoiceQueries } from "@/queries/invoice.query";
import { qk } from "@/queries/keys";
import { billingService } from "@/services/billing.service";
import type { BillingPeriodGenerateValues } from "@/schemas/billing.schema";
import type { BillingPeriodStatus } from "@/types";

export function useBillingPeriods(apartmentId: string) {
  return useQuery(billingQueries.list(apartmentId));
}

export function useBillingPeriodSetups(apartmentId: string) {
  return useQuery(billingQueries.setups(apartmentId));
}

export function useBillingPeriodDropdown(apartmentId: string) {
  return useQuery(billingQueries.dropdown(apartmentId));
}

export function useBillingPeriod(apartmentId: string, billingPeriodId: string) {
  return useQuery(billingQueries.detail(apartmentId, billingPeriodId));
}

export function useBillingPeriodInvoices(
  apartmentId: string,
  billingPeriodId: string
) {
  return useQuery(invoiceQueries.byBillingPeriod(apartmentId, billingPeriodId));
}

export function useBillingActions(apartmentId: string) {
  const t = useT();
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({
      queryKey: qk.billingPeriods.all(apartmentId),
    });
    queryClient.invalidateQueries({
      queryKey: qk.invoices.all(apartmentId),
    });
  };

  const generate = useMutation({
    mutationFn: (payload: BillingPeriodGenerateValues) =>
      billingService.generate(apartmentId, payload),
    onSuccess: () => {
      toast.success(t("billing-period-created"));
      invalidate();
    },
  });

  const updateStatus = useMutation({
    mutationFn: ({
      billingPeriodId,
      status,
    }: {
      billingPeriodId: string;
      status: BillingPeriodStatus;
      successMessage?: string;
    }) => billingService.updateStatus(apartmentId, billingPeriodId, status),
    onSuccess: (_data, variables) => {
      if (variables.successMessage) {
        toast.success(variables.successMessage);
      }
      invalidate();
    },
  });

  const remove = useMutation({
    mutationFn: (billingPeriodId: string) =>
      billingService.remove(apartmentId, billingPeriodId),
    onSuccess: () => {
      toast.success(t("billing-period-deleted"));
      invalidate();
    },
  });

  const generateInvoices = useMutation({
    mutationFn: (billingPeriodId: string) =>
      billingService.generateInvoices(apartmentId, billingPeriodId, {
        skipExistingInvoices: true,
      }),
    onSuccess: () => {
      toast.success(t("invoices-generated-draft"));
      invalidate();
    },
  });

  const regenerateInvoices = useMutation({
    mutationFn: (billingPeriodId: string) =>
      billingService.regenerateInvoices(apartmentId, billingPeriodId),
    onSuccess: () => {
      toast.success(t("invoices-regenerated"));
      invalidate();
    },
  });

  const publishInvoices = useMutation({
    mutationFn: (billingPeriodId: string) =>
      billingService.publishInvoices(apartmentId, billingPeriodId),
    onSuccess: () => {
      toast.success(t("invoices-published"));
      invalidate();
    },
  });

  return {
    generate,
    updateStatus,
    remove,
    generateInvoices,
    regenerateInvoices,
    publishInvoices,
  };
}
