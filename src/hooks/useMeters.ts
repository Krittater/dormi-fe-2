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
  return useQuery(billingQueries.meterDropdown(apartmentId));
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

  // Recording/updating a single reading only affects that billing period's
  // readings — narrow the invalidation so we don't refetch the whole meter
  // list and every other cached period on each row save during bulk entry.
  const invalidateReadings = (billingPeriodId?: string) => {
    if (billingPeriodId) {
      queryClient.invalidateQueries({
        queryKey: qk.meters.byBillingPeriod(apartmentId, billingPeriodId),
      });
    } else {
      invalidate();
    }
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
      /** เมื่อระบุ จะ invalidate เฉพาะ readings ของงวดนี้ (bulk entry) */
      billingPeriodId?: string;
    }) => meterService.recordReading(meterReadingId, body),
    onSuccess: (_data, variables) => {
      toast.success(t("meter-reading-saved"));
      invalidateReadings(variables.billingPeriodId);
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
      /** เมื่อระบุ จะ invalidate เฉพาะ readings ของงวดนี้ (bulk entry) */
      billingPeriodId?: string;
    }) =>
      meterService.updateReading(
        apartmentId,
        meterId,
        meterReadingId,
        body
      ),
    onSuccess: (_data, variables) => {
      toast.success(t("meter-reading-saved"));
      invalidateReadings(variables.billingPeriodId);
    },
  });

  // บันทึกหลายห้องรวดเดียว — เรียก service ตรงเพื่อไม่ toast รายห้อง
  // แล้วสรุปผล + invalidate ครั้งเดียวตอนจบ
  const saveAllReadings = useMutation({
    mutationFn: async ({
      items,
    }: {
      items: Array<{
        meterId: string;
        meterReadingId: string;
        isNew: boolean;
        body: { previousValue: number; currentValue: number };
      }>;
      billingPeriodId?: string;
    }) => {
      let succeeded = 0;
      let failed = 0;
      for (const item of items) {
        try {
          if (item.isNew) {
            await meterService.recordReading(item.meterReadingId, item.body);
          } else {
            await meterService.updateReading(
              apartmentId,
              item.meterId,
              item.meterReadingId,
              item.body
            );
          }
          succeeded++;
        } catch {
          failed++;
        }
      }
      return { succeeded, failed };
    },
    onSuccess: ({ succeeded, failed }, variables) => {
      if (failed === 0) {
        toast.success(t("save-all-readings-success", { count: succeeded }));
      } else {
        toast.warning(
          t("save-all-readings-partial", { succeeded, failed })
        );
      }
      invalidateReadings(variables.billingPeriodId);
    },
  });

  return {
    create,
    remove,
    restore,
    recordReading,
    updateReading,
    saveAllReadings,
  };
}
