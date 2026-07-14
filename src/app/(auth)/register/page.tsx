"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

/**
 * หน้าสมัครสมาชิกสาธารณะ — ปิดชั่วคราว
 * ให้ admin สร้าง user จาก /admin/users แทน
 *
 * โค้ดเดิมเก็บไว้ที่ page.original.tsx (และ page.tsx.bak)
 * เมื่อต้องการเปิดใหม่: คัดลอกเนื้อหาจาก page.original.tsx มาทับไฟล์นี้
 * และเปิดลิงก์ register ใน login/page.tsx
 */
export default function RegisterPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/login");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
    </div>
  );
}
