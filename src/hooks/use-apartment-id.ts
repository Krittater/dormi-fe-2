"use client";

import { useParams, usePathname } from "next/navigation";

const PLACEHOLDER = "_";

/** Browser URL (rewrite คง path จริงไว้) — ไม่ใช้ usePathname อย่างเดียวเพราะ static export อาจเห็น "_" */
function resolvedPathname(pathname: string): string {
  if (typeof window !== "undefined") return window.location.pathname;
  return pathname;
}

function segment(path: string, pattern: RegExp): string | undefined {
  const id = path.match(pattern)?.[1];
  return id && id !== PLACEHOLDER ? id : undefined;
}

function pick(pathSeg: string | undefined, param?: string): string {
  if (pathSeg) return pathSeg;
  if (param && param !== PLACEHOLDER) return param;
  return "";
}

/** apartment id จาก URL จริง (รองรับ static export + host rewrite) */
export function useApartmentIdFromPath(): string | null {
  const pathname = usePathname();
  const path = resolvedPathname(pathname);
  return segment(path, /^\/apartments\/([^/]+)/) ?? null;
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
  const path = resolvedPathname(pathname);

  return {
    apartmentId: pick(
      segment(path, /^\/apartments\/([^/]+)/),
      params.apartmentId
    ),
    invoiceId: pick(
      segment(path, /\/invoices\/([^/]+)/),
      params.invoiceId
    ),
    billingPeriodId: pick(
      segment(path, /\/billing-periods\/([^/]+)/),
      params.billingPeriodId
    ),
  };
}
