"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Droplets,
  Home,
  MoreVertical,
  Plus,
  Search,
  Trash2,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { MeterReadingsSheet } from "@/features/meter/components/meter-readings-sheet";
import { MeterFormDialog } from "@/features/meter/components/meter-form-dialog";
import { ReadingDialog } from "@/features/meter/components/reading-dialog";
import { DEFAULT_PAGE_SIZE, PER_PAGE_OPTIONS } from "@/constants/config";
import {
  useMeterActions,
  useMeterPeriodDropdown,
  useMeterReadingsByPeriod,
  useMeters,
} from "@/hooks/useMeters";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useT, type TranslateFn } from "@/i18n";
import { MeterReadingStatus, MeterType } from "@/types";
import type { Meter, MeterReading } from "@/types";
import {
  countMetersByType,
  normalizePeriodOptions,
  type DisplayMeter,
} from "@/utils/meter";

type TopTab = "meters" | "by-period";

const TYPE_META = {
  [MeterType.ELECTRICITY]: {
    Icon: Zap,
    labelKey: "meter-type-electricity",
    iconWrap: "bg-primary-tint text-primary",
    progressBar: "bg-[#FEF3C7]",
    progressFill: "bg-[#B45309]",
    progressText: "text-[#B45309]",
    activeBorder: "border-primary",
  },
  [MeterType.WATER]: {
    Icon: Droplets,
    labelKey: "meter-type-water",
    iconWrap: "bg-[#EFF6FF] text-[#2563EB]",
    progressBar: "bg-[#DBEAFE]",
    progressFill: "bg-[#1D4ED8]",
    progressText: "text-[#1D4ED8]",
    activeBorder: "border-[#2563EB]",
  },
} as const;

export function MetersPage() {
  const t = useT();
  const { apartmentId } = useParams<{ apartmentId: string }>();

  const { data: meters = [], isLoading } = useMeters(apartmentId);
  const { data: periodItems = [] } = useMeterPeriodDropdown(apartmentId);
  const { remove } = useMeterActions(apartmentId);

  const periods = useMemo(
    () => normalizePeriodOptions(periodItems),
    [periodItems]
  );

  const [topTab, setTopTab] = useState<TopTab>("meters");
  const [pageType, setPageType] = useState<MeterType>(MeterType.ELECTRICITY);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PAGE_SIZE);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeMeter, setActiveMeter] = useState<Meter | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<DisplayMeter | null>(null);

  const [periodId, setPeriodId] = useState("");
  const [readingDialogOpen, setReadingDialogOpen] = useState(false);
  const [activeReading, setActiveReading] = useState<MeterReading | null>(null);
  const [readingMode, setReadingMode] = useState<"record" | "edit">("record");
  const [readingsSearch, setReadingsSearch] = useState("");
  const [readingsPage, setReadingsPage] = useState(1);
  const [readingsPerPage, setReadingsPerPage] = useState(DEFAULT_PAGE_SIZE);

  useEffect(() => {
    if (!periodId && periods[0]) setPeriodId(periods[0].id);
  }, [periods, periodId]);

  const changePeriodId = useCallback((value: string) => {
    setPeriodId(value);
    setReadingsPage(1);
  }, []);

  const changePageType = useCallback((value: MeterType) => {
    setPageType(value);
    setPage(1);
    setReadingsPage(1);
  }, []);

  const { data: periodReadings = [], isLoading: readingsLoading } =
    useMeterReadingsByPeriod(apartmentId, periodId);

  // Readings for the selected meter type only — the whole page is scoped to one type.
  const typeReadings = useMemo(
    () => periodReadings.filter((r) => r.meterType === pageType),
    [periodReadings, pageType]
  );

  const recordedCount = useMemo(
    () =>
      typeReadings.filter(
        (r) => r.readingStatus !== MeterReadingStatus.NOT_RECORDED
      ).length,
    [typeReadings]
  );

  const filteredReadings = useMemo(() => {
    const q = readingsSearch.trim().toLowerCase();
    if (!q) return typeReadings;
    return typeReadings.filter((r) =>
      (r.roomName ?? "").toLowerCase().includes(q)
    );
  }, [typeReadings, readingsSearch]);

  const readingsTotal = filteredReadings.length;
  const readingsTotalPages = Math.max(
    1,
    Math.ceil(readingsTotal / readingsPerPage)
  );
  const readingsSafePage = Math.min(readingsPage, readingsTotalPages);
  const readingsStartIndex = (readingsSafePage - 1) * readingsPerPage;
  const pageReadings = filteredReadings.slice(
    readingsStartIndex,
    readingsStartIndex + readingsPerPage
  );
  const readingsFrom = readingsTotal === 0 ? 0 : readingsStartIndex + 1;
  const readingsTo = Math.min(
    readingsStartIndex + readingsPerPage,
    readingsTotal
  );

  const changeReadingsSearch = useCallback((value: string) => {
    setReadingsSearch(value);
    setReadingsPage(1);
  }, []);

  const changeReadingsPerPage = useCallback((value: number) => {
    setReadingsPerPage(value);
    setReadingsPage(1);
  }, []);

  const electricityCount = useMemo(
    () => countMetersByType(meters, MeterType.ELECTRICITY),
    [meters]
  );
  const waterCount = useMemo(
    () => countMetersByType(meters, MeterType.WATER),
    [meters]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return meters.filter((m) => {
      if (m.type !== pageType) return false;
      if (!q) return true;
      return (
        (m.roomName ?? "").toLowerCase().includes(q) ||
        (m.meterNumber ?? "").toLowerCase().includes(q)
      );
    });
  }, [meters, pageType, search]);

  const changeSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const changePerPage = useCallback((value: number) => {
    setPerPage(value);
    setPage(1);
  }, []);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * perPage;
  const pageItems = filtered.slice(startIndex, startIndex + perPage);
  const from = total === 0 ? 0 : startIndex + 1;
  const to = Math.min(startIndex + perPage, total);

  const openMeter = useCallback((meter: Meter) => {
    setActiveMeter(meter);
    setSheetOpen(true);
  }, []);

  const handleSheetOpenChange = useCallback((open: boolean) => {
    setSheetOpen(open);
    if (!open) setActiveMeter(null);
  }, []);

  const openReading = useCallback((reading: MeterReading) => {
    setActiveReading(reading);
    setReadingMode(
      reading.readingStatus === MeterReadingStatus.NOT_RECORDED
        ? "record"
        : "edit"
    );
    setReadingDialogOpen(true);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!deleting) return;
    await remove.mutateAsync(deleting.id);
    setDeleting(null);
  }, [deleting, remove]);

  const readingColumns = useMemo<Column<MeterReading>[]>(
    () => [
      {
        key: "room",
        header: t("room"),
        cell: (r) => (
          <span className="font-medium text-gray-900">{r.roomName ?? "-"}</span>
        ),
      },
      {
        key: "previous",
        header: t("previous"),
        className: "text-right",
        cell: (r) => formatNumber(r.previousValue ?? 0),
      },
      {
        key: "current",
        header: t("current"),
        className: "text-right",
        cell: (r) =>
          r.currentValue != null ? (
            formatNumber(r.currentValue)
          ) : (
            <span className="text-gray-400">—</span>
          ),
      },
      {
        key: "units",
        header: t("units-used"),
        className: "text-right",
        cell: (r) =>
          r.unitsUsed != null ? (
            <span className="font-medium text-gray-900">
              {formatNumber(r.unitsUsed)}
            </span>
          ) : (
            <span className="text-gray-400">—</span>
          ),
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
            <Button
              variant={
                r.readingStatus === MeterReadingStatus.NOT_RECORDED
                  ? "default"
                  : "outline"
              }
              size="sm"
              onClick={() => openReading(r)}
            >
              {r.readingStatus === MeterReadingStatus.NOT_RECORDED
                ? t("record-value")
                : t("edit")}
            </Button>
          ) : null,
      },
    ],
    [t, openReading]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("nav-meters")}
        description={t("meters-page-subtitle")}
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" />
            {t("add-meter")}
          </Button>
        }
      />

      <TypeToggle
        t={t}
        value={pageType}
        electricityCount={electricityCount}
        waterCount={waterCount}
        loading={isLoading}
        onChange={changePageType}
      />

      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="flex gap-6 border-b border-gray-200 px-4">
          <TabButton
            active={topTab === "meters"}
            onClick={() => setTopTab("meters")}
          >
            {t("meter-list")}
          </TabButton>
          <TabButton
            active={topTab === "by-period"}
            onClick={() => setTopTab("by-period")}
          >
            {t("record-by-period")}
          </TabButton>
        </div>

        {topTab === "meters" ? (
          <div className="space-y-4 p-4">
            <div className="flex items-center justify-end">
              <div className="relative w-full lg:w-72">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder={t("search-meter-placeholder")}
                  value={search}
                  onChange={(e) => changeSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <MetersTable
              t={t}
              loading={isLoading}
              meters={pageItems}
              onView={openMeter}
              onDelete={setDeleting}
            />

            {!isLoading && total > 0 && (
              <Pagination
                t={t}
                from={from}
                to={to}
                total={total}
                perPage={perPage}
                onPerPageChange={changePerPage}
                page={safePage}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            )}
          </div>
        ) : (
          <div className="space-y-4 p-4">
            {periods.length === 0 ? (
              <EmptyState
                title={t("no-billing-periods")}
                description={t("no-billing-periods-description")}
              />
            ) : (
              <>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="w-full max-w-xs">
                    <Select value={periodId} onValueChange={changePeriodId}>
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
                  <div className="relative w-full lg:w-72">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder={t("search-room-placeholder")}
                      value={readingsSearch}
                      onChange={(e) => changeReadingsSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                {!readingsLoading && typeReadings.length > 0 && (
                  <ReadingProgress
                    t={t}
                    type={pageType}
                    done={recordedCount}
                    total={typeReadings.length}
                  />
                )}

                <DataTable
                  columns={readingColumns}
                  data={pageReadings}
                  loading={readingsLoading}
                  getRowId={(r) => r.id}
                  emptyTitle={t("no-readings")}
                  emptyDescription={t("no-readings-description")}
                />

                {!readingsLoading && readingsTotal > 0 && (
                  <Pagination
                    t={t}
                    from={readingsFrom}
                    to={readingsTo}
                    total={readingsTotal}
                    perPage={readingsPerPage}
                    onPerPageChange={changeReadingsPerPage}
                    page={readingsSafePage}
                    totalPages={readingsTotalPages}
                    onPageChange={setReadingsPage}
                  />
                )}
              </>
            )}
          </div>
        )}
      </div>

      <MeterReadingsSheet
        open={sheetOpen}
        onOpenChange={handleSheetOpenChange}
        apartmentId={apartmentId}
        meter={activeMeter}
      />

      <MeterFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        apartmentId={apartmentId}
      />

      <ReadingDialog
        open={readingDialogOpen}
        onOpenChange={setReadingDialogOpen}
        apartmentId={apartmentId}
        reading={activeReading}
        mode={readingMode}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={t("delete-meter")}
        description={t("delete-meter-confirm", {
          name: deleting?.meterNumber ?? deleting?.roomName ?? "",
        })}
        confirmLabel={t("delete")}
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}

function TypeToggle({
  t,
  value,
  electricityCount,
  waterCount,
  loading,
  onChange,
}: {
  t: TranslateFn;
  value: MeterType;
  electricityCount: number;
  waterCount: number;
  loading: boolean;
  onChange: (value: MeterType) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:inline-grid sm:auto-cols-fr sm:grid-flow-col">
      <TypeToggleButton
        t={t}
        type={MeterType.ELECTRICITY}
        active={value === MeterType.ELECTRICITY}
        count={electricityCount}
        loading={loading}
        onClick={() => onChange(MeterType.ELECTRICITY)}
      />
      <TypeToggleButton
        t={t}
        type={MeterType.WATER}
        active={value === MeterType.WATER}
        count={waterCount}
        loading={loading}
        onClick={() => onChange(MeterType.WATER)}
      />
    </div>
  );
}

function TypeToggleButton({
  t,
  type,
  active,
  count,
  loading,
  onClick,
}: {
  t: TranslateFn;
  type: MeterType;
  active: boolean;
  count: number;
  loading: boolean;
  onClick: () => void;
}) {
  const meta = TYPE_META[type];
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex items-center gap-3 rounded-xl border bg-white p-4 text-left transition-colors sm:min-w-[220px]",
        active
          ? cn(meta.activeBorder, "ring-1 ring-primary/10")
          : "border-gray-200 hover:border-gray-300"
      )}
    >
      <span
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg",
          meta.iconWrap
        )}
      >
        <meta.Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p
          className={cn(
            "truncate text-sm font-medium",
            active ? "text-gray-900" : "text-gray-600"
          )}
        >
          {t(meta.labelKey)}
        </p>
        {loading ? (
          <Skeleton className="mt-1 h-6 w-14" />
        ) : (
          <p className="mt-0.5 flex items-baseline gap-1">
            <span className="text-xl font-semibold text-gray-900">{count}</span>
            <span className="text-xs text-gray-500">{t("meters-unit")}</span>
          </p>
        )}
      </div>
    </button>
  );
}

function ReadingProgress({
  t,
  type,
  done,
  total,
}: {
  t: TranslateFn;
  type: MeterType;
  done: number;
  total: number;
}) {
  const meta = TYPE_META[type];
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-lg px-4 py-3 sm:flex-row sm:items-center",
        meta.progressBar
      )}
    >
      <p className={cn("text-sm font-medium", meta.progressText)}>
        {t("reading-progress", { done, total })}
      </p>
      <div className="flex flex-1 items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/60">
          <div
            className={cn("h-full rounded-full", meta.progressFill)}
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className={cn("text-xs font-semibold", meta.progressText)}>
          {percent}%
        </span>
      </div>
    </div>
  );
}

function Pagination({
  t,
  from,
  to,
  total,
  perPage,
  onPerPageChange,
  page,
  totalPages,
  onPageChange,
}: {
  t: TranslateFn;
  from: number;
  to: number;
  total: number;
  perPage: number;
  onPerPageChange: (value: number) => void;
  page: number;
  totalPages: number;
  onPageChange: (value: number) => void;
}) {
  return (
    <div className="flex flex-col items-center justify-between gap-4 border-t border-gray-100 pt-4 sm:flex-row">
      <p className="text-sm text-gray-500">
        {t("showing-range", { from, to, total })}
      </p>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">{t("per-page")}</span>
          <Select
            value={String(perPage)}
            onValueChange={(v) => onPerPageChange(Number(v))}
          >
            <SelectTrigger className="h-8 w-[72px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PER_PAGE_OPTIONS.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            aria-label={t("previous")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-8 rounded-md bg-primary px-3 py-1 text-center text-sm font-medium text-primary-foreground">
            {page}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            aria-label={t("next")}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "-mb-px border-b-2 py-3 text-sm font-medium transition-colors",
        active
          ? "border-primary text-primary"
          : "border-transparent text-gray-500 hover:text-gray-700"
      )}
    >
      {children}
    </button>
  );
}

function MetersTable({
  t,
  loading,
  meters,
  onView,
  onDelete,
}: {
  t: TranslateFn;
  loading: boolean;
  meters: DisplayMeter[];
  onView: (m: DisplayMeter) => void;
  onDelete: (m: DisplayMeter) => void;
}) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (meters.length === 0) {
    return (
      <EmptyState
        title={t("no-meters")}
        description={t("no-meters-description")}
      />
    );
  }

  return (
    <>
      <div className="hidden overflow-hidden rounded-xl border border-gray-200 md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500">
              <th className="px-4 py-3">{t("room")}</th>
              <th className="px-4 py-3">{t("meter-number")}</th>
              <th className="px-4 py-3">{t("status")}</th>
              <th className="px-4 py-3">{t("last-usage")}</th>
              <th className="px-4 py-3 text-right">{t("manage-column")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {meters.map((m) => (
              <MeterRow
                key={m.id}
                t={t}
                meter={m}
                onView={onView}
                onDelete={onDelete}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {meters.map((m) => {
          const active = (m.status ?? "active") !== "inactive";
          return (
            <div
              key={m.id}
              className="rounded-xl border border-gray-200 bg-white p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-3">
                  <RoomIcon />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-gray-900">
                      {m.roomName ?? "-"}
                    </p>
                    {m.floor && (
                      <p className="text-xs text-gray-500">
                        {t("floor-with-number", { floor: m.floor })}
                      </p>
                    )}
                  </div>
                </div>
                <MeterActionsMenu
                  t={t}
                  meter={m}
                  onView={onView}
                  onDelete={onDelete}
                />
              </div>
              <dl className="mt-3 space-y-2 text-sm">
                <Row label={t("meter-number")}>
                  <span className="font-medium text-gray-900">
                    {m.meterNumber || "-"}
                  </span>
                </Row>
                <Row label={t("status")}>
                  <StatusDot active={active}>
                    {active ? t("meter-active") : t("meter-inactive")}
                  </StatusDot>
                </Row>
                <Row label={t("last-usage")}>
                  <span className="text-gray-500">{t("no-last-reading")}</span>
                </Row>
              </dl>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 w-full"
                onClick={() => onView(m)}
              >
                {t("view-meter-readings")}
              </Button>
            </div>
          );
        })}
      </div>
    </>
  );
}

function MeterRow({
  t,
  meter,
  onView,
  onDelete,
}: {
  t: TranslateFn;
  meter: DisplayMeter;
  onView: (m: DisplayMeter) => void;
  onDelete: (m: DisplayMeter) => void;
}) {
  const active = (meter.status ?? "active") !== "inactive";
  return (
    <tr className="bg-white hover:bg-gray-50">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <RoomIcon />
          <div className="min-w-0">
            <p className="font-medium text-gray-900">{meter.roomName ?? "-"}</p>
            {meter.floor && (
              <p className="text-xs text-gray-500">
                {t("floor-with-number", { floor: meter.floor })}
              </p>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <p className="font-medium text-gray-900">{meter.meterNumber || "-"}</p>
      </td>
      <td className="px-4 py-3">
        <StatusDot active={active}>
          {active ? t("meter-active") : t("meter-inactive")}
        </StatusDot>
      </td>
      <td className="px-4 py-3">
        <span className="text-gray-500">{t("no-last-reading")}</span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          <Button variant="outline" size="sm" onClick={() => onView(meter)}>
            {t("view-meter-readings")}
          </Button>
          <MeterActionsMenu
            t={t}
            meter={meter}
            onView={onView}
            onDelete={onDelete}
          />
        </div>
      </td>
    </tr>
  );
}

function MeterActionsMenu({
  t,
  meter,
  onView,
  onDelete,
}: {
  t: TranslateFn;
  meter: DisplayMeter;
  onView: (m: DisplayMeter) => void;
  onDelete: (m: DisplayMeter) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onView(meter)}>
          {t("view-meter-readings")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onDelete(meter)}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
          {t("delete")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function RoomIcon() {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
      <Home className="h-4 w-4" />
    </span>
  );
}

function StatusDot({
  active,
  children,
}: {
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-gray-700">
      <span
        className={cn(
          "h-2 w-2 rounded-full",
          active ? "bg-success" : "bg-gray-300"
        )}
      />
      {children}
    </span>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </dt>
      <dd className="text-right">{children}</dd>
    </div>
  );
}
