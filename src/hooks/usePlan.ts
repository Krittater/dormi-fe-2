"use client";

import { useQuery } from "@tanstack/react-query";

import { planQueries } from "@/queries/plan.query";

/**
 * แผน + โควตาของบัญชีปัจจุบัน (UX เท่านั้น — backend บังคับจริง)
 *
 * - hasFeature(code): เมนู/ปุ่มควรโชว์ไหม — คืน true เมื่อยังไม่บังคับตามแผน
 *   (features = null) หรือระหว่างโหลด เพื่อไม่ให้เมนูกระพริบ/หายโดยไม่จำเป็น
 * - roomQuotaFull: เต็มเพดานห้องของแผนแล้ว (limit null = ไม่จำกัด → ไม่มีวันเต็ม)
 */
export function usePlan() {
  const query = useQuery(planQueries.me());
  const data = query.data;

  const features = data?.features ?? null;
  const hasFeature = (code: string): boolean =>
    features === null ? true : features.includes(code);

  const roomLimit = data?.limits?.room_limit ?? null;
  const roomsUsed = data?.usage?.rooms ?? 0;
  const roomQuotaFull = roomLimit !== null && roomsUsed >= roomLimit;

  return {
    ...query,
    plan: data?.plan ?? null,
    source: data?.source,
    features,
    hasFeature,
    roomLimit,
    roomsUsed,
    roomQuotaFull,
  };
}
