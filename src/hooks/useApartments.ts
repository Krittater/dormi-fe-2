"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useT } from "@/i18n";
import { apartmentQueries } from "@/queries/invoice.query";
import { qk } from "@/queries/keys";
import { apartmentService } from "@/services/billing.service";
import type { Apartment } from "@/types";

export function useApartments() {
  return useQuery(apartmentQueries.list());
}

export function useApartmentDetail(
  apartmentId: string | undefined,
  enabled = true
) {
  return useQuery({
    ...apartmentQueries.detail(apartmentId ?? ""),
    enabled: enabled && Boolean(apartmentId),
  });
}

export function useApartmentOverview(apartmentId: string) {
  const overview = useQuery(apartmentQueries.overview(apartmentId));
  const invoices = useQuery(apartmentQueries.recentInvoices(apartmentId));
  const periods = useQuery(apartmentQueries.billingPeriods(apartmentId));

  return { overview, invoices, periods };
}

export function useApartmentActions() {
  const t = useT();
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: qk.apartments.all });
  };

  const create = useMutation({
    mutationFn: (payload: Partial<Apartment>) => apartmentService.create(payload),
    onSuccess: () => {
      toast.success(t("apartment-created"));
      invalidate();
    },
  });

  const update = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<Apartment>;
    }) => apartmentService.update(id, payload),
    onSuccess: (_data, { id }) => {
      toast.success(t("apartment-updated"));
      invalidate();
      // วันตัดรอบ/วันครบกำหนด/เรทที่แก้ มีผลกับ invoice setups และรอบบิลที่ยัง OPEN
      queryClient.invalidateQueries({ queryKey: qk.invoiceSetups.all(id) });
      queryClient.invalidateQueries({ queryKey: qk.billingPeriods.all(id) });
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => apartmentService.remove(id),
    onSuccess: () => {
      toast.success(t("apartment-deleted"));
      invalidate();
    },
  });

  return { create, update, remove };
}
