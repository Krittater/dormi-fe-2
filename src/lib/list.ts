import type { PaginationMeta } from "@/types";

/**
 * Normalizes various backend list shapes into a consistent
 * `{ items, meta }` structure. Handles plain arrays, `{ data, meta }`,
 * and `{ items, meta }` responses.
 */
export function toList<T>(res: unknown): { items: T[]; meta?: PaginationMeta } {
  if (Array.isArray(res)) {
    return { items: res as T[] };
  }
  if (res && typeof res === "object") {
    const o = res as Record<string, unknown>;
    if (Array.isArray(o.data)) {
      return { items: o.data as T[], meta: o.meta as PaginationMeta };
    }
    if (Array.isArray(o.items)) {
      return { items: o.items as T[], meta: o.meta as PaginationMeta };
    }
  }
  return { items: [] };
}

export function totalPagesOf(
  meta: PaginationMeta | undefined,
  fallbackCount: number,
  limit: number
): number {
  if (meta?.totalPages) return meta.totalPages;
  if (meta?.total != null) return Math.max(1, Math.ceil(meta.total / limit));
  return Math.max(1, Math.ceil(fallbackCount / limit));
}
