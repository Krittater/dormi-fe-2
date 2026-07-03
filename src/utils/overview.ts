import type { RoomOverview } from "@/types";

export interface RoomOverviewCounts {
  total: number;
  available: number;
  rented: number;
  overdue: number;
  booked: number;
}

const numberOr = (v: unknown) => (typeof v === "number" ? v : 0);

export function normalizeRoomOverviewCounts(
  overview: RoomOverview | undefined | null,
): RoomOverviewCounts {
  const summary = overview?.summary;
  return {
    total: numberOr(summary?.totalRooms),
    available: numberOr(summary?.availableRooms),
    rented: numberOr(summary?.rentedRooms),
    overdue: numberOr(summary?.overdueRooms),
    booked: numberOr(summary?.bookedRooms),
  };
}

export function overviewRooms(overview: RoomOverview | undefined | null) {
  return overview?.rooms ?? [];
}

export function overviewAlerts(overview: RoomOverview | undefined | null) {
  return overview?.alerts ?? [];
}
