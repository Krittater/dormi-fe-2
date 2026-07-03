"use client";

import { useCallback, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
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
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { TenantFormDialog } from "@/features/tenant/components/tenant-form-dialog";
import { RoomFormDialog } from "@/features/room/components/room-form-dialog";
import { RoomDetailSheet } from "@/features/room/components/room-detail-sheet";
import {
  ACTIVE,
  ALL,
  DEFAULT_PAGE_SIZE,
  DROPDOWN_LIMIT,
  INACTIVE,
  ROOMS_FETCH_ALL_LIMIT,
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
import { cn } from "@/lib/utils";
import { qk } from "@/queries/keys";
import { ROOM_STATUS_CODES, RoomStatus } from "@/types";
import type { Room } from "@/types";
import { useT } from "@/i18n";

export function RoomsPage() {
  const t = useT();
  const { apartmentId } = useParams<{ apartmentId: string }>();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>(ALL);
  const [active, setActive] = useState<string>(ALL);
  const [floor, setFloor] = useState<string>(ALL);
  const [page, setPage] = useState(1);
  const [view, setView] = useState<typeof VIEW_TABLE | typeof VIEW_GRID>(
    VIEW_GRID
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Room | null>(null);
  const [deleting, setDeleting] = useState<Room | null>(null);
  const [detailRoomId, setDetailRoomId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [tenantFormOpen, setTenantFormOpen] = useState(false);
  const [tenantRoomId, setTenantRoomId] = useState<string | undefined>();

  const listParams = useMemo(
    () => ({
      limit: ROOMS_FETCH_ALL_LIMIT,
      search: search || undefined,
      status: status === ALL ? undefined : status,
      isActive:
        active === ALL ? undefined : active === ACTIVE ? true : false,
    }),
    [search, status, active]
  );

  const { data, isLoading } = useRooms(apartmentId, listParams);
  const { data: roomTypesData } = useRoomTypesDropdown(
    apartmentId,
    DROPDOWN_LIMIT
  );
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

  const columns = useMemo<Column<Room>[]>(
    () => [
      {
        key: "name",
        header: t("room"),
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
        cell: (r) =>
          r.roomType?.name ??
          roomTypes.find((rt) => rt.id === r.roomTypeId)?.name ??
          "-",
      },
      { key: "floor", header: t("floor"), cell: (r) => r.floor || "-" },
      {
        key: "status",
        header: t("status"),
        cell: (r) => <StatusBadge kind="room" value={r.status} />,
      },
      {
        key: "active",
        header: t("active"),
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

  const floorFilteredTotal = filteredByFloor.length;
  const totalPages = Math.max(
    1,
    Math.ceil(floorFilteredTotal / DEFAULT_PAGE_SIZE)
  );
  const safePage = Math.min(page, totalPages);
  const visibleItems = useMemo(
    () =>
      filteredByFloor.slice(
        (safePage - 1) * DEFAULT_PAGE_SIZE,
        safePage * DEFAULT_PAGE_SIZE
      ),
    [filteredByFloor, safePage]
  );

  const totalRooms = meta?.total ?? items.length;
  const rentedCount = items.filter(
    (r) => r.status === RoomStatus.RENTED || Boolean(r.currentTenant)
  ).length;
  const availableCount = items.filter(
    (r) => r.status === RoomStatus.AVAILABLE && !r.currentTenant
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("nav-rooms")}
        description={t("rooms-page-description")}
        actions={
          <Button onClick={openCreate} disabled={roomTypes.length === 0}>
            <Plus className="h-4 w-4" />
            {t("add-room")}
          </Button>
        }
      />

      {roomTypes.length === 0 && !isLoading && (
        <p className="rounded-lg bg-warning/10 px-4 py-3 text-sm text-gray-700">
          {t("add-room-type-first")}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Input
          placeholder={t("search-room-number")}
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          className="sm:max-w-xs"
        />
        <Select
          value={floor}
          onValueChange={(v) => {
            setPage(1);
            setFloor(v);
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
        <Select
          value={status}
          onValueChange={(v) => {
            setPage(1);
            setStatus(v);
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
        <Select
          value={active}
          onValueChange={(v) => {
            setPage(1);
            setActive(v);
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
      </div>

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
        <p className="text-sm text-muted-foreground">
          {t("showing-rooms-count", { count: visibleItems.length })}
        </p>
        <div className="flex items-center gap-1 rounded-lg border border-gray-200 p-1">
          <Button
            variant={view === VIEW_GRID ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            title={t("grid-view")}
            aria-label={t("grid-view")}
            aria-pressed={view === VIEW_GRID}
            onClick={() => setView(VIEW_GRID)}
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
            onClick={() => setView(VIEW_TABLE)}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {view === VIEW_TABLE ? (
        <DataTable
          columns={columns}
          data={visibleItems}
          loading={isLoading}
          getRowId={(r) => r.id}
          onRowClick={openDetail}
          emptyTitle={t("no-rooms")}
          emptyDescription={t("add-first-room")}
        />
      ) : isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: SKELETON_ROWS_ROOMS }).map((_, i) => (
            <Skeleton key={i} className="h-52 w-full rounded-xl" />
          ))}
        </div>
      ) : visibleItems.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 py-16 text-center">
          <p className="font-medium text-gray-900">{t("no-rooms")}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("add-first-room")}
          </p>
        </div>
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
        onPageChange={setPage}
      />

      <RoomFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        apartmentId={apartmentId}
        room={editing}
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
