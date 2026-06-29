"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useT } from "@/i18n";
import { qk } from "@/queries/keys";
import { roomTypeQueries } from "@/queries/room.query";
import { roomTypeService } from "@/services/room-type.service";
import type { RoomTypeListParams } from "@/services/room-type.service";

export function useRoomTypes(apartmentId: string, params?: RoomTypeListParams) {
  return useQuery(roomTypeQueries.list(apartmentId, params));
}

export function useRoomTypeActions(apartmentId: string) {
  const t = useT();
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({
      queryKey: qk.roomTypes.all(apartmentId),
    });
  };

  const create = useMutation({
    mutationFn: (payload: unknown) =>
      roomTypeService.create(apartmentId, payload),
    onSuccess: () => {
      toast.success(t("room-type-added"));
      invalidate();
    },
  });

  const update = useMutation({
    mutationFn: ({
      roomTypeId,
      payload,
    }: {
      roomTypeId: string;
      payload: unknown;
    }) => roomTypeService.update(apartmentId, roomTypeId, payload),
    onSuccess: () => {
      toast.success(t("room-type-updated"));
      invalidate();
    },
  });

  const remove = useMutation({
    mutationFn: (roomTypeId: string) =>
      roomTypeService.remove(apartmentId, roomTypeId),
    onSuccess: () => {
      toast.success(t("room-type-deleted"));
      invalidate();
    },
  });

  return { create, update, remove };
}
