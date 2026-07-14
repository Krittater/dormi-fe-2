"use client";

import { useCallback } from "react";

import { useAuthStore } from "@/stores/auth.store";
import { useApartmentIdFromPath } from "@/hooks/use-apartment-id";

/**
 * คืนฟังก์ชัน can(permission, apartmentId?) ที่ re-render เมื่อสิทธิ์เปลี่ยน
 * ถ้าไม่ระบุ apartmentId จะ default เป็นหอปัจจุบันจาก path
 */
export function useCan() {
  // subscribe slice ที่เกี่ยวข้องเพื่อให้ re-render เมื่อสิทธิ์เปลี่ยน
  const isSuperuser = useAuthStore((s) => s.isSuperuser);
  const permissions = useAuthStore((s) => s.permissions);
  const apartmentPermissions = useAuthStore((s) => s.apartmentPermissions);
  const currentApartmentId = useApartmentIdFromPath();

  return useCallback(
    (permission: string, apartmentId?: string | null) => {
      if (isSuperuser) return true;
      if (permissions.includes(permission)) return true;
      const aptId = apartmentId ?? currentApartmentId;
      if (aptId) {
        const scoped = apartmentPermissions[aptId];
        if (scoped?.includes(permission)) return true;
      }
      return false;
    },
    [isSuperuser, permissions, apartmentPermissions, currentApartmentId]
  );
}
