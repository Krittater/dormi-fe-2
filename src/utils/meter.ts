import { MeterType } from "@/types";
import type { Meter, MeterReading } from "@/types";

interface RawMeter {
  id?: string;
  meterId?: string;
  apartmentId: string;
  roomId: string;
  type: string;
  meterNumber: string;
  roomName?: string | null;
  status?: string;
  room?: { id?: string; name?: string; floor?: string | null } | null;
  floor?: string | null;
  isActive?: boolean;
  createdAt?: string;
}

export type DisplayMeter = Meter & { floor?: string | null };

export function normalizeMeter(raw: RawMeter): DisplayMeter {
  return {
    id: raw.id ?? raw.meterId ?? "",
    apartmentId: raw.apartmentId,
    roomId: raw.roomId,
    roomName: raw.room?.name ?? raw.roomName ?? null,
    type: raw.type as MeterType,
    meterNumber: raw.meterNumber,
    status: raw.status,
    isActive: raw.isActive ?? true,
    createdAt: raw.createdAt,
    floor: raw.room?.floor ?? raw.floor ?? null,
  };
}

export function normalizeMeters(raw: RawMeter[]): DisplayMeter[] {
  return raw.map(normalizeMeter);
}

export function countMetersByType(meters: DisplayMeter[], type: MeterType): number {
  return meters.filter((m) => m.type === type).length;
}

export interface PeriodOption {
  id: string;
  name: string;
}

export function normalizePeriodOptions(
  items: Array<{ id: string; periodYear?: number; periodMonth?: number; name?: string }>
): PeriodOption[] {
  return items.map((p) => ({
    id: p.id,
    name: p.name ?? `${p.periodMonth}/${p.periodYear}`,
  }));
}

export type { RawMeter, MeterReading };
