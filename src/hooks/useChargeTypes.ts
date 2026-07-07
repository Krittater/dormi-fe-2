"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useT } from "@/i18n";
import { qk } from "@/queries/keys";
import {
  chargeTypeQueries,
  roomChargeQueries,
} from "@/queries/room.query";
import { chargeTypeService } from "@/services/charge-type.service";
import { roomChargeService } from "@/services/room-charge.service";
import type { SetupRow } from "@/utils/room-charge";

/** Payload หนึ่งรายการที่ส่งเข้า saveSetup (charge เดี่ยว + flag ระดับห้อง) */
export interface SaveSetupCharge {
  id: string;
  amount: number;
  unit?: number | null;
  isCalWater?: boolean;
  isCalElectric?: boolean;
}

export function useChargeTypes(apartmentId: string) {
  return useQuery(chargeTypeQueries.list(apartmentId));
}

export function useChargeTypeActions(apartmentId: string) {
  const t = useT();
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({
      queryKey: qk.chargeTypes.all(apartmentId),
    });
  };

  const create = useMutation({
    mutationFn: (payload: unknown) =>
      chargeTypeService.create(apartmentId, payload),
    onSuccess: () => {
      toast.success(t("charge-type-added"));
      invalidate();
    },
  });

  const update = useMutation({
    mutationFn: ({
      chargeTypeId,
      payload,
    }: {
      chargeTypeId: string;
      payload: unknown;
    }) => chargeTypeService.update(apartmentId, chargeTypeId, payload),
    onSuccess: () => {
      toast.success(t("charge-type-updated"));
      invalidate();
    },
  });

  const remove = useMutation({
    mutationFn: (chargeTypeId: string) =>
      chargeTypeService.remove(apartmentId, chargeTypeId),
    onSuccess: () => {
      toast.success(t("charge-type-deleted"));
      invalidate();
    },
  });

  return { create, update, remove };
}

export function useRoomChargeSetup(apartmentId: string) {
  return useQuery(roomChargeQueries.setup(apartmentId));
}

export function useRoomChargeDropdowns(apartmentId: string) {
  return useQuery(roomChargeQueries.dropdowns(apartmentId));
}

export function useRoomChargeActions(apartmentId: string) {
  const t = useT();
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({
      queryKey: qk.roomCharges.all(apartmentId),
    });
  };

  const setupKey = qk.roomCharges.setup(apartmentId);

  const saveSetup = useMutation({
    mutationFn: (charges: SaveSetupCharge[]) =>
      roomChargeService.saveSetup(apartmentId, charges),
    // Optimistic update: สะท้อน amount/unit และ flag ระดับห้องลง cache ทันที
    // เพื่อให้ switch/การแก้ค่าตอบสนองทันที โดยไม่ต้องรอ refetch.
    onMutate: async (charges: SaveSetupCharge[]) => {
      await queryClient.cancelQueries({ queryKey: setupKey });
      const previous = queryClient.getQueryData<SetupRow[]>(setupKey);
      if (previous) {
        const byId = new Map(charges.map((c) => [c.id, c]));
        const next = previous.map((row) => {
          // ดึง flag ระดับห้องจาก charge ใดก็ได้ในห้องนี้ที่อยู่ใน payload
          const flagSource = row.room.charges.find((c) => byId.has(c.id));
          const flags = flagSource ? byId.get(flagSource.id) : undefined;
          return {
            room: {
              ...row.room,
              isCalWater: flags?.isCalWater ?? row.room.isCalWater,
              isCalElectric: flags?.isCalElectric ?? row.room.isCalElectric,
              charges: row.room.charges.map((c) => {
                const upd = byId.get(c.id);
                return upd
                  ? { ...c, amount: upd.amount, unit: upd.unit ?? null }
                  : c;
              }),
            },
          };
        });
        queryClient.setQueryData(setupKey, next);
      }
      return { previous };
    },
    onError: (_err, _charges, context) => {
      if (context?.previous) {
        queryClient.setQueryData(setupKey, context.previous);
      }
    },
    onSuccess: () => {
      toast.success(t("room-charges-saved"));
    },
    onSettled: () => {
      invalidate();
    },
  });

  const create = useMutation({
    mutationFn: (payload: unknown) =>
      roomChargeService.create(apartmentId, payload),
    onSuccess: () => {
      toast.success(t("room-charge-added"));
      invalidate();
    },
  });

  const update = useMutation({
    mutationFn: ({
      chargeId,
      payload,
    }: {
      chargeId: string;
      payload: unknown;
    }) => roomChargeService.update(apartmentId, chargeId, payload),
    onSuccess: () => {
      toast.success(t("room-charge-updated"));
      invalidate();
    },
  });

  const remove = useMutation({
    mutationFn: (chargeId: string) =>
      roomChargeService.remove(apartmentId, chargeId),
    onSuccess: () => {
      toast.success(t("room-charge-deleted"));
      invalidate();
    },
  });

  return { saveSetup, create, update, remove };
}
