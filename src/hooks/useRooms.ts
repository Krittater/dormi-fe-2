"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useT } from "@/i18n";
import { qk } from "@/queries/keys";
import { roomQueries, roomTypeQueries } from "@/queries/room.query";
import { roomService, type RoomListParams } from "@/services/room.service";

export function useRooms(apartmentId: string, params?: RoomListParams) {
  return useQuery(roomQueries.list(apartmentId, params));
}

export function useRoomDropdown(apartmentId: string) {
  return useQuery(roomQueries.dropdown(apartmentId));
}

export function useRoomTypesDropdown(apartmentId: string, limit = 100) {
  return useQuery(
    roomTypeQueries.list(apartmentId, { limit, page: 1 })
  );
}

export function useRoomDetail(
  apartmentId: string,
  roomId: string | null,
  enabled = true
) {
  return useQuery({
    ...roomQueries.detail(apartmentId, roomId ?? ""),
    enabled: enabled && Boolean(roomId),
  });
}

export function useRoomActions(apartmentId: string) {
  const t = useT();
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: qk.rooms.all(apartmentId) });
  };

  const create = useMutation({
    mutationFn: (payload: unknown) => roomService.create(apartmentId, payload),
    onSuccess: () => {
      toast.success(t("room-created-with-meters"));
      invalidate();
    },
  });

  const update = useMutation({
    mutationFn: ({
      roomId,
      payload,
    }: {
      roomId: string;
      payload: unknown;
    }) => roomService.update(roomId, payload),
    onSuccess: () => {
      toast.success(t("room-updated"));
      invalidate();
    },
  });

  const remove = useMutation({
    mutationFn: (roomId: string) => roomService.remove(apartmentId, roomId),
    onSuccess: () => {
      toast.success(t("room-deleted"));
      invalidate();
    },
  });

  return { create, update, remove };
}
