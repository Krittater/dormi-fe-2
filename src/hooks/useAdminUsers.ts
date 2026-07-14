"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  adminUserService,
  type CreateAdminUserPayload,
} from "@/services/admin-user.service";
import { roleService } from "@/services/role.service";
import { useT } from "@/i18n";

export const adminUserKeys = {
  all: ["admin-users"] as const,
  list: (params: Record<string, unknown>) =>
    [...adminUserKeys.all, "list", params] as const,
};

export function useAdminUsers(params: {
  search?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: adminUserKeys.list(params),
    queryFn: () => adminUserService.list(params),
  });
}

export function useAdminUserActions() {
  const t = useT();
  const qc = useQueryClient();

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: adminUserKeys.all });
  };

  const create = useMutation({
    mutationFn: (payload: CreateAdminUserPayload) =>
      adminUserService.create(payload),
    onSuccess: () => {
      toast.success(t("user-created"));
      invalidate();
    },
  });

  const remove = useMutation({
    mutationFn: (userId: string) => adminUserService.remove(userId),
    onSuccess: () => {
      toast.success(t("user-deleted"));
      invalidate();
    },
  });

  const setGlobalRoles = useMutation({
    mutationFn: ({
      userId,
      roleIds,
    }: {
      userId: string;
      roleIds: string[];
    }) => roleService.setUserGlobalRoles(userId, roleIds),
    onSuccess: () => {
      toast.success(t("user-roles-saved"));
      invalidate();
    },
  });

  return { create, remove, setGlobalRoles };
}
