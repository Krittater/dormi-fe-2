"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { toList } from "@/lib/list";
import { zodFormResolver } from "@/lib/zod-resolver";
import { formatCurrency, getApiErrorMessage } from "@/lib/format";
import {
  CHARGE_TYPE_CATEGORY_LABELS,
  ChargeTypeCategory,
} from "@/types";
import type { ChargeType } from "@/types";

const schema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อ"),
  description: z.string().optional(),
  category: z.nativeEnum(ChargeTypeCategory),
  defaultAmount: z.string().optional(),
  isActive: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

export default function ChargeTypesPage() {
  const { apartmentId } = useParams<{ apartmentId: string }>();

  const [items, setItems] = useState<ChargeType[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ChargeType | null>(null);
  const [deleting, setDeleting] = useState<ChargeType | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodFormResolver<FormValues>(schema),
    defaultValues: {
      name: "",
      description: "",
      category: ChargeTypeCategory.OTHER,
      defaultAmount: "",
      isActive: true,
    },
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(endpoints.chargeTypes.list(apartmentId));
      setItems(toList<ChargeType>(res).items);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [apartmentId]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    form.reset({
      name: "",
      description: "",
      category: ChargeTypeCategory.OTHER,
      defaultAmount: "",
      isActive: true,
    });
    setFormOpen(true);
  };

  const openEdit = (ct: ChargeType) => {
    setEditing(ct);
    form.reset({
      name: ct.name,
      description: ct.description ?? "",
      category: ct.category ?? ChargeTypeCategory.OTHER,
      defaultAmount: ct.defaultAmount != null ? String(ct.defaultAmount) : "",
      isActive: ct.isActive,
    });
    setFormOpen(true);
  };

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    const payload = {
      name: values.name,
      description: values.description || undefined,
      category: values.category,
      defaultAmount: values.defaultAmount
        ? Number(values.defaultAmount)
        : undefined,
      isActive: values.isActive,
    };
    try {
      if (editing) {
        await api.patch(
          endpoints.chargeTypes.update(apartmentId, editing.id),
          payload
        );
        toast.success("แก้ไขประเภทค่าใช้จ่ายสำเร็จ");
      } else {
        await api.post(endpoints.chargeTypes.create(apartmentId), payload);
        toast.success("เพิ่มประเภทค่าใช้จ่ายสำเร็จ");
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
      await api.delete(endpoints.chargeTypes.remove(apartmentId, deleting.id));
      toast.success("ลบประเภทค่าใช้จ่ายสำเร็จ");
      load();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setDeleting(null);
    }
  };

  const columns: Column<ChargeType>[] = [
    {
      key: "name",
      header: "ชื่อ",
      cell: (c) => <span className="font-medium text-gray-900">{c.name}</span>,
    },
    {
      key: "category",
      header: "หมวดหมู่",
      cell: (c) => (
        <Badge variant="secondary">
          {CHARGE_TYPE_CATEGORY_LABELS[c.category ?? ChargeTypeCategory.OTHER]}
        </Badge>
      ),
    },
    {
      key: "defaultAmount",
      header: "จำนวนแนะนำ",
      cell: (c) =>
        c.defaultAmount != null ? formatCurrency(c.defaultAmount) : "-",
    },
    {
      key: "isActive",
      header: "สถานะ",
      cell: (c) =>
        c.isActive ? (
          <Badge variant="success">ใช้งาน</Badge>
        ) : (
          <Badge variant="outline">ปิด</Badge>
        ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      cell: (c) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => openEdit(c)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive"
            onClick={() => setDeleting(c)}
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
        title="ประเภทค่าใช้จ่าย"
        description="กำหนดประเภทค่าใช้จ่ายสำหรับนำไปผูกกับห้อง"
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            เพิ่มประเภท
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={items}
        loading={loading}
        getRowId={(c) => c.id}
        emptyTitle="ยังไม่มีประเภทค่าใช้จ่าย"
        emptyDescription="เพิ่มประเภทค่าใช้จ่าย เช่น ค่าส่วนกลาง ค่าอินเทอร์เน็ต"
      />

      <Dialog open={formOpen} onOpenChange={(o) => !submitting && setFormOpen(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "แก้ไขประเภทค่าใช้จ่าย" : "เพิ่มประเภทค่าใช้จ่าย"}
            </DialogTitle>
            <DialogDescription>
              ตั้งชื่อ หมวดหมู่ และจำนวนเงินแนะนำ
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ชื่อ</FormLabel>
                    <FormControl>
                      <Input placeholder="ค่าส่วนกลาง" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>หมวดหมู่</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(ChargeTypeCategory).map((c) => (
                          <SelectItem key={c} value={c}>
                            {CHARGE_TYPE_CATEGORY_LABELS[c]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="defaultAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>จำนวนเงินแนะนำ (ไม่บังคับ)</FormLabel>
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
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
                    <FormLabel>เปิดใช้งาน</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
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
        title="ลบประเภทค่าใช้จ่าย"
        description={`ต้องการลบ "${deleting?.name}" ใช่หรือไม่?`}
        confirmLabel="ลบ"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}
