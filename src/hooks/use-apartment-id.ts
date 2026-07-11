"use client";

import { useParams, usePathname } from "next/navigation";

// เผื่อ path placeholder "_" จากยุค static export — ไม่ถือเป็น id จริง
const PLACEHOLDER = "_";

function segment(path: string, pattern: RegExp): string | undefined {
  const id = path.match(pattern)?.[1];
  return id && id !== PLACEHOLDER ? id : undefined;
}

function pick(pathSeg: string | undefined, param?: string): string {
  if (pathSeg) return pathSeg;
  if (param && param !== PLACEHOLDER) return param;
  return "";
}

/**
 * apartment id จาก usePathname (reactive ต่อ navigation)
 * ห้ามอ่าน window.location ตอน render — ค่าไม่ sync กับ React transition
 * ทำให้ uuid หลุดจาก state ชั่วขณะระหว่าง navigate
 */
export function useApartmentIdFromPath(): string | null {
  const pathname = usePathname();
  return segment(pathname, /^\/apartments\/([^/]+)/) ?? null;
}

export function useApartmentId(): string {
  return useApartmentIdFromPath() ?? "";
}

export function useApartmentRouteParams(): {
  apartmentId: string;
  invoiceId: string;
  billingPeriodId: string;
} {
  const params = useParams<{
    apartmentId?: string;
    invoiceId?: string;
    billingPeriodId?: string;
  }>();
  const pathname = usePathname();

  return {
    apartmentId: pick(
      segment(pathname, /^\/apartments\/([^/]+)/),
      params.apartmentId
    ),
    invoiceId: pick(
      segment(pathname, /\/invoices\/([^/]+)/),
      params.invoiceId
    ),
    billingPeriodId: pick(
      segment(pathname, /\/billing-periods\/([^/]+)/),
      params.billingPeriodId
    ),
  };
}
