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
import type { PaginationMeta, Tenant } from "@/types";

const LIMIT = 20;

interface RoomOption {
  id: string;
  name: string;
}

export default function TenantsPage() {
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

  const filtered = items.filter((t) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      `${t.firstNameTH} ${t.lastNameTH}`.toLowerCase().includes(q) ||
      t.email?.toLowerCase().includes(q) ||
      t.phone?.includes(search) ||
      t.roomName?.toLowerCase().includes(q)
    );
  });

  const columns: Column<Tenant>[] = [
    {
      key: "name",
      header: "ชื่อผู้เช่า",
      cell: (t) => (
        <div>
          <p className="font-medium text-gray-900">
            {t.firstNameTH} {t.lastNameTH}
          </p>
          <p className="text-xs text-gray-500">{t.email}</p>
        </div>
      ),
    },
    { key: "phone", header: "เบอร์โทร", cell: (t) => t.phone || "-" },
    {
      key: "room",
      header: "ห้อง",
      cell: (t) =>
        t.roomName ??
        rooms.find((r) => r.id === t.roomId)?.name ?? (
          <span className="text-gray-400">ยังไม่ระบุ</span>
        ),
    },
    {
      key: "status",
      header: "สถานะ",
      cell: (t) =>
        t.moveOutDate ? (
          <Badge variant="outline">ย้ายออกแล้ว</Badge>
        ) : (
          <Badge variant="success">กำลังพัก</Badge>
        ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      hideOnMobile: true,
      cell: (t) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => openEdit(t)}>
              <Pencil className="h-4 w-4" />
              แก้ไข
            </DropdownMenuItem>
            {!t.moveOutDate && (
              <DropdownMenuItem
                onClick={() => setMoveOut(t)}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="h-4 w-4" />
                ย้ายออก
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
        title="ผู้เช่า"
        description="จัดการทะเบียนผู้เช่าและสัญญา"
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            เพิ่มผู้เช่า
          </Button>
        }
      />

      <div className="max-w-sm">
        <Input
          placeholder="ค้นหาชื่อ อีเมล เบอร์โทร หรือห้อง..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        getRowId={(t) => t.id}
        emptyTitle="ยังไม่มีผู้เช่า"
        emptyDescription="เพิ่มผู้เช่าเข้าสู่หอพักนี้"
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
