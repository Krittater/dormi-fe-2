import { ChargeTypeCategory } from "@/types";
import type { ChargeType } from "@/types";

export interface RawChargeType {
  id: string;
  apartmentId: string;
  name: string;
  description?: string | null;
  category?: string | null;
  defaultAmount?: number | string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
  deletedBy?: string | null;
  deletedAt?: string | null;
}

function parseDecimal(value: number | string | null | undefined): number | null {
  if (value == null || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function parseCategory(value: string | null | undefined): ChargeTypeCategory {
  if (
    value &&
    Object.values(ChargeTypeCategory).includes(value as ChargeTypeCategory)
  ) {
    return value as ChargeTypeCategory;
  }
  return ChargeTypeCategory.OTHER;
}

export function normalizeChargeType(raw: RawChargeType): ChargeType {
  return {
    id: raw.id,
    apartmentId: raw.apartmentId,
    name: raw.name,
    description: raw.description ?? null,
    category: parseCategory(raw.category),
    defaultAmount: parseDecimal(raw.defaultAmount),
    isActive: raw.isActive,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    createdBy: raw.createdBy,
    updatedBy: raw.updatedBy,
    deletedBy: raw.deletedBy ?? null,
    deletedAt: raw.deletedAt ?? null,
  };
}

export function normalizeChargeTypes(raw: RawChargeType[]): ChargeType[] {
  return raw.map(normalizeChargeType);
}
