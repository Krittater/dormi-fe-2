"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useT } from "@/i18n";
import { qk } from "@/queries/keys";
import { tenantQueries } from "@/queries/room.query";
import { tenantService, type TenantListParams } from "@/services/tenant.service";

export function useTenants(apartmentId: string, params?: TenantListParams) {
  return useQuery(tenantQueries.list(apartmentId, params));
}

export function useTenantRoomDropdown(apartmentId: string) {
  return useQuery(tenantQueries.roomDropdown(apartmentId));
}

export function useTenantActions(apartmentId: string) {
  const t = useT();
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({
      queryKey: qk.tenants.all(apartmentId),
    });
    queryClient.invalidateQueries({
      queryKey: qk.rooms.all(apartmentId),
    });
  };

  const create = useMutation({
    mutationFn: (payload: unknown) => tenantService.create(payload),
    onSuccess: (result) => {
      if (result?.userCreated) {
        toast.success(t("tenant-added-new-account", { phone: result.phone }));
      } else {
        toast.success(t("tenant-added"));
      }
      invalidate();
    },
  });

  const update = useMutation({
    mutationFn: ({
      tenantId,
      payload,
    }: {
      tenantId: string;
      payload: unknown;
    }) => tenantService.updateById(tenantId, payload),
    onSuccess: () => {
      toast.success(t("tenant-updated"));
      invalidate();
    },
  });

  const moveOut = useMutation({
    mutationFn: ({
      tenantId,
      moveOutDate,
    }: {
      tenantId: string;
      moveOutDate?: string;
    }) => tenantService.moveOut(tenantId, apartmentId, moveOutDate),
    onSuccess: () => {
      toast.success(t("move-out-success"));
      invalidate();
    },
  });

  return { create, update, moveOut };
}
