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

/** ราคาห้องที่ใช้จริง — ราคาเฉพาะห้อง (override) ก่อน แล้วค่อย fallback ราคาประเภทห้อง */
export function roomPrice(room: Room): number | undefined {
  if (typeof room.price === "number" && !Number.isNaN(room.price)) {
    return room.price;
  }
  const typePrice = room.roomType?.price;
  if (typePrice == null) return undefined;
  const n = typeof typePrice === "number" ? typePrice : Number(typePrice);
  return Number.isNaN(n) ? undefined : n;
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
