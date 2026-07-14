import { buildQuery, http } from "@/api";
import { endpoints } from "@/lib/endpoints";
import { toList } from "@/lib/list";
import type {
  BulkCreateRoomsPayload,
  BulkCreateRoomsResult,
  BulkDeleteRoomsPayload,
  BulkDeleteRoomsResult,
  PaginationMeta,
  Room,
  RoomOverview,
} from "@/types";
import { normalizeRoomId, normalizeRoomOptions, normalizeRooms, normalizeRoomTypeId } from "@/utils/room";

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

  async overview(apartmentId: string): Promise<RoomOverview> {
    return http.get<RoomOverview>(endpoints.rooms.overview(apartmentId));
  },

  async dropdown(apartmentId: string) {
    const res = await http.get(endpoints.rooms.dropdown(apartmentId));
    return normalizeRoomOptions(
      toList<{ roomId?: string; id?: string; name: string }>(res).items
    );
  },

  async getById(apartmentId: string, roomId: string): Promise<Room> {
    const room = await http.get<Room>(endpoints.rooms.byId(apartmentId, roomId));
    const normalized = normalizeRoomId(room);
    if (normalized.roomType) {
      normalized.roomType = normalizeRoomTypeId(normalized.roomType);
    }
    return normalized;
  },

  async getDetail(apartmentId: string, roomId: string) {
    return http.get<Record<string, unknown>>(
      endpoints.rooms.detail(apartmentId, roomId)
    );
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

  async bulkDelete(
    apartmentId: string,
    payload: BulkDeleteRoomsPayload
  ): Promise<BulkDeleteRoomsResult> {
    return http.post<BulkDeleteRoomsResult>(
      endpoints.rooms.bulkDelete(apartmentId),
      payload
    );
  },

  async update(roomId: string, payload: unknown): Promise<Room> {
    return http.patch<Room>(endpoints.rooms.update(roomId), payload);
  },

  async remove(apartmentId: string, roomId: string): Promise<void> {
    await http.delete(endpoints.rooms.remove(apartmentId, roomId));
  },
};
