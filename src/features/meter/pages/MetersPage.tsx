"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Droplets,
  Gauge,
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
import { ALL, DEFAULT_PAGE_SIZE, PER_PAGE_OPTIONS } from "@/constants/config";
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
import { countMetersByType, normalizePeriodOptions, type DisplayMeter } from "@/utils/meter";

type TypeFilter = typeof ALL | MeterType;
type TopTab = "meters" | "by-period";

const TYPE_META = {
  [MeterType.ELECTRICITY]: {
    Icon: Zap,
    labelKey: "electricity-meters",
    shortKey: "meter-type-electricity",
    iconWrap: "bg-primary-tint text-primary",
    chip: "bg-primary-tint text-primary",
    badge: "bg-[#FEF3C7] text-[#B45309]",
  },
  [MeterType.WATER]: {
    Icon: Droplets,
    labelKey: "water-meters",
    shortKey: "meter-type-water",
    iconWrap: "bg-[#EFF6FF] text-[#2563EB]",
    chip: "bg-[#EFF6FF] text-[#2563EB]",
    badge: "bg-[#DBEAFE] text-[#1D4ED8]",
  },
} as const;

function metaFor(type: string) {
  return type === MeterType.WATER
    ? TYPE_META[MeterType.WATER]
    : TYPE_META[MeterType.ELECTRICITY];
}

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
  const [typeFilter, setTypeFilter] = useState<TypeFilter>(ALL);
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
  const [readingsPage, setReadingsPage] = useState(1);
  const [readingsPerPage, setReadingsPerPage] = useState(DEFAULT_PAGE_SIZE);

  useEffect(() => {
    if (!periodId && periods[0]) setPeriodId(periods[0].id);
  }, [periods, periodId]);

  const changePeriodId = useCallback((value: string) => {
    setPeriodId(value);
    setReadingsPage(1);
  }, []);

  const { data: periodReadings = [], isLoading: readingsLoading } =
    useMeterReadingsByPeriod(apartmentId, periodId);

  const readingsTotal = periodReadings.length;
  const readingsTotalPages = Math.max(
    1,
    Math.ceil(readingsTotal / readingsPerPage)
  );
  const readingsSafePage = Math.min(readingsPage, readingsTotalPages);
  const readingsStartIndex = (readingsSafePage - 1) * readingsPerPage;
  const pageReadings = periodReadings.slice(
    readingsStartIndex,
    readingsStartIndex + readingsPerPage
  );
  const readingsFrom = readingsTotal === 0 ? 0 : readingsStartIndex + 1;
  const readingsTo = Math.min(
    readingsStartIndex + readingsPerPage,
    readingsTotal
  );

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
      if (typeFilter !== ALL && m.type !== typeFilter) return false;
      if (!q) return true;
      return (
        (m.roomName ?? "").toLowerCase().includes(q) ||
        (m.meterNumber ?? "").toLowerCase().includes(q)
      );
    });
  }, [meters, typeFilter, search]);

  const changeTypeFilter = useCallback((value: TypeFilter) => {
    setTypeFilter(value);
    setPage(1);
  }, []);

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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          t={t}
          loading={isLoading}
          icon={<Zap className="h-5 w-5" />}
          iconWrap={TYPE_META[MeterType.ELECTRICITY].iconWrap}
          label={t("electricity-meters")}
          value={electricityCount}
          active={topTab === "meters" && typeFilter === MeterType.ELECTRICITY}
          onClick={() => {
            setTopTab("meters");
            changeTypeFilter(MeterType.ELECTRICITY);
          }}
        />
        <StatCard
          t={t}
          loading={isLoading}
          icon={<Droplets className="h-5 w-5" />}
          iconWrap={TYPE_META[MeterType.WATER].iconWrap}
          label={t("water-meters")}
          value={waterCount}
          active={topTab === "meters" && typeFilter === MeterType.WATER}
          onClick={() => {
            setTopTab("meters");
            changeTypeFilter(MeterType.WATER);
          }}
        />
        <StatCard
          t={t}
          loading={isLoading}
          icon={<Gauge className="h-5 w-5" />}
          iconWrap="bg-[#FEF3C7] text-[#B45309]"
          label={t("all-meters")}
          value={meters.length}
          active={topTab === "meters" && typeFilter === ALL}
          onClick={() => {
            setTopTab("meters");
            changeTypeFilter(ALL);
          }}
        />
      </div>

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
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="inline-flex w-fit items-center gap-1 rounded-lg bg-gray-100 p-1">
                <FilterPill
                  active={typeFilter === ALL}
                  onClick={() => changeTypeFilter(ALL)}
                >
                  {t("all")}
                </FilterPill>
                <FilterPill
                  active={typeFilter === MeterType.ELECTRICITY}
                  onClick={() => changeTypeFilter(MeterType.ELECTRICITY)}
                >
                  <Zap className="h-3.5 w-3.5" />
                  {t("meter-type-electricity")}
                </FilterPill>
                <FilterPill
                  active={typeFilter === MeterType.WATER}
                  onClick={() => changeTypeFilter(MeterType.WATER)}
                >
                  <Droplets className="h-3.5 w-3.5" />
                  {t("meter-type-water")}
                </FilterPill>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1 lg:w-72">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder={t("search-meter-placeholder")}
                    value={search}
                    onChange={(e) => changeSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
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
              <div className="flex flex-col items-center justify-between gap-4 border-t border-gray-100 pt-4 sm:flex-row">
                <p className="text-sm text-gray-500">
                  {t("showing-range", { from, to, total })}
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">
                      {t("per-page")}
                    </span>
                    <Select
                      value={String(perPage)}
                      onValueChange={(v) => changePerPage(Number(v))}
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
                      disabled={safePage <= 1}
                      onClick={() => setPage(safePage - 1)}
                      aria-label={t("previous")}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="min-w-8 rounded-md bg-primary px-3 py-1 text-center text-sm font-medium text-primary-foreground">
                      {safePage}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      disabled={safePage >= totalPages}
                      onClick={() => setPage(safePage + 1)}
                      aria-label={t("next")}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
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
                <div className="max-w-xs">
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
                <DataTable
                  columns={readingColumns}
                  data={pageReadings}
                  loading={readingsLoading}
                  getRowId={(r) => r.id}
                  emptyTitle={t("no-readings")}
                  emptyDescription={t("no-readings-description")}
                />

                {!readingsLoading && readingsTotal > 0 && (
                  <div className="flex flex-col items-center justify-between gap-4 border-t border-gray-100 pt-4 sm:flex-row">
                    <p className="text-sm text-gray-500">
                      {t("showing-range", {
                        from: readingsFrom,
                        to: readingsTo,
                        total: readingsTotal,
                      })}
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">
                          {t("per-page")}
                        </span>
                        <Select
                          value={String(readingsPerPage)}
                          onValueChange={(v) =>
                            changeReadingsPerPage(Number(v))
                          }
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
                          disabled={readingsSafePage <= 1}
                          onClick={() => setReadingsPage(readingsSafePage - 1)}
                          aria-label={t("previous")}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="min-w-8 rounded-md bg-primary px-3 py-1 text-center text-sm font-medium text-primary-foreground">
                          {readingsSafePage}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          disabled={readingsSafePage >= readingsTotalPages}
                          onClick={() => setReadingsPage(readingsSafePage + 1)}
                          aria-label={t("next")}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
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

function StatCard({
  t,
  loading,
  icon,
  iconWrap,
  label,
  value,
  active,
  onClick,
}: {
  t: TranslateFn;
  loading: boolean;
  icon: React.ReactNode;
  iconWrap: string;
  label: string;
  value: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-white p-4 transition-colors",
        active ? "border-primary ring-1 ring-primary/20" : "border-gray-200"
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
            iconWrap
          )}
        >
          {icon}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm text-gray-500">{label}</p>
          {loading ? (
            <Skeleton className="mt-1 h-7 w-12" />
          ) : (
            <p className="mt-0.5 flex items-baseline gap-1">
              <span className="text-2xl font-semibold text-gray-900">
                {value}
              </span>
              <span className="text-xs text-gray-500">{t("meters-unit")}</span>
            </p>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={onClick}
        className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
      >
        {t("view-details")}
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
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

function FilterPill({
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
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-gray-600 hover:text-gray-900"
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
              <th className="px-4 py-3">{t("type")}</th>
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
          const meta = metaFor(m.type);
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
                  <div className="flex flex-col items-end gap-1">
                    <span className="font-medium text-gray-900">
                      {m.meterNumber || "-"}
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium",
                        meta.chip
                      )}
                    >
                      <meta.Icon className="h-3 w-3" />
                      {t(meta.labelKey)}
                    </span>
                  </div>
                </Row>
                <Row label={t("type")}>
                  <TypeBadge t={t} type={m.type} />
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
  const meta = metaFor(meter.type);
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
        <span
          className={cn(
            "mt-1 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium",
            meta.chip
          )}
        >
          <meta.Icon className="h-3 w-3" />
          {t(meta.labelKey)}
        </span>
      </td>
      <td className="px-4 py-3">
        <TypeBadge t={t} type={meter.type} />
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

function TypeBadge({ t, type }: { t: TranslateFn; type: string }) {
  const meta = metaFor(type);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        meta.badge
      )}
    >
      {t(meta.shortKey)}
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
