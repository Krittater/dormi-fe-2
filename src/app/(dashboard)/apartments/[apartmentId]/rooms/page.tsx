"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { MoreVertical, Pencil, Plus, Trash2 } from "lucide-react";
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
import { Pagination } from "@/components/ui/pagination";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { RoomFormDialog } from "@/components/rooms/room-form-dialog";
import { RoomDetailSheet } from "@/components/rooms/room-detail-sheet";
import { api, buildQuery } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { toList, totalPagesOf } from "@/lib/list";
import { getApiErrorMessage } from "@/lib/format";
import { ROOM_STATUS_LABELS, RoomStatus } from "@/types";
import type { PaginationMeta, Room, RoomType } from "@/types";

const LIMIT = 20;
const ALL = "all";

export default function RoomsPage() {
  const { apartmentId } = useParams<{ apartmentId: string }>();

  const [items, setItems] = useState<Room[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>();
  const [loading, setLoading] = useState(true);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>(ALL);
  const [active, setActive] = useState<string>(ALL);
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Room | null>(null);
  const [deleting, setDeleting] = useState<Room | null>(null);
  const [detailRoomId, setDetailRoomId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(
        endpoints.rooms.list(apartmentId) +
          buildQuery({
            page,
            limit: LIMIT,
            search: search || undefined,
            status: status === ALL ? undefined : status,
            isActive: active === ALL ? undefined : active === "active",
          })
      );
      const norm = toList<Room>(res);
      setItems(norm.items);
      setMeta(norm.meta);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [apartmentId, page, search, status, active]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    api
      .get(endpoints.roomTypes.list(apartmentId) + buildQuery({ limit: 100 }))
      .then((res) => setRoomTypes(toList<RoomType>(res).items))
      .catch(() => undefined);
  }, [apartmentId]);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (room: Room) => {
    setEditing(room);
    setFormOpen(true);
  };
  const openDetail = (room: Room) => {
    setDetailRoomId(room.id);
    setDetailOpen(true);
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await api.delete(endpoints.rooms.remove(apartmentId, deleting.id));
      toast.success("ลบห้องสำเร็จ");
      load();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setDeleting(null);
    }
  };

  const columns: Column<Room>[] = [
    {
      key: "name",
      header: "ห้อง",
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
      header: "ประเภท",
      cell: (r) =>
        r.roomType?.name ??
        roomTypes.find((t) => t.id === r.roomTypeId)?.name ??
        "-",
    },
    { key: "floor", header: "ชั้น", cell: (r) => r.floor || "-" },
    {
      key: "status",
      header: "สถานะ",
      cell: (r) => <StatusBadge kind="room" value={r.status} />,
    },
    {
      key: "active",
      header: "ใช้งาน",
      cell: (r) => (r.isActive ? "เปิด" : "ปิด"),
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
              ดูรายละเอียด
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openEdit(r)}>
              <Pencil className="h-4 w-4" />
              แก้ไข
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setDeleting(r)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              ลบ
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="ห้องพัก"
        description="จัดการห้องพัก สถานะ และมิเตอร์"
        actions={
          <Button onClick={openCreate} disabled={roomTypes.length === 0}>
            <Plus className="h-4 w-4" />
            เพิ่มห้องพัก
          </Button>
        }
      />

      {roomTypes.length === 0 && !loading && (
        <p className="rounded-lg bg-warning/10 px-4 py-3 text-sm text-gray-700">
          กรุณาเพิ่มประเภทห้องก่อน จึงจะสามารถสร้างห้องพักได้
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="ค้นหาเลขห้อง..."
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          className="sm:max-w-xs"
        />
        <Select
          value={status}
          onValueChange={(v) => {
            setPage(1);
            setStatus(v);
          }}
        >
          <SelectTrigger className="sm:w-44">
            <SelectValue placeholder="สถานะ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>ทุกสถานะ</SelectItem>
            {Object.values(RoomStatus).map((s) => (
              <SelectItem key={s} value={s}>
                {ROOM_STATUS_LABELS[s]}
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
            <SelectValue placeholder="การใช้งาน" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>ทั้งหมด</SelectItem>
            <SelectItem value="active">เปิดใช้งาน</SelectItem>
            <SelectItem value="inactive">ปิดใช้งาน</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={items}
        loading={loading}
        getRowId={(r) => r.id}
        onRowClick={openDetail}
        emptyTitle="ยังไม่มีห้องพัก"
        emptyDescription="เพิ่มห้องพักแรกของหอพักนี้"
      />

      <Pagination
        page={page}
        totalPages={totalPagesOf(meta, items.length, LIMIT)}
        onPageChange={setPage}
      />

      <RoomFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        apartmentId={apartmentId}
        room={editing}
        roomTypes={roomTypes}
        onSaved={load}
      />

      <RoomDetailSheet
        open={detailOpen}
        onOpenChange={setDetailOpen}
        apartmentId={apartmentId}
        roomId={detailRoomId}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="ลบห้องพัก"
        description={`ต้องการลบห้อง "${deleting?.name}" ใช่หรือไม่?`}
        confirmLabel="ลบ"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}
