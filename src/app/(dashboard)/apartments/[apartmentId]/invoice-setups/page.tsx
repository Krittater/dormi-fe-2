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
import { formatCurrency, formatDate, getApiErrorMessage } from "@/lib/format";
import { INVOICE_TYPE_LABELS, InvoiceType } from "@/types";
import type { InvoiceSetup } from "@/types";

const RATE_TYPES = [InvoiceType.ELECTRICITY, InvoiceType.WATER];

const schema = z
  .object({
    type: z.nativeEnum(InvoiceType),
    cutOffDate: z.coerce.number().int().min(1).max(31),
    issueDate: z.coerce.number().int().min(1).max(31),
    dueDate: z.coerce.number().int().min(1).max(31),
    effectiveFrom: z.string().min(1, "กรุณาเลือกวันเริ่มมีผล"),
    effectiveTo: z.string().optional(),
    ratePerUnit: z.string().optional(),
    isActive: z.boolean(),
  })
  .refine(
    (d) =>
      !RATE_TYPES.includes(d.type) ||
      (d.ratePerUnit !== "" && d.ratePerUnit !== undefined),
    { message: "ต้องระบุเรทต่อหน่วยสำหรับค่าไฟ/ค่าน้ำ", path: ["ratePerUnit"] }
  );
type FormValues = z.infer<typeof schema>;

export default function InvoiceSetupsPage() {
  const { apartmentId } = useParams<{ apartmentId: string }>();

  const [items, setItems] = useState<InvoiceSetup[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<InvoiceSetup | null>(null);
  const [deleting, setDeleting] = useState<InvoiceSetup | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodFormResolver<FormValues>(schema),
    defaultValues: {
      type: InvoiceType.RENT,
      cutOffDate: 25,
      issueDate: 26,
      dueDate: 5,
      effectiveFrom: "",
      effectiveTo: "",
      ratePerUnit: "",
      isActive: true,
    },
  });

  const watchType = form.watch("type");
  const needsRate = RATE_TYPES.includes(watchType);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(endpoints.invoiceSetups.list(apartmentId));
      setItems(toList<InvoiceSetup>(res).items);
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
      type: InvoiceType.RENT,
      cutOffDate: 25,
      issueDate: 26,
      dueDate: 5,
      effectiveFrom: "",
      effectiveTo: "",
      ratePerUnit: "",
      isActive: true,
    });
    setFormOpen(true);
  };

  const openEdit = (s: InvoiceSetup) => {
    setEditing(s);
    form.reset({
      type: s.type,
      cutOffDate: s.cutOffDate,
      issueDate: s.issueDate,
      dueDate: s.dueDate,
      effectiveFrom: s.effectiveFrom?.slice(0, 10) ?? "",
      effectiveTo: s.effectiveTo?.slice(0, 10) ?? "",
      ratePerUnit: s.ratePerUnit != null ? String(s.ratePerUnit) : "",
      isActive: s.isActive,
    });
    setFormOpen(true);
  };

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      if (editing) {
        await api.patch(endpoints.invoiceSetups.update(editing.id), {
          type: values.type,
          cutOffDate: values.cutOffDate,
          ratePerUnit:
            needsRate && values.ratePerUnit
              ? Number(values.ratePerUnit)
              : undefined,
        });
        toast.success("แก้ไขรูปแบบใบแจ้งหนี้สำเร็จ");
      } else {
        await api.post(endpoints.invoiceSetups.create(apartmentId), {
          type: values.type,
          cutOffDate: values.cutOffDate,
          issueDate: values.issueDate,
          dueDate: values.dueDate,
          effectiveFrom: values.effectiveFrom,
          effectiveTo: values.effectiveTo || undefined,
          isActive: values.isActive,
          ratePerUnit:
            needsRate && values.ratePerUnit
              ? Number(values.ratePerUnit)
              : undefined,
        });
        toast.success("เพิ่มรูปแบบใบแจ้งหนี้สำเร็จ");
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
      await api.delete(endpoints.invoiceSetups.remove(apartmentId, deleting.id));
      toast.success("ลบรูปแบบใบแจ้งหนี้สำเร็จ");
      load();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setDeleting(null);
    }
  };

  const columns: Column<InvoiceSetup>[] = [
    {
      key: "type",
      header: "ประเภท",
      cell: (s) => (
        <span className="font-medium text-gray-900">
          {INVOICE_TYPE_LABELS[s.type]}
        </span>
      ),
    },
    {
      key: "dates",
      header: "ตัดรอบ / ออกบิล / ครบกำหนด",
      cell: (s) => `${s.cutOffDate} / ${s.issueDate} / ${s.dueDate}`,
    },
    {
      key: "rate",
      header: "เรท/หน่วย",
      cell: (s) => (s.ratePerUnit != null ? formatCurrency(s.ratePerUnit) : "-"),
    },
    {
      key: "effective",
      header: "มีผล",
      cell: (s) =>
        `${formatDate(s.effectiveFrom)} - ${
          s.effectiveTo ? formatDate(s.effectiveTo) : "ไม่มีกำหนด"
        }`,
    },
    {
      key: "status",
      header: "สถานะ",
      cell: (s) =>
        s.isActive ? (
          <Badge variant="success">ใช้งาน</Badge>
        ) : (
          <Badge variant="outline">ปิด</Badge>
        ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      cell: (s) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => openEdit(s)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive"
            onClick={() => setDeleting(s)}
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
        title="รูปแบบใบแจ้งหนี้"
        description="กำหนดวันตัดรอบ ออกบิล ครบกำหนด และเรทค่าน้ำ-ค่าไฟ"
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            เพิ่มรูปแบบ
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={items}
        loading={loading}
        getRowId={(s) => s.id}
        emptyTitle="ยังไม่มีรูปแบบใบแจ้งหนี้"
        emptyDescription="เพิ่มรูปแบบเพื่อใช้สร้างรอบบิลอัตโนมัติ"
      />

      <Dialog open={formOpen} onOpenChange={(o) => !submitting && setFormOpen(o)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? "แก้ไขรูปแบบใบแจ้งหนี้" : "เพิ่มรูปแบบใบแจ้งหนี้"}
            </DialogTitle>
            <DialogDescription>
              ระบุประเภทและกำหนดการของใบแจ้งหนี้
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ประเภท</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(InvoiceType).map((t) => (
                          <SelectItem key={t} value={t}>
                            {INVOICE_TYPE_LABELS[t]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-3 gap-3">
                <FormField
                  control={form.control}
                  name="cutOffDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>วันตัดรอบ</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} max={31} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="issueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>วันออกบิล</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={31}
                          disabled={Boolean(editing)}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ครบกำหนด</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={31}
                          disabled={Boolean(editing)}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {needsRate && (
                <FormField
                  control={form.control}
                  name="ratePerUnit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>เรทต่อหน่วย (บาท)</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="effectiveFrom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>เริ่มมีผล</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          disabled={Boolean(editing)}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="effectiveTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>สิ้นสุด (ไม่บังคับ)</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          disabled={Boolean(editing)}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {!editing && (
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
              )}

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
        title="ลบรูปแบบใบแจ้งหนี้"
        description={`ต้องการลบรูปแบบ "${
          deleting ? INVOICE_TYPE_LABELS[deleting.type] : ""
        }" ใช่หรือไม่?`}
        confirmLabel="ลบ"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}
