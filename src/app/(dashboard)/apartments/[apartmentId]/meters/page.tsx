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
import { toast } from "sonner";

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
import { MeterReadingsSheet } from "@/components/meters/meter-readings-sheet";
import { MeterFormDialog } from "@/components/meters/meter-form-dialog";
import { ReadingDialog } from "@/components/meters/reading-dialog";
import { api, buildQuery } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { toList } from "@/lib/list";
import { formatNumber, getApiErrorMessage } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useT, type TranslateFn } from "@/i18n";
import { MeterReadingStatus } from "@/types";
import type { Meter, MeterReading } from "@/types";

interface BillingPeriodOption {
  id: string;
  name: string;
}

interface RawMeter {
  id?: string;
  meterId?: string;
  apartmentId?: string;
  roomId?: string | null;
  roomName?: string | null;
  type?: string;
  meterNumber?: string | null;
  status?: string;
  isActive?: boolean;
  room?: { name?: string | null; floor?: string | null } | null;
  floor?: string | null;
  lastReadingAt?: string | null;
}

interface NormalizedMeter extends Meter {
  floor?: string | null;
  lastReadingAt?: string | null;
}

function normalizeMeter(raw: RawMeter): NormalizedMeter {
  return {
    id: raw.meterId ?? raw.id ?? "",
    apartmentId: raw.apartmentId ?? "",
    roomId: raw.roomId ?? null,
    roomName: raw.room?.name ?? raw.roomName ?? null,
    type: raw.type ?? "",
    meterNumber: raw.meterNumber ?? null,
    status: raw.status,
    isActive: raw.isActive,
    floor: raw.room?.floor ?? raw.floor ?? null,
    lastReadingAt: raw.lastReadingAt ?? null,
  };
}

type TypeFilter = "all" | "electricity" | "water";
type TopTab = "meters" | "by-period";

const PER_PAGE_OPTIONS = [10, 20, 50];

const TYPE_META = {
  electricity: {
    Icon: Zap,
    labelKey: "electricity-meters",
    shortKey: "meter-type-electricity",
    iconWrap: "bg-primary-tint text-primary",
    chip: "bg-primary-tint text-primary",
    badge: "bg-[#FEF3C7] text-[#B45309]",
  },
  water: {
    Icon: Droplets,
    labelKey: "water-meters",
    shortKey: "meter-type-water",
    iconWrap: "bg-[#EFF6FF] text-[#2563EB]",
    chip: "bg-[#EFF6FF] text-[#2563EB]",
    badge: "bg-[#DBEAFE] text-[#1D4ED8]",
  },
} as const;

function metaFor(type: string) {
  return type === "water" ? TYPE_META.water : TYPE_META.electricity;
}

export default function MetersPage() {
  const t = useT();
  const { apartmentId } = useParams<{ apartmentId: string }>();

  const [meters, setMeters] = useState<NormalizedMeter[]>([]);
  const [loading, setLoading] = useState(true);

  const [topTab, setTopTab] = useState<TopTab>("meters");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeMeter, setActiveMeter] = useState<Meter | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<NormalizedMeter | null>(null);

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
      setMeters(toList<RawMeter>(res).items.map(normalizeMeter));
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
        const list = toList<{
          id?: string;
          billingPeriodId?: string;
          name?: string;
          label?: string;
        }>(res).items;
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

  const electricityCount = useMemo(
    () => meters.filter((m) => m.type === "electricity").length,
    [meters]
  );
  const waterCount = useMemo(
    () => meters.filter((m) => m.type === "water").length,
    [meters]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return meters.filter((m) => {
      if (typeFilter !== "all" && m.type !== typeFilter) return false;
      if (!q) return true;
      return (
        (m.roomName ?? "").toLowerCase().includes(q) ||
        (m.meterNumber ?? "").toLowerCase().includes(q)
      );
    });
  }, [meters, typeFilter, search]);

  const changeTypeFilter = (value: TypeFilter) => {
    setTypeFilter(value);
    setPage(1);
  };
  const changeSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };
  const changePerPage = (value: number) => {
    setPerPage(value);
    setPage(1);
  };

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * perPage;
  const pageItems = filtered.slice(startIndex, startIndex + perPage);
  const from = total === 0 ? 0 : startIndex + 1;
  const to = Math.min(startIndex + perPage, total);

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

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await api.delete(endpoints.meters.remove(apartmentId, deleting.id));
      toast.success(t("meter-deleted"));
      loadMeters();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setDeleting(null);
    }
  };

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
          loading={loading}
          icon={<Zap className="h-5 w-5" />}
          iconWrap={TYPE_META.electricity.iconWrap}
          label={t("electricity-meters")}
          value={electricityCount}
          active={topTab === "meters" && typeFilter === "electricity"}
          onClick={() => {
            setTopTab("meters");
            changeTypeFilter("electricity");
          }}
        />
        <StatCard
          t={t}
          loading={loading}
          icon={<Droplets className="h-5 w-5" />}
          iconWrap={TYPE_META.water.iconWrap}
          label={t("water-meters")}
          value={waterCount}
          active={topTab === "meters" && typeFilter === "water"}
          onClick={() => {
            setTopTab("meters");
            changeTypeFilter("water");
          }}
        />
        <StatCard
          t={t}
          loading={loading}
          icon={<Gauge className="h-5 w-5" />}
          iconWrap="bg-[#FEF3C7] text-[#B45309]"
          label={t("all-meters")}
          value={meters.length}
          active={topTab === "meters" && typeFilter === "all"}
          onClick={() => {
            setTopTab("meters");
            changeTypeFilter("all");
          }}
        />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white">
        {/* Top tabs */}
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
            {/* Filters */}
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="inline-flex w-fit items-center gap-1 rounded-lg bg-gray-100 p-1">
                <FilterPill
                  active={typeFilter === "all"}
                  onClick={() => changeTypeFilter("all")}
                >
                  {t("all")}
                </FilterPill>
                <FilterPill
                  active={typeFilter === "electricity"}
                  onClick={() => changeTypeFilter("electricity")}
                >
                  <Zap className="h-3.5 w-3.5" />
                  {t("meter-type-electricity")}
                </FilterPill>
                <FilterPill
                  active={typeFilter === "water"}
                  onClick={() => changeTypeFilter("water")}
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

            {/* Table */}
            <MetersTable
              t={t}
              loading={loading}
              meters={pageItems}
              onView={openMeter}
              onDelete={(m) => setDeleting(m)}
            />

            {/* Footer */}
            {!loading && total > 0 && (
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
          </div>
        )}
      </div>

      <MeterReadingsSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        apartmentId={apartmentId}
        meter={activeMeter}
      />

      <MeterFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        apartmentId={apartmentId}
        onSaved={loadMeters}
      />

      <ReadingDialog
        open={readingDialogOpen}
        onOpenChange={setReadingDialogOpen}
        apartmentId={apartmentId}
        reading={activeReading}
        mode={readingMode}
        onDone={loadPeriodReadings}
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
  meters: NormalizedMeter[];
  onView: (m: NormalizedMeter) => void;
  onDelete: (m: NormalizedMeter) => void;
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
      {/* Desktop */}
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

      {/* Mobile */}
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
                <MeterActions
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
  meter: NormalizedMeter;
  onView: (m: NormalizedMeter) => void;
  onDelete: (m: NormalizedMeter) => void;
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
          <MeterActions
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

function MeterActions({
  t,
  meter,
  onView,
  onDelete,
}: {
  t: TranslateFn;
  meter: NormalizedMeter;
  onView: (m: NormalizedMeter) => void;
  onDelete: (m: NormalizedMeter) => void;
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
