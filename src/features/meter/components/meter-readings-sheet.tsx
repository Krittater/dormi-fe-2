"use client";

import { useCallback, useMemo, useState } from "react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ReadingDialog } from "@/features/meter/components/reading-dialog";
import { useMeterReadings } from "@/hooks/useMeters";
import { formatDate, formatNumber } from "@/lib/format";
import { useT } from "@/i18n";
import { MeterReadingStatus, METER_TYPE_CODES, MeterType } from "@/types";
import type { Meter, MeterReading } from "@/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apartmentId: string;
  meter: Meter | null;
}

export function MeterReadingsSheet({
  open,
  onOpenChange,
  apartmentId,
  meter,
}: Props) {
  const t = useT();
  const meterId = open && meter ? meter.id : "";
  const { data: rawReadings = [], isLoading } = useMeterReadings(
    apartmentId,
    meterId
  );

  const readings = useMemo(() => {
    if (!meter) return [];
    return rawReadings.map((r) => ({
      ...r,
      meterId: r.meterId ?? meter.id,
      roomName: r.roomName ?? meter.roomName ?? undefined,
      meterType: r.meterType ?? meter.type,
    }));
  }, [rawReadings, meter]);

  const meterTypeKey = meter
    ? METER_TYPE_CODES[meter.type.toLowerCase() as MeterType]
    : undefined;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [active, setActive] = useState<MeterReading | null>(null);
  const [mode, setMode] = useState<"record" | "edit">("record");

  const openRecord = useCallback((reading: MeterReading) => {
    setActive(reading);
    setMode(
      reading.readingStatus === MeterReadingStatus.NOT_RECORDED
        ? "record"
        : "edit"
    );
    setDialogOpen(true);
  }, []);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>
            {t("nav-meters")}{" "}
            {meter?.roomName
              ? t("room-with-name", { name: meter.roomName })
              : ""}
          </SheetTitle>
          <SheetDescription>
            {meterTypeKey ? t(meterTypeKey) : ""}
            {meter?.meterNumber ? ` · ${meter.meterNumber}` : ""}
          </SheetDescription>
        </SheetHeader>

        <div className="px-6 pb-8">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : readings.length === 0 ? (
            <EmptyState
              title={t("no-meter-readings")}
              description={t("no-meter-readings-description")}
            />
          ) : (
            <ul className="space-y-2">
              {readings.map((r) => (
                <li
                  key={r.id}
                  className="rounded-lg border border-gray-200 p-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {r.billingPeriodName ?? formatDate(r.recordedAt)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {t("previous")}: {formatNumber(r.previousValue ?? 0)} ·{" "}
                        {t("current")}: {formatNumber(r.currentValue ?? 0)} ·{" "}
                        {t("used")}: {formatNumber(r.unitsUsed ?? 0)}
                      </p>
                    </div>
                    <StatusBadge kind="reading" value={r.readingStatus} />
                  </div>
                  {r.readingStatus !== MeterReadingStatus.BILLED && (
                    <div className="mt-2 flex justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openRecord(r)}
                      >
                        {r.readingStatus === MeterReadingStatus.NOT_RECORDED
                          ? t("record-value")
                          : t("edit")}
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <ReadingDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          apartmentId={apartmentId}
          reading={active}
          mode={mode}
        />
      </SheetContent>
    </Sheet>
  );
}
