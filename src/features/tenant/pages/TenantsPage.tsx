"use client";

import { useCallback, useMemo, useState } from "react";
import { useApartmentId } from "@/hooks/use-apartment-id";
import { LogOut, MoreVertical, Pencil, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Pagination } from "@/components/ui/pagination";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { MoveOutDialog } from "@/features/tenant/components/move-out-dialog";
import { TenantFormDialog } from "@/features/tenant/components/tenant-form-dialog";
import { DEFAULT_PAGE_SIZE } from "@/constants/config";
import {
  useTenantRoomDropdown,
  useTenants,
} from "@/hooks/useTenants";
import { useT } from "@/i18n";
import { totalPagesOf } from "@/lib/list";
import type { Tenant } from "@/types";

export function TenantsPage() {
  const t = useT();
  const apartmentId = useApartmentId();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Tenant | null>(null);
  const [moveOut, setMoveOut] = useState<Tenant | null>(null);

  const { data, isLoading } = useTenants(apartmentId, {
    page,
    limit: DEFAULT_PAGE_SIZE,
  });
  const { data: rooms = [] } = useTenantRoomDropdown(apartmentId);

  const items = data?.items ?? [];
  const meta = data?.meta;

  const openCreate = useCallback(() => {
    setEditing(null);
    setFormOpen(true);
  }, []);

  const openEdit = useCallback((row: Tenant) => {
    setEditing(row);
    setFormOpen(true);
  }, []);

  const filtered = useMemo(() => {
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter((row) => {
      const firstName = row.user.firstNameTH ?? "";
      const lastName = row.user.lastNameTH ?? "";
      return (
        `${firstName} ${lastName}`.toLowerCase().includes(q) ||
        row.user.email?.toLowerCase().includes(q) ||
        row.user.phone?.includes(search) ||
        row.room.name?.toLowerCase().includes(q)
      );
    });
  }, [items, search]);

  const columns = useMemo<Column<Tenant>[]>(
    () => [
      {
        key: "name",
        header: t("tenant-name"),
        cell: (row) => (
          <div>
            <p className="font-medium text-gray-900">
              {row.user.firstNameTH} {row.user.lastNameTH}
            </p>
            <p className="text-xs text-gray-500">{row.user.email}</p>
          </div>
        ),
      },
      {
        key: "phone",
        header: t("phone-short"),
        cell: (row) => row.user.phone || "-",
      },
      {
        key: "room",
        header: t("room"),
        cell: (row) =>
          row.room.name ??
          rooms.find((r) => r.id === row.roomId)?.name ?? (
            <span className="text-gray-400">{t("not-specified")}</span>
          ),
      },
      {
        key: "status",
        header: t("status"),
        cell: (row) =>
          row.moveOutDate ? (
            <Badge variant="outline">{t("moved-out")}</Badge>
          ) : (
            <Badge variant="success">{t("staying")}</Badge>
          ),
      },
      {
        key: "actions",
        header: "",
        className: "text-right",
        hideOnMobile: true,
        cell: (row) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openEdit(row)}>
                <Pencil className="h-4 w-4" />
                {t("edit")}
              </DropdownMenuItem>
              {!row.moveOutDate && (
                <DropdownMenuItem
                  onClick={() => setMoveOut(row)}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                  {t("move-out")}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [t, rooms, openEdit]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("nav-tenants")}
        description={t("tenants-page-description")}
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            {t("add-tenant")}
          </Button>
        }
      />

      <div className="max-w-sm">
        <Input
          placeholder={t("search-tenants-placeholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={isLoading}
        getRowId={(row) => row.tenantId}
        emptyTitle={t("no-tenants")}
        emptyDescription={t("no-tenants-description")}
      />

      <Pagination
        page={page}
        totalPages={totalPagesOf(meta, items.length, DEFAULT_PAGE_SIZE)}
        onPageChange={setPage}
      />

      <TenantFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        apartmentId={apartmentId}
        tenant={editing}
        rooms={rooms}
      />

      <MoveOutDialog
        open={Boolean(moveOut)}
        onOpenChange={(o) => !o && setMoveOut(null)}
        apartmentId={apartmentId}
        tenant={moveOut}
      />
    </div>
  );
}
