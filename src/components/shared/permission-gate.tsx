"use client";

import type { ReactNode } from "react";

import { useCan } from "@/hooks/use-can";

interface PermissionGateProps {
  /** ต้องมีสิทธิ์นี้จึงจะแสดง children */
  permission: string;
  /** ระบุหอ; เว้นว่าง = ใช้หอปัจจุบันจาก path */
  apartmentId?: string | null;
  /** แสดงเมื่อไม่มีสิทธิ์ (default: ไม่แสดงอะไร) */
  fallback?: ReactNode;
  children: ReactNode;
}

/** ซ่อน/แสดง UI (ปุ่ม create/edit/delete ฯลฯ) ตามสิทธิ์ผู้ใช้ */
export function PermissionGate({
  permission,
  apartmentId,
  fallback = null,
  children,
}: PermissionGateProps) {
  const can = useCan();
  return <>{can(permission, apartmentId) ? children : fallback}</>;
}
