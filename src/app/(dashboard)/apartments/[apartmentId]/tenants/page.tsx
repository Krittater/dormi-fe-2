"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { LogOut, MoreVertical, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";

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
import { TenantFormDialog } from "@/components/tenants/tenant-form-dialog";
import { MoveOutDialog } from "@/components/tenants/move-out-dialog";
import { api, buildQuery } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { toList, totalPagesOf } from "@/lib/list";
import { getApiErrorMessage } from "@/lib/format";
import { useT } from "@/i18n";
import type { PaginationMeta, Tenant } from "@/types";

const LIMIT = 20;

interface RoomOption {
  id: string;
  name: string;
}

export default function TenantsPage() {
  const t = useT();
  const { apartmentId } = useParams<{ apartmentId: string }>();

  const [items, setItems] = useState<Tenant[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>();
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState<RoomOption[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Tenant | null>(null);
  const [moveOut, setMoveOut] = useState<Tenant | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(
        endpoints.tenants.list(apartmentId) +
          buildQuery({ page, limit: LIMIT })
      );
      const norm = toList<Tenant>(res);
      setItems(norm.items);
      setMeta(norm.meta);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [apartmentId, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    api
      .get<Array<{ roomId?: string; id?: string; name: string }>>(
        endpoints.rooms.dropdown(apartmentId)
      )
      .then((res) => {
        const list = toList<{ roomId?: string; id?: string; name: string }>(
          res
        ).items;
        setRooms(
          list.map((r) => ({ id: r.roomId ?? r.id ?? "", name: r.name }))
        );
      })
      .catch(() => undefined);
  }, [apartmentId]);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (t: Tenant) => {
    setEditing(t);
    setFormOpen(true);
  };

  const filtered = items.filter((row) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      `${row.firstNameTH} ${row.lastNameTH}`.toLowerCase().includes(q) ||
      row.email?.toLowerCase().includes(q) ||
      row.phone?.includes(search) ||
      row.roomName?.toLowerCase().includes(q)
    );
  });

  const columns: Column<Tenant>[] = [
    {
      key: "name",
      header: t("tenant-name"),
      cell: (row) => (
        <div>
          <p className="font-medium text-gray-900">
            {row.firstNameTH} {row.lastNameTH}
          </p>
          <p className="text-xs text-gray-500">{row.email}</p>
        </div>
      ),
    },
    {
      key: "phone",
      header: t("phone-short"),
      cell: (row) => row.phone || "-",
    },
    {
      key: "room",
      header: t("room"),
      cell: (row) =>
        row.roomName ??
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
  ];

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
        loading={loading}
        getRowId={(row) => row.id}
        emptyTitle={t("no-tenants")}
        emptyDescription={t("no-tenants-description")}
      />

      <Pagination
        page={page}
        totalPages={totalPagesOf(meta, items.length, LIMIT)}
        onPageChange={setPage}
      />

      <TenantFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        apartmentId={apartmentId}
        tenant={editing}
        rooms={rooms}
        onSaved={load}
      />

      <MoveOutDialog
        open={Boolean(moveOut)}
        onOpenChange={(o) => !o && setMoveOut(null)}
        apartmentId={apartmentId}
        tenant={moveOut}
        onDone={load}
      />
    </div>
  );
}
