"use client";

import { Pencil, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { useRoomDetail } from "@/hooks/useRooms";
import { formatCurrency, formatDate } from "@/lib/format";
import { useT } from "@/i18n";

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
  /** ราคาห้องจากหน้า list (รวม override ระดับห้อง) — detail API มีแค่ราคาประเภทห้อง */
  listPrice?: number;
  onEdit?: (roomId: string) => void;
  onAddTenant?: (roomId: string) => void;
}

export function RoomDetailSheet({
  open,
  onOpenChange,
  apartmentId,
  roomId,
  listPrice,
  onEdit,
  onAddTenant,
}: Props) {
  const t = useT();
  const { data, isLoading } = useRoomDetail(apartmentId, roomId, open);
  const detail = data as RoomDetail | undefined;

  const room = detail?.room;
  const tenant = detail?.currentTenant;
  const rentValue = listPrice ?? room?.roomType?.price ?? 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{room?.name ?? t("room-details")}</SheetTitle>
          <SheetDescription>
            {room?.roomType?.name ?? t("room-info-billing-history")}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 px-6 pb-8">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : (
            <>
              <section className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">{t("status")}</span>
                  {room && <StatusBadge kind="room" value={room.status} />}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">{t("floor")}</span>
                  <span className="text-sm text-gray-900">
                    {room?.floor || "-"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">{t("rent")}</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatCurrency(rentValue)}
                  </span>
                </div>
                {room?.description && (
                  <p className="text-sm text-gray-500">{room.description}</p>
                )}
              </section>

              {(onEdit || onAddTenant) && roomId && (
                <div className="flex flex-wrap gap-2">
                  {onEdit && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(roomId)}
                    >
                      <Pencil className="h-4 w-4" />
                      {t("edit")}
                    </Button>
                  )}
                  {onAddTenant && !tenant && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onAddTenant(roomId)}
                    >
                      <UserPlus className="h-4 w-4" />
                      {t("add-tenant")}
                    </Button>
                  )}
                </div>
              )}

              <Separator />

              <section>
                <h3 className="mb-2 text-sm font-semibold text-gray-900">
                  {t("current-tenant")}
                </h3>
                {tenant ? (
                  <div className="space-y-1 rounded-lg bg-gray-50 p-3 text-sm">
                    <p className="font-medium text-gray-900">
                      {tenant.fullName}
                    </p>
                    <p className="text-gray-500">{tenant.phone}</p>
                    <p className="text-gray-500">{tenant.email}</p>
                    <p className="text-gray-500">
                      {t("move-in")}: {formatDate(tenant.moveInDate)}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">{t("no-tenant")}</p>
                )}
              </section>

              <Separator />

              <section>
                <h3 className="mb-2 text-sm font-semibold text-gray-900">
                  {t("invoice-history")}
                </h3>
                {detail?.invoiceHistory?.length ? (
                  <ul className="space-y-2">
                    {detail.invoiceHistory.map((inv) => (
                      <li
                        key={inv.invoiceId}
                        className="flex items-center justify-between rounded-lg border border-gray-200 p-3 text-sm"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            {inv.invoiceNumber}
                          </p>
                          <p className="text-xs text-gray-500">
                            {t("due")} {formatDate(inv.dueDate)}
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
                  <p className="text-sm text-gray-500">
                    {t("no-billing-history")}
                  </p>
                )}
              </section>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
