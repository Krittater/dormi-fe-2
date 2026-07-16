import { buildQuery, http } from "@/api";
import { ROOMS_FETCH_ALL_LIMIT } from "@/constants/config";
import { endpoints } from "@/lib/endpoints";
import { toList } from "@/lib/list";
import type {
  BulkCreateRoomsPayload,
  BulkCreateRoomsResult,
  BulkDeleteRoomsResult,
  PaginationMeta,
  Room,
  RoomOverview,
} from "@/types";
import { normalizeRoomOptions, normalizeRooms } from "@/utils/room";

export interface RoomListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  isActive?: boolean;
}

export const roomService = {
  async list(
    apartmentId: string,
    params?: RoomListParams
  ): Promise<{ items: Room[]; meta?: PaginationMeta }> {
    const res = await http.get(
      endpoints.rooms.list(apartmentId) + buildQuery(params)
    );
    const norm = toList<Room>(res);
    return { items: normalizeRooms(norm.items), meta: norm.meta };
  },

  /** ดึงห้องครบทุกหน้า — หน้า rooms กรอง/เรียง/แบ่งหน้าฝั่ง FE บน dataset เต็ม */
  async listAll(apartmentId: string): Promise<Room[]> {
    const all: Room[] = [];
    let page = 1;
    for (;;) {
      const { items, meta } = await roomService.list(apartmentId, {
        page,
        limit: ROOMS_FETCH_ALL_LIMIT,
      });
      all.push(...items);
      const totalPages =
        meta?.totalPages ??
        (meta?.total != null
          ? Math.ceil(meta.total / ROOMS_FETCH_ALL_LIMIT)
          : undefined);
      const done =
        totalPages != null
          ? page >= totalPages
          : items.length < ROOMS_FETCH_ALL_LIMIT;
      if (done) return all;
      page += 1;
    }
  },

  async overview(apartmentId: string): Promise<RoomOverview> {
    return http.get<RoomOverview>(endpoints.rooms.overview(apartmentId));
  },

  async dropdown(apartmentId: string) {
    const res = await http.get(endpoints.rooms.dropdown(apartmentId));
    return normalizeRoomOptions(
      toList<{ roomId?: string; id?: string; name: string }>(res).items
    );
  },

  async getDetail(apartmentId: string, roomId: string) {
    return http.get(endpoints.rooms.detail(apartmentId, roomId));
  },

  async create(apartmentId: string, payload: unknown): Promise<Room> {
    return http.post<Room>(endpoints.rooms.create(apartmentId), payload);
  },

  async bulkCreate(
    apartmentId: string,
    payload: BulkCreateRoomsPayload
  ): Promise<BulkCreateRoomsResult> {
    return http.post<BulkCreateRoomsResult>(
      endpoints.rooms.bulkCreate(apartmentId),
      payload
    );
  },

  async update(roomId: string, payload: unknown): Promise<Room> {
    return http.patch<Room>(endpoints.rooms.update(roomId), payload);
  },

  async remove(apartmentId: string, roomId: string): Promise<void> {
    await http.delete(endpoints.rooms.remove(apartmentId, roomId));
  },

  async bulkRemove(
    apartmentId: string,
    roomIds: string[]
  ): Promise<BulkDeleteRoomsResult> {
    return http.post<BulkDeleteRoomsResult>(
      endpoints.rooms.bulkDelete(apartmentId),
      { roomIds }
    );
  },
};
