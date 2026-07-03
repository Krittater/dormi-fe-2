import { buildQuery, http } from "@/api";
import { endpoints } from "@/lib/endpoints";
import { toList } from "@/lib/list";
import type { PaginationMeta, Tenant } from "@/types";
import { normalizeRoomOptions } from "@/utils/room";

export interface TenantListParams {
  page?: number;
  limit?: number;
}

export interface CreateTenantResult {
  tenantId: string;
  apartmentId: string;
  roomId?: string | null;
  userId: string;
  email?: string | null;
  phone: string;
  firstNameTH?: string | null;
  lastNameTH?: string | null;
  userCreated?: boolean;
  temporaryPasswordHint?: string;
}

export const tenantService = {
  async list(
    apartmentId: string,
    params?: TenantListParams
  ): Promise<{ items: Tenant[]; meta?: PaginationMeta }> {
    const res = await http.get(
      endpoints.tenants.list(apartmentId) + buildQuery(params)
    );
    const norm = toList<Tenant>(res);
    return { items: norm.items, meta: norm.meta };
  },

  async create(payload: unknown): Promise<CreateTenantResult> {
    return http.post<CreateTenantResult>(endpoints.tenants.create(), payload);
  },

  async updateById(tenantId: string, payload: unknown) {
    return http.patch(endpoints.tenants.updateById(tenantId), payload);
  },

  async moveOut(
    tenantId: string,
    apartmentId: string,
    moveOutDate?: string
  ) {
    return http.patch(endpoints.tenants.moveOut(tenantId, apartmentId), {
      moveOutDate: moveOutDate || undefined,
    });
  },

  async getRoomDropdown(apartmentId: string) {
    const res = await http.get(endpoints.rooms.dropdown(apartmentId));
    return normalizeRoomOptions(
      toList<{ roomId?: string; id?: string; name: string }>(res).items
    );
  },
};
