"use client";

import { useCallback, useMemo, useState } from "react";
import { useApartmentId } from "@/hooks/use-apartment-id";
import { useFilterParams } from "@/hooks/use-filter-params";
import { LogOut, MoreVertical, Pencil, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Pagination } from "@/components/ui/pagination";
import { PageHeader } from "@/components/shared/page-header";
import { FilterBar } from "@/components/shared/filter-bar";
import {
  DataTable,
  type Column,
  type SortDirection,
} from "@/components/shared/data-table";
import { exportTableCsv } from "@/lib/export";
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

  const { values, setValue, clearAll, hasActiveFilters } = useFilterParams({
    defaults: { search: "", page: "1" },
    debounceKeys: ["search"],
  });
  const search = values.search;
  const page = Math.max(1, Number(values.page) || 1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Tenant | null>(null);
  const [moveOut, setMoveOut] = useState<Tenant | null>(null);
  const [sortKey, setSortKey] = useState<string | null>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

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
        sortable: true,
        sortValue: (row) =>
          `${row.user.firstNameTH ?? ""} ${row.user.lastNameTH ?? ""}`.trim(),
        cell: (row) => (
          <div>
            <p className="font-medium text-gray-900">
              {row.user.firstNameTH} {row.user.lastNameTH}
            </p>
            <p className="text-xs text-gray-600">{row.user.email}</p>
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
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label={t("more-actions")}
              >
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

  const handleSortChange = useCallback((key: string) => {
    setSortKey((prev) => {
      if (prev === key) {
        setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
        return key;
      }
      setSortDirection("asc");
      return key;
    });
  }, []);

  const handleExportCsv = useCallback(() => {
    exportTableCsv("tenants.csv", columns, filtered);
  }, [columns, filtered]);

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

      <FilterBar
        search={{
          value: search,
          onChange: (v) => {
            setValue("search", v);
            setValue("page", "1");
          },
          placeholder: t("search-tenants-placeholder"),
        }}
        onClear={clearAll}
        showClear={hasActiveFilters}
        actions={
          <Button variant="outline" size="sm" onClick={handleExportCsv}>
            {t("export-csv")}
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={filtered}
        loading={isLoading}
        getRowId={(row) => row.tenantId}
        emptyTitle={t("no-tenants")}
        emptyDescription={t("no-tenants-description")}
        stickyHeader
        sortKey={sortKey}
        sortDirection={sortDirection}
        onSortChange={handleSortChange}
      />

      <Pagination
        page={page}
        totalPages={totalPagesOf(meta, items.length, DEFAULT_PAGE_SIZE)}
        onPageChange={(p) => setValue("page", String(p))}
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
