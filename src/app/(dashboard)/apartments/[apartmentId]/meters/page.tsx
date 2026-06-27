"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { MeterReadingsSheet } from "@/components/meters/meter-readings-sheet";
import { ReadingDialog } from "@/components/meters/reading-dialog";
import { api, buildQuery } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { toList } from "@/lib/list";
import { formatNumber, getApiErrorMessage } from "@/lib/format";
import { useT } from "@/i18n";
import { MeterReadingStatus } from "@/types";
import type { Meter, MeterReading } from "@/types";

interface BillingPeriodOption {
  id: string;
  name: string;
}

export default function MetersPage() {
  const t = useT();
  const { apartmentId } = useParams<{ apartmentId: string }>();

  const [meters, setMeters] = useState<Meter[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeMeter, setActiveMeter] = useState<Meter | null>(null);

  const [periods, setPeriods] = useState<BillingPeriodOption[]>([]);
  const [periodId, setPeriodId] = useState<string>("");
  const [periodReadings, setPeriodReadings] = useState<MeterReading[]>([]);
  const [readingsLoading, setReadingsLoading] = useState(false);
  const [readingDialogOpen, setReadingDialogOpen] = useState(false);
  const [activeReading, setActiveReading] = useState<MeterReading | null>(null);
  const [readingMode, setReadingMode] = useState<"record" | "edit">("record");

  const loadMeters = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(endpoints.meters.list(apartmentId));
      setMeters(toList<Meter>(res).items);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [apartmentId]);

  useEffect(() => {
    loadMeters();
  }, [loadMeters]);

  useEffect(() => {
    api
      .get(endpoints.billingPeriods.dropdown(apartmentId))
      .then((res) => {
        const list = toList<{ id?: string; billingPeriodId?: string; name?: string; label?: string }>(
          res
        ).items;
        const opts = list.map((p) => ({
          id: p.id ?? p.billingPeriodId ?? "",
          name: p.name ?? p.label ?? "",
        }));
        setPeriods(opts);
        if (opts[0]) setPeriodId(opts[0].id);
      })
      .catch(() => undefined);
  }, [apartmentId]);

  const loadPeriodReadings = useCallback(async () => {
    if (!periodId) return;
    setReadingsLoading(true);
    try {
      const res = await api.get(
        endpoints.meters.byBillingPeriod(apartmentId) +
          buildQuery({ billingPeriodId: periodId })
      );
      setPeriodReadings(toList<MeterReading>(res).items);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setReadingsLoading(false);
    }
  }, [apartmentId, periodId]);

  useEffect(() => {
    loadPeriodReadings();
  }, [loadPeriodReadings]);

  const openMeter = (meter: Meter) => {
    setActiveMeter(meter);
    setSheetOpen(true);
  };

  const openReading = (reading: MeterReading) => {
    setActiveReading(reading);
    setReadingMode(
      reading.readingStatus === MeterReadingStatus.NOT_RECORDED
        ? "record"
        : "edit"
    );
    setReadingDialogOpen(true);
  };

  const meterColumns: Column<Meter>[] = [
    {
      key: "room",
      header: t("room"),
      cell: (m) => (
        <span className="font-medium text-gray-900">{m.roomName ?? "-"}</span>
      ),
    },
    { key: "type", header: t("type"), cell: (m) => m.type },
    {
      key: "number",
      header: t("meter-number"),
      cell: (m) => m.meterNumber || "-",
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      hideOnMobile: true,
      cell: (m) => (
        <Button variant="outline" size="sm" onClick={() => openMeter(m)}>
          {t("view-meter-readings")}
        </Button>
      ),
    },
  ];

  const readingColumns: Column<MeterReading>[] = [
    {
      key: "room",
      header: t("room"),
      cell: (r) => (
        <span className="font-medium text-gray-900">{r.roomName ?? "-"}</span>
      ),
    },
    { key: "type", header: t("type"), cell: (r) => r.meterType ?? "-" },
    {
      key: "previous",
      header: t("previous"),
      cell: (r) => formatNumber(r.previousValue ?? 0),
    },
    {
      key: "current",
      header: t("current"),
      cell: (r) => formatNumber(r.currentValue ?? 0),
    },
    {
      key: "units",
      header: t("units-used"),
      cell: (r) => formatNumber(r.unitsUsed ?? 0),
    },
    {
      key: "status",
      header: t("status"),
      cell: (r) => <StatusBadge kind="reading" value={r.readingStatus} />,
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      hideOnMobile: true,
      cell: (r) =>
        r.readingStatus !== MeterReadingStatus.BILLED ? (
          <Button variant="outline" size="sm" onClick={() => openReading(r)}>
            {r.readingStatus === MeterReadingStatus.NOT_RECORDED
              ? t("save")
              : t("edit")}
          </Button>
        ) : null,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("nav-meters")}
        description={t("meters-page-description")}
      />

      <Tabs defaultValue="meters">
        <TabsList>
          <TabsTrigger value="meters">{t("meter-list")}</TabsTrigger>
          <TabsTrigger value="by-period">{t("record-by-period")}</TabsTrigger>
        </TabsList>

        <TabsContent value="meters" className="mt-4">
          <DataTable
            columns={meterColumns}
            data={meters}
            loading={loading}
            getRowId={(m) => m.id}
            onRowClick={openMeter}
            emptyTitle={t("no-meters")}
            emptyDescription={t("no-meters-description")}
          />
        </TabsContent>

        <TabsContent value="by-period" className="mt-4 space-y-4">
          {periods.length === 0 ? (
            <EmptyState
              title={t("no-billing-periods")}
              description={t("no-billing-periods-description")}
            />
          ) : (
            <>
              <div className="max-w-xs">
                <Select value={periodId} onValueChange={setPeriodId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("select-billing-period")} />
                  </SelectTrigger>
                  <SelectContent>
                    {periods.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DataTable
                columns={readingColumns}
                data={periodReadings}
                loading={readingsLoading}
                getRowId={(r) => r.id}
                emptyTitle={t("no-readings")}
                emptyDescription={t("no-readings-description")}
              />
            </>
          )}
        </TabsContent>
      </Tabs>

      <MeterReadingsSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        apartmentId={apartmentId}
        meter={activeMeter}
      />

      <ReadingDialog
        open={readingDialogOpen}
        onOpenChange={setReadingDialogOpen}
        apartmentId={apartmentId}
        reading={activeReading}
        mode={readingMode}
        onDone={loadPeriodReadings}
      />
    </div>
  );
}
