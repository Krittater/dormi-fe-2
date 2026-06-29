import { buildQuery, http } from "@/api";
import { endpoints } from "@/lib/endpoints";
import { toList } from "@/lib/list";
import type { PaginationMeta, RoomType } from "@/types";
import { normalizeRoomTypes } from "@/utils/room";

export interface RoomTypeListParams {
  page?: number;
  limit?: number;
  keyword?: string;
}

export const roomTypeService = {
  async list(
    apartmentId: string,
    params?: RoomTypeListParams
  ): Promise<{ items: RoomType[]; meta?: PaginationMeta }> {
    const res = await http.get(
      endpoints.roomTypes.list(apartmentId) + buildQuery(params)
    );
    const norm = toList<RoomType>(res);
    return { items: normalizeRoomTypes(norm.items), meta: norm.meta };
  },

  async create(apartmentId: string, payload: unknown): Promise<RoomType> {
    return http.post<RoomType>(endpoints.roomTypes.create(apartmentId), payload);
  },

  async update(
    apartmentId: string,
    roomTypeId: string,
    payload: unknown
  ): Promise<RoomType> {
    return http.patch<RoomType>(
      endpoints.roomTypes.update(apartmentId, roomTypeId),
      payload
    );
  },

  async remove(apartmentId: string, roomTypeId: string): Promise<void> {
    await http.delete(endpoints.roomTypes.remove(apartmentId, roomTypeId));
  },
};
