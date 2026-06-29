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

  const saveSetup = useMutation({
    mutationFn: (charges: unknown[]) =>
      roomChargeService.saveSetup(apartmentId, charges),
    onSuccess: () => {
      toast.success(t("room-charges-saved"));
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
