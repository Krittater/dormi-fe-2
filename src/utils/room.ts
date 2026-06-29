import type { Room, RoomType } from "@/types";

export function normalizeRoomId<T extends { id?: string; roomId?: string }>(
  item: T
): T & { id: string } {
  return { ...item, id: item.id ?? item.roomId ?? "" };
}

export function normalizeRoomTypeId<T extends { id?: string; roomTypeId?: string }>(
  item: T
): T & { id: string } {
  return { ...item, id: item.id ?? item.roomTypeId ?? "" };
}

export function normalizeRooms(rooms: Room[]): Room[] {
  return rooms.map(normalizeRoomId);
}

export function normalizeRoomTypes(roomTypes: RoomType[]): RoomType[] {
  return roomTypes.map(normalizeRoomTypeId);
}

export interface RoomOption {
  id: string;
  name: string;
}

export function normalizeRoomOptions(
  items: Array<{ roomId?: string; id?: string; name: string }>
): RoomOption[] {
  return items.map((r) => ({
    id: r.roomId ?? r.id ?? "",
    name: r.name,
  }));
}
