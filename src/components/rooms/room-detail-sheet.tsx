"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/status-badge";
import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { formatCurrency, formatDate, getApiErrorMessage } from "@/lib/format";

interface RoomDetail {
  room: {
    roomId: string;
    name: string;
    floor: string | null;
    description: string | null;
    status: string;
    statusLabel?: string;
    roomType: { name: string; price: number } | null;
  };
  currentTenant: {
    fullName: string;
    phone: string;
    email: string;
    moveInDate?: string | null;
    depositAmount?: number | null;
  } | null;
  invoiceHistory: {
    invoiceId: string;
    invoiceNumber: string;
    status: string;
    issuedDate?: string | null;
    dueDate?: string | null;
    totalAmount: number;
  }[];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apartmentId: string;
  roomId: string | null;
}

export function RoomDetailSheet({
  open,
  onOpenChange,
  apartmentId,
  roomId,
}: Props) {
  const [data, setData] = useState<RoomDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !roomId) return;
    let active = true;
    setLoading(true);
    setData(null);
    api
      .get<RoomDetail>(endpoints.rooms.detail(apartmentId, roomId))
      .then((res) => {
        if (active) setData(res);
      })
      .catch((err) => {
        if (active) toast.error(getApiErrorMessage(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [open, roomId, apartmentId]);

  const room = data?.room;
  const tenant = data?.currentTenant;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{room?.name ?? "รายละเอียดห้อง"}</SheetTitle>
          <SheetDescription>
            {room?.roomType?.name ?? "ข้อมูลห้องพักและประวัติบิล"}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 px-6 pb-8">
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : (
            <>
              <section className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">สถานะ</span>
                  {room && <StatusBadge kind="room" value={room.status} />}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">ชั้น</span>
                  <span className="text-sm text-gray-900">
                    {room?.floor || "-"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">ค่าเช่า</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatCurrency(room?.roomType?.price ?? 0)}
                  </span>
                </div>
                {room?.description && (
                  <p className="text-sm text-gray-500">{room.description}</p>
                )}
              </section>

              <Separator />

              <section>
                <h3 className="mb-2 text-sm font-semibold text-gray-900">
                  ผู้เช่าปัจจุบัน
                </h3>
                {tenant ? (
                  <div className="space-y-1 rounded-lg bg-gray-50 p-3 text-sm">
                    <p className="font-medium text-gray-900">
                      {tenant.fullName}
                    </p>
                    <p className="text-gray-500">{tenant.phone}</p>
                    <p className="text-gray-500">{tenant.email}</p>
                    <p className="text-gray-500">
                      เข้าพัก: {formatDate(tenant.moveInDate)}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">ยังไม่มีผู้เช่า</p>
                )}
              </section>

              <Separator />

              <section>
                <h3 className="mb-2 text-sm font-semibold text-gray-900">
                  ประวัติใบแจ้งหนี้
                </h3>
                {data?.invoiceHistory?.length ? (
                  <ul className="space-y-2">
                    {data.invoiceHistory.map((inv) => (
                      <li
                        key={inv.invoiceId}
                        className="flex items-center justify-between rounded-lg border border-gray-200 p-3 text-sm"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            {inv.invoiceNumber}
                          </p>
                          <p className="text-xs text-gray-500">
                            ครบกำหนด {formatDate(inv.dueDate)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="font-medium text-gray-900">
                            {formatCurrency(inv.totalAmount)}
                          </span>
                          <StatusBadge kind="invoice" value={inv.status} />
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">ยังไม่มีประวัติบิล</p>
                )}
              </section>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
