"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodFormResolver } from "@/lib/zod-resolver";
import { z } from "zod";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Pagination } from "@/components/ui/pagination";
import { api, buildQuery } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { toList, totalPagesOf } from "@/lib/list";
import { formatCurrency, getApiErrorMessage } from "@/lib/format";
import type { PaginationMeta, RoomType } from "@/types";

const schema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อประเภทห้อง"),
  price: z.coerce.number({ message: "กรุณากรอกตัวเลข" }).positive("ราคาต้องมากกว่า 0"),
  description: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

const LIMIT = 10;

export default function RoomTypesPage() {
  const { apartmentId } = useParams<{ apartmentId: string }>();

  const [items, setItems] = useState<RoomType[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>();
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RoomType | null>(null);
  const [deleting, setDeleting] = useState<RoomType | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodFormResolver<FormValues>(schema),
    defaultValues: { name: "", price: 0, description: "" },
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get(
        endpoints.roomTypes.list(apartmentId) +
          buildQuery({ page, limit: LIMIT, keyword: keyword || undefined })
      );
      const { items, meta } = toList<RoomType>(res);
      setItems(items);
      setMeta(meta);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apartmentId, page]);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      load();
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword]);

  const openCreate = () => {
    setEditing(null);
    form.reset({ name: "", price: 0, description: "" });
    setFormOpen(true);
  };

  const openEdit = (rt: RoomType) => {
    setEditing(rt);
    form.reset({
      name: rt.name,
      price: rt.price,
      description: rt.description ?? "",
    });
    setFormOpen(true);
  };

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      if (editing) {
        await api.patch(
          endpoints.roomTypes.update(apartmentId, editing.id),
          values
        );
        toast.success("แก้ไขประเภทห้องสำเร็จ");
      } else {
        await api.post(endpoints.roomTypes.create(apartmentId), values);
        toast.success("เพิ่มประเภทห้องสำเร็จ");
      }
      setFormOpen(false);
      load();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await api.delete(endpoints.roomTypes.remove(apartmentId, deleting.id));
      toast.success("ลบประเภทห้องสำเร็จ");
      load();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setDeleting(null);
    }
  };

  const columns: Column<RoomType>[] = [
    {
      key: "name",
      header: "ชื่อประเภท",
      cell: (r) => <span className="font-medium text-gray-900">{r.name}</span>,
    },
    {
      key: "price",
      header: "ราคา/เดือน",
      cell: (r) => formatCurrency(r.price),
    },
    {
      key: "description",
      header: "คำอธิบาย",
      cell: (r) => (
        <span className="text-gray-500">{r.description || "-"}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      cell: (r) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => openEdit(r)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive"
            onClick={() => setDeleting(r)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="ประเภทห้อง"
        description="กำหนดประเภทห้องและราคาเช่าต่อเดือน"
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            เพิ่มประเภทห้อง
          </Button>
        }
      />

      <div className="max-w-sm">
        <Input
          placeholder="ค้นหาประเภทห้อง..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
      </div>

      <DataTable
        columns={columns}
        data={items}
        loading={loading}
        getRowId={(r) => r.id}
        emptyTitle="ยังไม่มีประเภทห้อง"
        emptyDescription="เพิ่มประเภทห้องเพื่อใช้สร้างห้องพัก"
      />

      <Pagination
        page={page}
        totalPages={totalPagesOf(meta, items.length, LIMIT)}
        onPageChange={setPage}
      />

      <Dialog open={formOpen} onOpenChange={(o) => !submitting && setFormOpen(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "แก้ไขประเภทห้อง" : "เพิ่มประเภทห้อง"}
            </DialogTitle>
            <DialogDescription>
              กำหนดชื่อและราคาเช่าต่อเดือนของประเภทห้อง
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ชื่อประเภท</FormLabel>
                    <FormControl>
                      <Input placeholder="Standard Room" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ราคา/เดือน (บาท)</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>คำอธิบาย (ไม่บังคับ)</FormLabel>
                    <FormControl>
                      <Textarea rows={2} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFormOpen(false)}
                  disabled={submitting}
                >
                  ยกเลิก
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  บันทึก
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="ลบประเภทห้อง"
        description={`ต้องการลบประเภท "${deleting?.name}" ใช่หรือไม่?`}
        confirmLabel="ลบ"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}
