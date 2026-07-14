"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { roleService } from "@/services/role.service";
import { useT } from "@/i18n";

export const roleKeys = {
  all: ["roles"] as const,
  list: (apartmentId?: string) =>
    [...roleKeys.all, "list", apartmentId ?? "global"] as const,
  detail: (roleId: string) => [...roleKeys.all, "detail", roleId] as const,
  permissions: (assignable?: boolean) =>
    ["permissions", assignable ? "apartment" : "all"] as const,
  staff: (apartmentId: string) => ["staff", apartmentId] as const,
};

export function useRoles(apartmentId?: string, enabled = true) {
  return useQuery({
    queryKey: roleKeys.list(apartmentId),
    queryFn: () => roleService.list(apartmentId),
    enabled,
  });
}

export function useRoleDetail(roleId: string | null) {
  return useQuery({
    queryKey: roleKeys.detail(roleId ?? ""),
    queryFn: () => roleService.detail(roleId!),
    enabled: !!roleId,
  });
}

export function usePermissions(assignableToApartment?: boolean) {
  return useQuery({
    queryKey: roleKeys.permissions(assignableToApartment),
    queryFn: () => roleService.listPermissions(assignableToApartment),
  });
}

export function useApartmentStaff(apartmentId: string) {
  return useQuery({
    queryKey: roleKeys.staff(apartmentId),
    queryFn: () => roleService.listStaff(apartmentId),
    enabled: !!apartmentId,
  });
}

export function useRoleActions(apartmentId?: string) {
  const t = useT();
  const qc = useQueryClient();

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: roleKeys.all });
    if (apartmentId) {
      void qc.invalidateQueries({ queryKey: roleKeys.staff(apartmentId) });
    }
  };

  const create = useMutation({
    mutationFn: roleService.create,
    onSuccess: () => {
      toast.success(t("role-saved"));
      invalidate();
    },
  });

  const update = useMutation({
    mutationFn: ({
      roleId,
      ...payload
    }: {
      roleId: string;
      name?: string;
      description?: string;
    }) => roleService.update(roleId, payload),
    onSuccess: () => {
      toast.success(t("role-saved"));
      invalidate();
    },
  });

  const remove = useMutation({
    mutationFn: (roleId: string) => roleService.remove(roleId),
    onSuccess: () => {
      toast.success(t("role-deleted"));
      invalidate();
    },
  });

  const setPermissions = useMutation({
    mutationFn: ({
      roleId,
      permissionCodes,
    }: {
      roleId: string;
      permissionCodes: string[];
    }) => roleService.setPermissions(roleId, permissionCodes),
    onSuccess: () => {
      toast.success(t("role-permissions-saved"));
      invalidate();
    },
  });

  const setApartmentRoles = useMutation({
    mutationFn: ({
      userId,
      apartmentId: aptId,
      roleIds,
    }: {
      userId: string;
      apartmentId: string;
      roleIds: string[];
    }) => roleService.setUserApartmentRoles(userId, aptId, roleIds),
    onSuccess: () => {
      toast.success(t("staff-roles-saved"));
      invalidate();
    },
  });

  return { create, update, remove, setPermissions, setApartmentRoles };
}
