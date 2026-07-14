import { buildQuery, http } from "@/api";
import { endpoints } from "@/lib/endpoints";
import { toList } from "@/lib/list";
import type { PaginationMeta } from "@/types";

export interface AdminUser {
  userId: string;
  email: string;
  phone: string;
  firstNameTH: string | null;
  lastNameTH: string | null;
  status: string;
  lastLoginAt: string | null;
  createdAt: string;
  roles: { roleId: string; code: string; name: string }[];
}

export interface CreateAdminUserPayload {
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  firstNameTH?: string;
  lastNameTH?: string;
}

export const adminUserService = {
  async list(params?: {
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ items: AdminUser[]; meta?: PaginationMeta }> {
    const res = await http.get(endpoints.users.list() + buildQuery(params));
    return toList<AdminUser>(res);
  },

  create(payload: CreateAdminUserPayload) {
    return http.post<Omit<AdminUser, "roles" | "createdAt" | "lastLoginAt">>(
      endpoints.users.create(),
      payload
    );
  },

  remove(userId: string) {
    return http.delete(endpoints.users.remove(userId));
  },
};
