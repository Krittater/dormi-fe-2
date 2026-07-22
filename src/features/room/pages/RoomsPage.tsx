"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { useApartmentId } from "@/hooks/use-apartment-id";
import { useApartmentOverview } from "@/hooks/useApartments";
import { useFilterParams } from "@/hooks/use-filter-params";
import { usePlan } from "@/hooks/usePlan";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  ChevronDown,
  Download,
  Droplets,
  LayoutGrid,
  List,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
  UserPlus,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { FilterBar } from "@/components/shared/filter-bar";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { DataTable, type Column, sortTableData, type SortDirection } from "@/components/shared/data-table";
import { exportTableCsv } from "@/lib/export";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { TenantFormDialog } from "@/features/tenant/components/tenant-form-dialog";
import { RoomFormDialog } from "@/features/room/components/room-form-dialog";
import { RoomBulkFormDialog } from "@/features/room/components/room-bulk-form-dialog";
import { RoomDetailSheet } from "@/features/room/components/room-detail-sheet";
import {
  ACTIVE,
  ALL,
  DEFAULT_PAGE_SIZE,
  DROPDOWN_LIMIT,
  INACTIVE,
  SKELETON_ROWS_ROOMS,
  VIEW_GRID,
  VIEW_TABLE,
} from "@/constants/config";
import {
  useAllRooms,
  useRoomActions,
  useRoomTypesDropdown,
} from "@/hooks/useRooms";
import {
  formatNumber,
  formatPhone,
  getInitials,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import { normalizeRoomOverviewCounts } from "@/utils/overview";
import { roomPrice } from "@/utils/room";
import { qk } from "@/queries/keys";
import { ROOM_STATUS_CODES, RoomStatus } from "@/types";
import type { Room } from "@/types";
import { useT } from "@/i18n";

export function RoomsPage() {
  const t = useT();
  const apartmentId = useApartmentId();
  const queryClient = useQueryClient();
  const { roomLimit, roomsUsed, roomQuotaFull } = usePlan();

  const { values, setValue, clearAll, hasActiveFilters } = useFilterParams({
    defaults: {
      search: "",
      status: ALL,
      active: ALL,
      floor: ALL,
      view: VIEW_GRID,
      page: "1",
    },
    debounceKeys: ["search"],
    // view/page ไม่ใช่ตัวกรอง — และล้างตัวกรองต้องไม่สลับมุมมองกลับเป็น grid
    metaKeys: ["view", "page"],
    preserveOnClear: ["view"],
  });
  const search = values.search;
  const status = values.status;
  const active = values.active;
  const floor = values.floor;
  const view = values.view === VIEW_TABLE ? VIEW_TABLE : VIEW_GRID;
  const page = Math.max(1, Number(values.page) || 1);

  const [sortKey, setSortKey] = useState<string | null>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const [formOpen, setFormOpen] = useState(false);
  const [bulkFormOpen, setBulkFormOpen] = useState(false);
  const [editing, setEditing] = useState<Room | null>(null);
  const [deleting, setDeleting] = useState<Room | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [detailRoomId, setDetailRoomId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [tenantFormOpen, setTenantFormOpen] = useState(false);
  const [tenantRoomId, setTenantRoomId] = useState<string | undefined>();

  // ดึงห้องครบทุกหน้าครั้งเดียว แล้วกรอง/เรียง/แบ่งหน้าฝั่ง FE ทั้งหมด —
  // กรองบางส่วนฝั่ง server บน dataset ที่ paginate แล้วทำให้ข้อมูลหายเงียบ ๆ
  const {
    data: allRooms = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useAllRooms(apartmentId);
  const { overview: overviewQuery } = useApartmentOverview(apartmentId);
  const { data: roomTypesData, isSuccess: roomTypesLoaded } =
    useRoomTypesDropdown(apartmentId, DROPDOWN_LIMIT);
  const { remove, bulkRemove } = useRoomActions(apartmentId);

  const roomTypes = useMemo(
    () => roomTypesData?.items ?? [],
    [roomTypesData]
  );

  const openCreate = useCallback(() => {
    setEditing(null);
    setFormOpen(true);
  }, []);

  const openEdit = useCallback((room: Room) => {
    setEditing(room);
    setFormOpen(true);
  }, []);

  const openDetail = useCallback((room: Room) => {
    setDetailRoomId(room.id);
    setDetailOpen(true);
  }, []);

  const openAddTenant = useCallback((room: Room) => {
    setTenantRoomId(room.id);
    setTenantFormOpen(true);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!deleting) return;
    await remove.mutateAsync(deleting.id);
    setSelectedIds((prev) => prev.filter((id) => id !== deleting.id));
    setDeleting(null);
  }, [deleting, remove]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const clearSelection = useCallback(() => setSelectedIds([]), []);

  const invalidateRooms = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: qk.rooms.all(apartmentId) });
  }, [apartmentId, queryClient]);

  const handleSortChange = useCallback(
    (key: string) => {
      if (sortKey === key) {
        setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortKey(key);
        setSortDirection("asc");
      }
    },
    [sortKey]
  );

  const floorOptions = useMemo(
    () =>
      Array.from(
        new Set(allRooms.map((r) => (r.floor ?? "").trim()).filter(Boolean))
      ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
    [allRooms]
  );

  const filteredRooms = useMemo(() => {
    const q = search.trim().toLowerCase();
    const wantActive = active === ALL ? null : active === ACTIVE;
    return allRooms.filter((r) => {
      if (q && !r.name.toLowerCase().includes(q)) return false;
      if (status !== ALL && r.status !== status) return false;
      if (wantActive != null && r.isActive !== wantActive) return false;
      if (floor !== ALL && (r.floor ?? "").trim() !== floor) return false;
      return true;
    });
  }, [allRooms, search, status, active, floor]);

  // Selection ที่ "มีผลจริง" = เฉพาะห้องที่ยังอยู่ในผลกรอง — ห้องที่ถูกกรองออก
  // จนมองไม่เห็นต้องไม่ติดไปกับการลบ (derive ตอน render แทน mutate state ใน effect)
  const activeSelectedIds = useMemo(() => {
    if (selectedIds.length === 0) return selectedIds;
    const allowed = new Set(filteredRooms.map((r) => r.id));
    return selectedIds.filter((id) => allowed.has(id));
  }, [selectedIds, filteredRooms]);

  const selectAllFiltered = useCallback(() => {
    setSelectedIds(filteredRooms.map((r) => r.id));
  }, [filteredRooms]);

  const selectedRooms = useMemo(
    () => filteredRooms.filter((r) => activeSelectedIds.includes(r.id)),
    [filteredRooms, activeSelectedIds]
  );
  const selectedOccupied = useMemo(
    () => selectedRooms.filter((r) => r.currentTenant),
    [selectedRooms]
  );
  const selectedNamesSummary = useMemo(() => {
    const names = selectedRooms.map((r) => r.name);
    if (names.length <= 4) return names.join(", ");
    return `${names.slice(0, 4).join(", ")} ${t("and-n-more-rooms", {
      n: names.length - 4,
    })}`;
  }, [selectedRooms, t]);

  const allFilteredSelected =
    filteredRooms.length > 0 && activeSelectedIds.length >= filteredRooms.length;

  const handleBulkDelete = useCallback(async () => {
    if (activeSelectedIds.length === 0) return;

    const result = await bulkRemove.mutateAsync(activeSelectedIds);
    const { succeeded, failed } = result.summary;

    if (failed === 0) {
      toast.success(t("bulk-delete-rooms-success", { n: succeeded }));
      setSelectedIds([]);
    } else {
      const reasons = result.failed
        .slice(0, 3)
        .map((f) => {
          const name =
            allRooms.find((r) => r.id === f.roomId)?.name ??
            f.roomId.slice(0, 8);
          return `${name}: ${f.reason}`;
        })
        .join("\n");
      const moreSuffix =
        result.failed.length > 3
          ? `\n${t("and-n-more-rooms", { n: result.failed.length - 3 })}`
          : "";
      const notify = succeeded === 0 ? toast.error : toast.warning;
      notify(
        succeeded === 0
          ? t("bulk-delete-rooms-none", { n: failed })
          : t("bulk-delete-rooms-partial", { ok: succeeded, fail: failed }),
        { description: reasons + moreSuffix, duration: 8000 }
      );
      // คงห้องที่ลบไม่สำเร็จไว้ในสถานะเลือก ให้ผู้ใช้เห็นว่าเหลือห้องไหน
      setSelectedIds(result.failed.map((f) => f.roomId));
    }
    setConfirmBulkDelete(false);
  }, [activeSelectedIds, allRooms, bulkRemove, t]);

  const columns = useMemo<Column<Room>[]>(
    () => [
      {
        key: "select",
        header: t("select"),
        headerNode: (
          <Checkbox
            checked={
              allFilteredSelected
                ? true
                : activeSelectedIds.length > 0
                  ? "indeterminate"
                  : false
            }
            onCheckedChange={(checked) =>
              checked ? selectAllFiltered() : clearSelection()
            }
            aria-label={t("select-all-filtered", { n: filteredRooms.length })}
          />
        ),
        className: "w-10 shrink-0",
        cell: (r) => (
          <Checkbox
            checked={selectedIds.includes(r.id)}
            onCheckedChange={() => toggleSelect(r.id)}
            onClick={(e) => e.stopPropagation()}
            aria-label={t("select")}
          />
        ),
      },
      {
        key: "name",
        header: t("room"),
        sortable: true,
        sortValue: (r) => r.name,
        cell: (r) => (
          <button
            onClick={(e) => {
              e.stopPropagation();
              openDetail(r);
            }}
            className="font-medium text-primary hover:underline"
          >
            {r.name}
          </button>
        ),
      },
      {
        key: "roomType",
        header: t("type"),
        sortable: true,
        sortValue: (r) =>
          r.roomType?.name ??
          roomTypes.find((rt) => rt.id === r.roomTypeId)?.name ??
          "",
        cell: (r) =>
          r.roomType?.name ??
          roomTypes.find((rt) => rt.id === r.roomTypeId)?.name ??
          "-",
      },
      {
        key: "floor",
        header: t("floor"),
        sortable: true,
        sortValue: (r) => r.floor ?? "",
        cell: (r) => r.floor || "-",
      },
      {
        key: "price",
        header: t("price-per-month"),
        sortable: true,
        sortValue: (r) => roomPrice(r) ?? 0,
        cell: (r) => {
          const p = roomPrice(r);
          return p != null ? formatNumber(p) : "-";
        },
      },
      {
        key: "tenant",
        header: t("tenant"),
        sortable: true,
        sortValue: (r) => r.currentTenant?.fullName ?? "",
        cell: (r) =>
          r.currentTenant ? (
            <div>
              <p className="text-gray-900">{r.currentTenant.fullName}</p>
              <p className="text-xs text-muted-foreground">
                {formatPhone(r.currentTenant.phone)}
              </p>
            </div>
          ) : (
            <span className="text-muted-foreground">-</span>
          ),
      },
      {
        key: "status",
        header: t("status"),
        sortable: true,
        sortValue: (r) => r.status,
        cell: (r) => <StatusBadge kind="room" value={r.status} />,
      },
      {
        key: "active",
        header: t("active"),
        sortable: true,
        sortValue: (r) => (r.isActive ? 1 : 0),
        cell: (r) => (r.isActive ? t("on") : t("off")),
      },
      {
        key: "actions",
        header: "",
        className: "text-right",
        hideOnMobile: true,
        cell: (r) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label={t("more-actions")}
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            {/* stopPropagation: คลิกเมนูใน portal ยัง bubble ผ่าน React tree ไปโดน row onClick แล้วเปิด drawer ซ้อน */}
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={() => openDetail(r)}>
                {t("view-details")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openEdit(r)}>
                <Pencil className="h-4 w-4" />
                {t("edit")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setDeleting(r)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                {t("delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [
      t,
      roomTypes,
      openDetail,
      openEdit,
      selectedIds,
      toggleSelect,
      allFilteredSelected,
      activeSelectedIds.length,
      filteredRooms.length,
      selectAllFiltered,
      clearSelection,
    ]
  );

  const sortedRooms = useMemo(
    () => sortTableData(filteredRooms, columns, sortKey, sortDirection),
    [filteredRooms, columns, sortKey, sortDirection]
  );

  const totalPages = Math.max(
    1,
    Math.ceil(sortedRooms.length / DEFAULT_PAGE_SIZE)
  );
  const safePage = Math.min(page, totalPages);
  const visibleItems = useMemo(
    () =>
      sortedRooms.slice(
        (safePage - 1) * DEFAULT_PAGE_SIZE,
        safePage * DEFAULT_PAGE_SIZE
      ),
    [sortedRooms, safePage]
  );

  const handleExportCsv = useCallback(() => {
    // คอลัมน์เฉพาะ export — cell ต้องคืน string (StatusBadge ฯลฯ จะกลายเป็นช่องว่าง)
    // และรวมราคา/ผู้เช่าที่ตารางบนจอไม่มี
    const exportColumns: Column<Room>[] = [
      { key: "name", header: t("room"), cell: (r) => r.name },
      {
        key: "roomType",
        header: t("type"),
        cell: (r) =>
          r.roomType?.name ??
          roomTypes.find((rt) => rt.id === r.roomTypeId)?.name ??
          "",
      },
      { key: "floor", header: t("floor"), cell: (r) => r.floor ?? "" },
      {
        key: "status",
        header: t("status"),
        cell: (r) => t(ROOM_STATUS_CODES[r.status]),
      },
      {
        key: "active",
        header: t("active"),
        cell: (r) => (r.isActive ? t("on") : t("off")),
      },
      {
        key: "price",
        header: t("price-per-month"),
        cell: (r) => roomPrice(r) ?? "",
      },
      {
        key: "tenant",
        header: t("tenant"),
        cell: (r) => r.currentTenant?.fullName ?? "",
      },
      {
        key: "phone",
        header: t("phone"),
        cell: (r) => r.currentTenant?.phone ?? "",
      },
    ];
    exportTableCsv("rooms.csv", exportColumns, sortedRooms);
  }, [roomTypes, sortedRooms, t]);

  const overviewCounts = useMemo(
    () => normalizeRoomOverviewCounts(overviewQuery.data),
    [overviewQuery.data]
  );
  const totalRooms = overviewCounts.total || allRooms.length;
  const rentedCount = overviewCounts.rented;
  const availableCount = overviewCounts.available;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("nav-rooms")}
        description={t("rooms-page-description")}
        actions={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              {/* span ครอบเพื่อให้ title โผล่ได้แม้ปุ่ม disabled (ปุ่ม disabled ไม่รับ pointer event) */}
              <span
                title={
                  roomTypes.length === 0
                    ? t("add-room-type-first")
                    : roomQuotaFull
                      ? t("plan-room-quota-full")
                      : undefined
                }
              >
                <Button disabled={roomTypes.length === 0 || roomQuotaFull}>
                  <Plus className="h-4 w-4" />
                  {t("add-room")}
                  <ChevronDown className="h-4 w-4 opacity-70" />
                </Button>
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={openCreate}>
                {t("add-single-room")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setBulkFormOpen(true)}>
                {t("bulk-add-rooms")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />

      {/* โควตาห้องรวมทุกหอตามแผน (backend เป็นผู้บังคับจริง — นี่คือคำเตือนล่วงหน้า) */}
      {roomLimit !== null && (
        <p
          className={cn(
            "rounded-lg px-4 py-3 text-sm",
            roomQuotaFull
              ? "bg-destructive/10 text-destructive"
              : "bg-primary-light text-gray-700"
          )}
        >
          {t("plan-room-quota", {
            used: roomsUsed,
            limit: roomLimit,
          })}
          {roomQuotaFull && <> — {t("plan-room-quota-full")}</>}
        </p>
      )}

      {roomTypesLoaded && roomTypes.length === 0 && (
        <p className="rounded-lg bg-warning/10 px-4 py-3 text-sm text-gray-700">
          {t("add-room-type-first")}{" "}
          <Link
            href={`/apartments/${apartmentId}/room-types`}
            className="font-medium text-primary hover:underline"
          >
            {t("nav-room-types")}
          </Link>
        </p>
      )}

      {/* สถิติอยู่เหนือตัวกรอง (ภาพรวมก่อนเครื่องมือ) และกดเป็น filter shortcut ได้ */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => {
            setValue("page", "1");
            setValue("status", ALL);
          }}
          className="text-left"
        >
          <Card
            className={cn(
              "transition-shadow hover:shadow-md",
              status === ALL && "ring-2 ring-primary/40"
            )}
          >
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">
                {t("rooms-count-all")}
              </p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {totalRooms}
              </p>
            </CardContent>
          </Card>
        </button>
        <button
          type="button"
          onClick={() => {
            setValue("page", "1");
            setValue("status", RoomStatus.RENTED);
          }}
          className="text-left"
        >
          <Card
            className={cn(
              "transition-shadow hover:shadow-md",
              status === RoomStatus.RENTED && "ring-2 ring-primary/40"
            )}
          >
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">
                {t("room-status-rented")}
              </p>
              <p className="mt-1 text-2xl font-semibold text-success">
                {rentedCount}
              </p>
            </CardContent>
          </Card>
        </button>
        <button
          type="button"
          onClick={() => {
            setValue("page", "1");
            setValue("status", RoomStatus.AVAILABLE);
          }}
          className="text-left"
        >
          <Card
            className={cn(
              "transition-shadow hover:shadow-md",
              status === RoomStatus.AVAILABLE && "ring-2 ring-primary/40"
            )}
          >
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">
                {t("room-status-available")}
              </p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {availableCount}
              </p>
            </CardContent>
          </Card>
        </button>
      </div>

      <FilterBar
        search={{
          value: search,
          onChange: (v) => {
            setValue("page", "1");
            setValue("search", v);
          },
          placeholder: t("search-room-number"),
        }}
        filters={[
          {
            id: "floor",
            node: (
              <Select
                value={floor}
                onValueChange={(v) => {
                  setValue("page", "1");
                  setValue("floor", v);
                }}
              >
                <SelectTrigger className="sm:w-40">
                  <SelectValue placeholder={t("all-floors")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>{t("all-floors")}</SelectItem>
                  {floorOptions.map((f) => (
                    <SelectItem key={f} value={f}>
                      {t("floor-with-number", { floor: f })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ),
          },
          {
            id: "status",
            node: (
              <Select
                value={status}
                onValueChange={(v) => {
                  setValue("page", "1");
                  setValue("status", v);
                }}
              >
                <SelectTrigger className="sm:w-44">
                  <SelectValue placeholder={t("status")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>{t("all-statuses")}</SelectItem>
                  {Object.values(RoomStatus).map((s) => (
                    <SelectItem key={s} value={s}>
                      {t(ROOM_STATUS_CODES[s])}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ),
          },
          {
            id: "active",
            node: (
              <Select
                value={active}
                onValueChange={(v) => {
                  setValue("page", "1");
                  setValue("active", v);
                }}
              >
                <SelectTrigger className="sm:w-44">
                  <SelectValue placeholder={t("usage")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>{t("all")}</SelectItem>
                  <SelectItem value={ACTIVE}>{t("enabled")}</SelectItem>
                  <SelectItem value={INACTIVE}>{t("disabled")}</SelectItem>
                </SelectContent>
              </Select>
            ),
          },
        ]}
        onClear={clearAll}
        showClear={hasActiveFilters}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg border border-gray-200 p-1">
              <Button
                variant={view === VIEW_GRID ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                title={t("grid-view")}
                aria-label={t("grid-view")}
                aria-pressed={view === VIEW_GRID}
                onClick={() => setValue("view", VIEW_GRID)}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={view === VIEW_TABLE ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                title={t("table-view")}
                aria-label={t("table-view")}
                aria-pressed={view === VIEW_TABLE}
                onClick={() => setValue("view", VIEW_TABLE)}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              disabled={sortedRooms.length === 0}
            >
              <Download className="h-4 w-4" />
              {t("export-csv")} ({sortedRooms.length})
            </Button>
          </div>
        }
      />

      {activeSelectedIds.length > 0 && (
        // sticky: การ์ด 20 ใบสูงเกินจอ — เลือกห้องล่างสุดแล้วต้องยังเห็นปุ่มลบ
        <div className="sticky top-2 z-20 flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-md">
          <div className="min-w-0">
            <span className="text-sm font-medium text-gray-900">
              {t("selected-rooms-count", { n: activeSelectedIds.length })}
            </span>
            <p className="max-w-md truncate text-xs text-muted-foreground">
              {selectedNamesSummary}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 sm:ml-auto">
            {!allFilteredSelected && (
              <Button size="sm" variant="outline" onClick={selectAllFiltered}>
                {t("select-all-filtered", { n: filteredRooms.length })}
              </Button>
            )}
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setConfirmBulkDelete(true)}
              disabled={bulkRemove.isPending}
            >
              <Trash2 className="h-4 w-4" />
              {t("delete-selected")}
            </Button>
            <Button size="sm" variant="secondary" onClick={clearSelection}>
              <X className="h-4 w-4" />
              {t("clear-selection")}
            </Button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {t("showing-rooms-of-total", {
            count: visibleItems.length,
            total: filteredRooms.length,
          })}
        </p>
      </div>

      {isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : view === VIEW_TABLE ? (
        <DataTable
          columns={columns}
          data={visibleItems}
          loading={isLoading}
          getRowId={(r) => r.id}
          onRowClick={openDetail}
          emptyTitle={t("no-rooms")}
          emptyDescription={t("add-first-room")}
          stickyHeader
          sortKey={sortKey}
          sortDirection={sortDirection}
          onSortChange={handleSortChange}
        />
      ) : isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: SKELETON_ROWS_ROOMS }).map((_, i) => (
            <Skeleton key={i} className="h-52 w-full rounded-xl" />
          ))}
        </div>
      ) : visibleItems.length === 0 ? (
        <EmptyState
          title={t("no-rooms")}
          description={t("add-first-room")}
          action={
            roomTypes.length > 0 ? (
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" />
                {t("add-room")}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visibleItems.map((r) => {
            const typeName =
              r.roomType?.name ??
              roomTypes.find((rt) => rt.id === r.roomTypeId)?.name ??
              "-";
            const priceValue = roomPrice(r);
            const tenant = r.currentTenant;
            return (
              <Card
                key={r.id}
                role="button"
                tabIndex={0}
                aria-label={r.name}
                onClick={() => openDetail(r)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openDetail(r);
                  }
                }}
                className={cn(
                  "cursor-pointer transition-shadow hover:shadow-md",
                  !r.isActive && "opacity-60"
                )}
              >
                <CardContent className="flex h-full flex-col gap-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-start gap-2.5">
                      <Checkbox
                        className="mt-1.5"
                        checked={selectedIds.includes(r.id)}
                        onCheckedChange={() => toggleSelect(r.id)}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={t("select")}
                      />
                      <div className="min-w-0">
                        <p className="truncate text-lg font-semibold text-gray-900">
                          {r.name}
                        </p>
                        <p className="truncate text-sm text-muted-foreground">
                          {typeName}
                        </p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="-mr-2 -mt-1 h-8 w-8 shrink-0"
                          aria-label={t("more-actions")}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      {/* stopPropagation: คลิกเมนูใน portal ยัง bubble ผ่าน React tree ไปโดน Card onClick แล้วเปิด drawer ซ้อน */}
                      <DropdownMenuContent
                        align="end"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <DropdownMenuItem onClick={() => openDetail(r)}>
                          {t("view-details")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEdit(r)}>
                          <Pencil className="h-4 w-4" />
                          {t("edit")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeleting(r)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                          {t("delete")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <StatusBadge kind="room" value={r.status} />
                      {!r.isActive && (
                        <span className="text-xs text-muted-foreground">
                          {t("off")}
                        </span>
                      )}
                    </div>
                    {typeof priceValue === "number" &&
                      !Number.isNaN(priceValue) && (
                        <span className="text-sm font-semibold text-gray-900">
                          {t("baht-per-month", {
                            amount: formatNumber(priceValue),
                          })}
                        </span>
                      )}
                  </div>

                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>{t("floor-with-number", { floor: r.floor || "-" })}</p>
                    {(r.isCalElectric || r.isCalWater) && (
                      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
                        {r.isCalElectric && (
                          <span className="inline-flex items-center gap-1">
                            <Zap className="h-3.5 w-3.5" />
                            {t("charge-electric")}
                          </span>
                        )}
                        {r.isCalElectric && r.isCalWater && <span>·</span>}
                        {r.isCalWater && (
                          <span className="inline-flex items-center gap-1">
                            <Droplets className="h-3.5 w-3.5" />
                            {t("charge-water")}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-auto border-t border-gray-100 pt-3">
                    {tenant ? (
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback>
                              {getInitials(tenant.fullName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-gray-900">
                              {tenant.fullName}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {formatPhone(tenant.phone)}
                            </p>
                          </div>
                        </div>
                        {/* ปุ่มนี้เปิด detail sheet ของห้อง ไม่ใช่โปรไฟล์ผู้เช่า — label ต้องตรงกับสิ่งที่เกิด */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDetail(r);
                          }}
                          className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary hover:underline"
                        >
                          {t("view-details")}
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm text-muted-foreground">
                          {t("no-tenant")}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openAddTenant(r);
                          }}
                          className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary hover:underline"
                        >
                          <UserPlus className="h-3.5 w-3.5" />
                          {t("add-tenant")}
                        </button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Pagination
        page={safePage}
        totalPages={totalPages}
        onPageChange={(p) => setValue("page", String(p))}
      />

      <RoomFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        apartmentId={apartmentId}
        room={editing}
        roomTypes={roomTypes}
      />

      <RoomBulkFormDialog
        open={bulkFormOpen}
        onOpenChange={setBulkFormOpen}
        apartmentId={apartmentId}
        roomTypes={roomTypes}
      />

      <RoomDetailSheet
        open={detailOpen}
        onOpenChange={setDetailOpen}
        apartmentId={apartmentId}
        roomId={detailRoomId}
        listPrice={
          detailRoomId
            ? (() => {
                const room = allRooms.find((r) => r.id === detailRoomId);
                return room ? roomPrice(room) : undefined;
              })()
            : undefined
        }
        onEdit={(roomId) => {
          const room = allRooms.find((r) => r.id === roomId);
          if (!room) return;
          setDetailOpen(false);
          openEdit(room);
        }}
        onAddTenant={(roomId) => {
          setDetailOpen(false);
          setTenantRoomId(roomId);
          setTenantFormOpen(true);
        }}
      />

      <TenantFormDialog
        open={tenantFormOpen}
        onOpenChange={setTenantFormOpen}
        apartmentId={apartmentId}
        rooms={allRooms.map((r) => ({ id: r.id, name: r.name }))}
        defaultRoomId={tenantRoomId}
        onSuccess={invalidateRooms}
      />

      <ConfirmDialog
        open={confirmBulkDelete}
        onOpenChange={(o) => !o && setConfirmBulkDelete(false)}
        title={t("bulk-delete-rooms-title")}
        description={t("bulk-delete-rooms-description", {
          n: activeSelectedIds.length,
        })}
        confirmLabel={t("delete")}
        destructive
        onConfirm={handleBulkDelete}
      >
        <div className="space-y-2 text-sm">
          <p className="font-medium text-gray-900">{t("rooms-to-delete")}</p>
          <p className="text-gray-700">
            {selectedRooms
              .slice(0, 10)
              .map((r) => r.name)
              .join(", ")}
            {selectedRooms.length > 10 &&
              ` ${t("and-n-more-rooms", { n: selectedRooms.length - 10 })}`}
          </p>
          {selectedOccupied.length > 0 && (
            <p className="rounded-lg bg-warning/10 px-3 py-2 text-gray-800">
              {t("bulk-delete-occupied-warning", {
                n: selectedOccupied.length,
              })}
              {": "}
              {selectedOccupied
                .slice(0, 5)
                .map((r) => r.name)
                .join(", ")}
              {selectedOccupied.length > 5 &&
                ` ${t("and-n-more-rooms", { n: selectedOccupied.length - 5 })}`}
            </p>
          )}
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={t("delete-room")}
        description={t("delete-confirm-description", {
          name: deleting?.name ?? "",
        })}
        confirmLabel={t("delete")}
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}
