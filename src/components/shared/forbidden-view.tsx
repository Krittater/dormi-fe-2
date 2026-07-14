"use client";

import { ShieldAlert } from "lucide-react";

import { useT } from "@/i18n";

/** หน้าจอแจ้งเมื่อผู้ใช้ไม่มีสิทธิ์เข้าถึงหน้านั้น (แทนการเด้งออกจากระบบ) */
export function ForbiddenView() {
  const t = useT();
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
        <ShieldAlert className="h-7 w-7" />
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-gray-900">
          {t("forbidden-title")}
        </h2>
        <p className="max-w-md text-sm text-gray-500">{t("forbidden-desc")}</p>
      </div>
    </div>
  );
}
