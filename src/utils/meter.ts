import { MeterType } from "@/types";
import type { Meter, MeterReading, MeterReadingStatus } from "@/types";

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

/** Maps API/billing-period type strings to MeterType (handles "WATER" vs "water"). */
export function normalizeMeterType(
  value: string | null | undefined
): MeterType | null {
  if (!value) return null;
  const lower = value.toLowerCase();
  if (lower === MeterType.ELECTRICITY) return MeterType.ELECTRICITY;
  if (lower === MeterType.WATER) return MeterType.WATER;
  return null;
}

export function normalizeMeter(raw: RawMeter): DisplayMeter {
  return {
    id: raw.id ?? raw.meterId ?? "",
    apartmentId: raw.apartmentId,
    roomId: raw.roomId,
    roomName: raw.room?.name ?? raw.roomName ?? null,
    type: normalizeMeterType(raw.type) ?? (raw.type as MeterType),
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

interface RawMeterReading {
  id?: string;
  meterReadingId?: string;
  meterId?: string;
  billingPeriodId?: string | null;
  billingPeriodName?: string | null;
  billingPeriodType?: string | null;
  room?: { roomId?: string; name?: string | null } | null;
  roomName?: string | null;
  /** ชนิดมิเตอร์ของแถว — electricity | water (จาก meters.type) */
  type?: string | null;
  previousValue: number | null;
  currentValue: number | null;
  unitsUsed: number | null;
  readingStatus: MeterReadingStatus;
  recordedAt?: string | null;
  meterType?: string | null;
}

export interface BillingPeriodReadingsResponse {
  billingPeriodName?: string | null;
  billingPeriodType?: string | null;
  data: RawMeterReading[];
}

export function normalizeMeterReading(
  raw: RawMeterReading,
  context?: { billingPeriodName?: string | null; billingPeriodType?: string | null }
): MeterReading {
  return {
    id: raw.id ?? raw.meterReadingId ?? "",
    meterId: raw.meterId ?? raw.room?.roomId ?? "",
    billingPeriodId: raw.billingPeriodId ?? null,
    billingPeriodName: raw.billingPeriodName ?? context?.billingPeriodName ?? null,
    billingPeriodType: raw.billingPeriodType ?? context?.billingPeriodType ?? null,
    previousValue: raw.previousValue ?? null,
    currentValue: raw.currentValue ?? null,
    unitsUsed: raw.unitsUsed ?? null,
    readingStatus: raw.readingStatus,
    recordedAt: raw.recordedAt ?? null,
    roomName: raw.room?.name ?? raw.roomName ?? null,
    meterType:
      normalizeMeterType(
        raw.type ?? raw.meterType ?? context?.billingPeriodType
      ) ?? null,
  };
}

export function normalizeMeterReadings(
  res: BillingPeriodReadingsResponse | RawMeterReading[]
): MeterReading[] {
  if (Array.isArray(res)) return res.map((r) => normalizeMeterReading(r));
  const context = {
    billingPeriodName: res.billingPeriodName,
    billingPeriodType: res.billingPeriodType,
  };
  return (res.data ?? []).map((r) => normalizeMeterReading(r, context));
}

export interface PeriodOption {
  key: string;
  name: string;
}

export function normalizePeriodOptions(
  items: Array<{
    key: string;
    periodYear?: number;
    periodMonth?: number;
    name?: string;
  }>
): PeriodOption[] {
  return items.map((p) => ({
    key: p.key,
    name: p.name ?? `${p.periodMonth}/${p.periodYear}`,
  }));
}

export function resolveMeterPeriodId(
  group: { electricityPeriodId?: string; waterPeriodId?: string } | undefined,
  pageType: MeterType
): string {
  if (!group) return "";
  return pageType === MeterType.WATER
    ? group.waterPeriodId ?? ""
    : group.electricityPeriodId ?? "";
}

export type { RawMeter, MeterReading };
