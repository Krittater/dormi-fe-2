"use client";

import { RefreshCw, WifiOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n";

interface ErrorStateProps {
  /** error object จาก react-query — ใช้ดึงข้อความจริงจาก ApiError */
  error?: unknown;
  /** เรียก refetch ของ query ที่พัง */
  onRetry?: () => void;
  className?: string;
}

/**
 * สถานะ "โหลดไม่สำเร็จ" — ต้องใช้แทน EmptyState เสมอเมื่อ query.isError
 * ไม่งั้นตอน server ล่ม หน้าจะแสดงเหมือนข้อมูลว่างและชี้นำผู้ใช้ผิดทาง
 */
export function ErrorState({ error, onRetry, className }: ErrorStateProps) {
  const t = useT();
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-destructive/30 bg-destructive/5 px-6 py-12 text-center",
        className
      )}
    >
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <WifiOff className="h-6 w-6" />
      </div>
      <h3 className="text-base font-medium text-gray-900">
        {t("load-failed-title")}
      </h3>
      <p className="mt-1 max-w-sm text-sm text-gray-500">
        {error ? getApiErrorMessage(error) : t("network-error")}
      </p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          <RefreshCw className="h-4 w-4" />
          {t("retry")}
        </Button>
      )}
    </div>
  );
}
