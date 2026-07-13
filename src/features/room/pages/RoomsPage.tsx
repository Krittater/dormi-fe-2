"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { useApartmentId } from "@/hooks/use-apartment-id";
import { useApartmentOverview } from "@/hooks/useApartments";
import { useFilterParams } from "@/hooks/use-filter-params";
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
  Zap,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  useRoomActions,
  useRooms,
  useRoomTypesDropdown,
} from "@/hooks/useRooms";
import {
  formatNumber,
  formatPhone,
  getInitials,
} from "@/lib/format";
import { totalPagesOf } from "@/lib/list";
import { cn } from "@/lib/utils";
import { normalizeRoomOverviewCounts } from "@/utils/overview";
import { qk } from "@/queries/keys";
import { ROOM_STATUS_CODES, RoomStatus } from "@/types";
import type { Room } from "@/types";
import { useT } from "@/i18n";

export function RoomsPage() {
  const t = useT();
  const apartmentId = useApartmentId();
  const queryClient = useQueryClient();

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
  const [detailRoomId, setDetailRoomId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [tenantFormOpen, setTenantFormOpen] = useState(false);
  const [tenantRoomId, setTenantRoomId] = useState<string | undefined>();

  const listParams = useMemo(
    () => ({
      page,
      limit: DEFAULT_PAGE_SIZE,
      search: search || undefined,
      status: status === ALL ? undefined : status,
      isActive:
        active === ALL ? undefined : active === ACTIVE ? true : false,
    }),
    [page, search, status, active]
  );

  const { data, isLoading, isError, error, refetch } = useRooms(
    apartmentId,
    listParams
  );
  const { overview: overviewQuery } = useApartmentOverview(apartmentId);
  const { data: roomTypesData, isSuccess: roomTypesLoaded } =
    useRoomTypesDropdown(apartmentId, DROPDOWN_LIMIT);
  const { remove } = useRoomActions(apartmentId);

  const items = data?.items ?? [];
  const meta = data?.meta;
  const roomTypes = roomTypesData?.items ?? [];

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
    setDeleting(null);
  }, [deleting, remove]);

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

  const columns = useMemo<Column<Room>[]>(
    () => [
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
            <DropdownMenuContent align="end">
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
    [t, roomTypes, openDetail, openEdit]
  );

  const floorOptions = useMemo(
    () =>
      Array.from(
        new Set(items.map((r) => (r.floor ?? "").trim()).filter(Boolean))
      ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
    [items]
  );

  const filteredByFloor = useMemo(
    () =>
      floor === ALL
        ? items
        : items.filter((r) => (r.floor ?? "").trim() === floor),
    [items, floor]
  );

  const sortedByFloor = useMemo(
    () => sortTableData(filteredByFloor, columns, sortKey, sortDirection),
    [filteredByFloor, columns, sortKey, sortDirection]
  );

  const visibleItems = sortedByFloor;

  const apiTotalPages = totalPagesOf(meta, items.length, DEFAULT_PAGE_SIZE);
  const totalPages = floor === ALL ? apiTotalPages : 1;
  const safePage = floor === ALL ? Math.min(page, apiTotalPages) : page;

  const handleExportCsv = useCallback(() => {
    exportTableCsv("rooms.csv", columns, sortedByFloor);
  }, [columns, sortedByFloor]);

  const overviewCounts = useMemo(
    () => normalizeRoomOverviewCounts(overviewQuery.data),
    [overviewQuery.data]
  );
  const totalRooms = overviewCounts.total || meta?.total || items.length;
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
              <Button disabled={roomTypes.length === 0}>
                <Plus className="h-4 w-4" />
                {t("add-room")}
                <ChevronDown className="h-4 w-4 opacity-70" />
              </Button>
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
            {view === VIEW_TABLE && (
              <Button variant="outline" size="sm" onClick={handleExportCsv}>
                <Download className="h-4 w-4" />
                {t("export-csv")}
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">
              {t("rooms-count-all")}
            </p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">
              {totalRooms}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">
              {t("room-status-rented")}
            </p>
            <p className="mt-1 text-2xl font-semibold text-success">
              {rentedCount}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">
              {t("room-status-available")}
            </p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">
              {availableCount}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            {t("showing-rooms-count", { count: visibleItems.length })}
          </p>
          {floor !== ALL && (
            <p className="text-xs text-gray-600">{t("floor-filter-hint")}</p>
          )}
        </div>
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
            const priceValue =
              r.price ??
              (typeof r.roomType?.price === "number"
                ? r.roomType.price
                : r.roomType?.price != null
                  ? Number(r.roomType.price)
                  : undefined);
            const tenant = r.currentTenant;
            return (
              <Card
                key={r.id}
                role="button"
                tabIndex={0}
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
                    <div className="min-w-0">
                      <p className="truncate text-lg font-semibold text-gray-900">
                        {r.name}
                      </p>
                      <p className="truncate text-sm text-muted-foreground">
                        {typeName}
                      </p>
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
                      <DropdownMenuContent align="end">
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
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDetail(r);
                          }}
                          className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary hover:underline"
                        >
                          {t("view-profile")}
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
      />

      <TenantFormDialog
        open={tenantFormOpen}
        onOpenChange={setTenantFormOpen}
        apartmentId={apartmentId}
        rooms={items.map((r) => ({ id: r.id, name: r.name }))}
        defaultRoomId={tenantRoomId}
        onSuccess={invalidateRooms}
      />

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
