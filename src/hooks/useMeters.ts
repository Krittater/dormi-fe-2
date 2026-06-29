"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useT } from "@/i18n";
import { billingQueries } from "@/queries/billing.query";
import { qk } from "@/queries/keys";
import { meterQueries } from "@/queries/room.query";
import { meterService } from "@/services/meter.service";

export function useMeters(apartmentId: string) {
  return useQuery(meterQueries.list(apartmentId));
}

export function useMeterPeriodDropdown(apartmentId: string) {
  return useQuery(billingQueries.dropdown(apartmentId));
}

export function useMeterReadingsByPeriod(
  apartmentId: string,
  billingPeriodId: string
) {
  return useQuery(
    meterQueries.byBillingPeriod(apartmentId, billingPeriodId)
  );
}

export function useMeterReadings(apartmentId: string, meterId: string) {
  return useQuery(meterQueries.readings(apartmentId, meterId));
}

export function useMeterActions(apartmentId: string) {
  const t = useT();
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: qk.meters.all(apartmentId) });
  };

  const create = useMutation({
    mutationFn: (payload: unknown) =>
      meterService.create(apartmentId, payload),
    onSuccess: () => {
      toast.success(t("meter-created"));
      invalidate();
    },
  });

  const remove = useMutation({
    mutationFn: (meterId: string) =>
      meterService.remove(apartmentId, meterId),
    onSuccess: () => {
      toast.success(t("meter-deleted"));
      invalidate();
    },
  });

  const restore = useMutation({
    mutationFn: (meterId: string) =>
      meterService.restore(apartmentId, meterId),
    onSuccess: () => {
      toast.success(t("meter-restored"));
      invalidate();
    },
  });

  const recordReading = useMutation({
    mutationFn: ({
      meterReadingId,
      body,
    }: {
      meterReadingId: string;
      body: { previousValue: number; currentValue: number };
    }) => meterService.recordReading(meterReadingId, body),
    onSuccess: () => {
      toast.success(t("meter-reading-saved"));
      invalidate();
    },
  });

  const updateReading = useMutation({
    mutationFn: ({
      meterId,
      meterReadingId,
      body,
    }: {
      meterId: string;
      meterReadingId: string;
      body: { previousValue: number; currentValue: number };
    }) =>
      meterService.updateReading(
        apartmentId,
        meterId,
        meterReadingId,
        body
      ),
    onSuccess: () => {
      toast.success(t("meter-reading-saved"));
      invalidate();
    },
  });

  return { create, remove, restore, recordReading, updateReading };
}
