"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

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
import { ReadingDialog } from "@/components/meters/reading-dialog";
import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { toList } from "@/lib/list";
import { formatDate, formatNumber, getApiErrorMessage } from "@/lib/format";
import { useT } from "@/i18n";
import { MeterReadingStatus } from "@/types";
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
  const [readings, setReadings] = useState<MeterReading[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [active, setActive] = useState<MeterReading | null>(null);
  const [mode, setMode] = useState<"record" | "edit">("record");

  const load = useCallback(async () => {
    if (!meter) return;
    setLoading(true);
    try {
      const res = await api.get(
        endpoints.meters.readings(apartmentId, meter.id)
      );
      setReadings(
        toList<MeterReading>(res).items.map((r) => ({
          ...r,
          meterId: r.meterId ?? meter.id,
          roomName: r.roomName ?? meter.roomName ?? undefined,
          meterType: r.meterType ?? meter.type,
        }))
      );
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [apartmentId, meter]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const openRecord = (reading: MeterReading) => {
    setActive(reading);
    setMode(
      reading.readingStatus === MeterReadingStatus.NOT_RECORDED
        ? "record"
        : "edit"
    );
    setDialogOpen(true);
  };

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
            {meter?.type} {meter?.meterNumber ? `· ${meter.meterNumber}` : ""}
          </SheetDescription>
        </SheetHeader>

        <div className="px-6 pb-8">
          {loading ? (
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
          onDone={load}
        />
      </SheetContent>
    </Sheet>
  );
}
