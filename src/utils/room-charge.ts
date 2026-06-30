import { toList } from "@/lib/list";

function parseDecimal(value: number | string | null | undefined): number {
  if (value == null || value === "") return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function parseNullableDecimal(
  value: number | string | null | undefined
): number | null {
  if (value == null || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export interface RawSetupCharge {
  id: string;
  amount?: number | string;
  unit?: number | string | null;
  chargeCategory?: string | null;
  chargeTypeId?: string;
  chargeTypeName?: string;
  description?: string | null;
  chargeType?: {
    id?: string;
    name?: string;
    category?: string | null;
  } | null;
}

export interface RawSetupRoom {
  id?: string;
  roomId?: string;
  name: string;
  isCalWater?: boolean;
  isCalElectric?: boolean;
  waterRatePerUnit?: number | string;
  electricityRatePerUnit?: number | string;
  charges?: RawSetupCharge[];
}

export interface RawSetupRow {
  room: RawSetupRoom;
}

export interface SetupCharge {
  id: string;
  chargeTypeId: string;
  chargeTypeName?: string;
  amount: number;
  unit?: number | null;
  description?: string | null;
}

export interface SetupRow {
  room: {
    id: string;
    name: string;
    isCalWater: boolean;
    isCalElectric: boolean;
    waterRatePerUnit: number;
    electricityRatePerUnit: number;
    charges: SetupCharge[];
  };
}

function normalizeSetupCharge(raw: RawSetupCharge): SetupCharge {
  return {
    id: raw.id,
    chargeTypeId: raw.chargeTypeId ?? raw.chargeType?.id ?? "",
    chargeTypeName: raw.chargeTypeName ?? raw.chargeType?.name,
    amount: parseDecimal(raw.amount),
    unit: parseNullableDecimal(raw.unit),
    description: raw.description ?? null,
  };
}

function normalizeSetupRow(raw: RawSetupRow): SetupRow {
  const room = raw.room;
  return {
    room: {
      id: room.id ?? room.roomId ?? "",
      name: room.name,
      isCalWater: room.isCalWater ?? false,
      isCalElectric: room.isCalElectric ?? false,
      waterRatePerUnit: parseDecimal(room.waterRatePerUnit),
      electricityRatePerUnit: parseDecimal(room.electricityRatePerUnit),
      charges: (room.charges ?? []).map(normalizeSetupCharge),
    },
  };
}

export function normalizeSetupRows(res: unknown): SetupRow[] {
  return toList<RawSetupRow>(res).items.map(normalizeSetupRow);
}
