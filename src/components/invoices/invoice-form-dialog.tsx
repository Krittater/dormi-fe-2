"use client";

import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { toList } from "@/lib/list";
import { zodFormResolver } from "@/lib/zod-resolver";
import { getApiErrorMessage } from "@/lib/format";
import {
  INVOICE_ITEM_TYPE_LABELS,
  InvoiceItemType,
} from "@/types";
import type { BillTypeDropdownItem, Tenant } from "@/types";

interface Option {
  id: string;
  name: string;
}

const schema = z.object({
  billingPeriodId: z.string().min(1, "กรุณาเลือกรอบบิล"),
  roomId: z.string().min(1, "กรุณาเลือกห้อง"),
  tenantId: z.string().min(1, "กรุณาเลือกผู้เช่า"),
  issuedDate: z.string().min(1, "กรุณาเลือกวันออกบิล"),
  dueDate: z.string().min(1, "กรุณาเลือกวันครบกำหนด"),
  billType: z.string().optional(),
  items: z
    .array(
      z.object({
        itemType: z.nativeEnum(InvoiceItemType),
        description: z.string().optional(),
        quantity: z.coerce.number().min(0.01, "ต้องมากกว่า 0"),
        unitPrice: z.coerce.number().min(0, "ต้องไม่ติดลบ"),
      })
    )
    .min(1, "ต้องมีรายการอย่างน้อย 1 รายการ"),
});
type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apartmentId: string;
  onSaved: () => void;
}

export function InvoiceFormDialog({
  open,
  onOpenChange,
  apartmentId,
  onSaved,
}: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [periods, setPeriods] = useState<Option[]>([]);
  const [rooms, setRooms] = useState<Option[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [billTypes, setBillTypes] = useState<BillTypeDropdownItem[]>([]);

  const form = useForm<FormValues>({
    resolver: zodFormResolver<FormValues>(schema),
    defaultValues: {
      billingPeriodId: "",
      roomId: "",
      tenantId: "",
      issuedDate: new Date().toISOString().slice(0, 10),
      dueDate: "",
      billType: "MANUAL",
      items: [
        { itemType: InvoiceItemType.RENT, description: "", quantity: 1, unitPrice: 0 },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      billingPeriodId: "",
      roomId: "",
      tenantId: "",
      issuedDate: new Date().toISOString().slice(0, 10),
      dueDate: "",
      billType: "MANUAL",
      items: [
        { itemType: InvoiceItemType.RENT, description: "", quantity: 1, unitPrice: 0 },
      ],
    });
    api
      .get(endpoints.billingPeriods.dropdown(apartmentId))
      .then((res) => {
        const list = toList<{ id?: string; billingPeriodId?: string; name?: string; label?: string }>(
          res
        ).items;
        setPeriods(
          list.map((p) => ({
            id: p.id ?? p.billingPeriodId ?? "",
            name: p.name ?? p.label ?? "",
          }))
        );
      })
      .catch(() => undefined);
    api
      .get(endpoints.rooms.dropdown(apartmentId))
      .then((res) => {
        const list = toList<{ roomId?: string; id?: string; name: string }>(
          res
        ).items;
        setRooms(list.map((r) => ({ id: r.roomId ?? r.id ?? "", name: r.name })));
      })
      .catch(() => undefined);
    api
      .get(endpoints.tenants.list(apartmentId))
      .then((res) => setTenants(toList<Tenant>(res).items))
      .catch(() => undefined);
    api
      .get(endpoints.invoices.billTypeDropdown(apartmentId))
      .then((res) => setBillTypes(toList<BillTypeDropdownItem>(res).items))
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, apartmentId]);

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      await api.post(endpoints.invoices.create(apartmentId), {
        billingPeriodId: values.billingPeriodId,
        roomId: values.roomId,
        tenantId: values.tenantId,
        issuedDate: values.issuedDate,
        dueDate: values.dueDate,
        billType: values.billType || undefined,
        items: values.items.map((it) => ({
          itemType: it.itemType,
          description: it.description || undefined,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
        })),
      });
      toast.success("สร้างใบแจ้งหนี้สำเร็จ");
      onSaved();
      onOpenChange(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !submitting && onOpenChange(o)}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>สร้างใบแจ้งหนี้</DialogTitle>
          <DialogDescription>
            ออกใบแจ้งหนี้เพิ่มเติมให้ผู้เช่าในรอบบิลที่เลือก
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="billingPeriodId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>รอบบิล</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="เลือกรอบบิล" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {periods.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
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
                name="billType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ประเภทบิล</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="เลือกประเภทบิล" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {billTypes.map((b) => (
                          <SelectItem key={b.code} value={b.code}>
                            {b.name}
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
                name="roomId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ห้อง</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="เลือกห้อง" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {rooms.map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.name}
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
                name="tenantId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ผู้เช่า</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="เลือกผู้เช่า" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {tenants.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.firstNameTH} {t.lastNameTH}
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
                name="issuedDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>วันออกบิล</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
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
                    <FormLabel>วันครบกำหนด</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">
                  รายการ
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    append({
                      itemType: InvoiceItemType.OTHER,
                      description: "",
                      quantity: 1,
                      unitPrice: 0,
                    })
                  }
                >
                  <Plus className="h-4 w-4" />
                  เพิ่มรายการ
                </Button>
              </div>
              {form.formState.errors.items?.root && (
                <p className="mb-2 text-xs font-medium text-destructive">
                  {form.formState.errors.items.root.message}
                </p>
              )}
              <div className="space-y-3">
                {fields.map((row, index) => (
                  <div
                    key={row.id}
                    className="grid grid-cols-1 gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 sm:grid-cols-12"
                  >
                    <FormField
                      control={form.control}
                      name={`items.${index}.itemType`}
                      render={({ field }) => (
                        <FormItem className="sm:col-span-3">
                          <FormLabel>ประเภท</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.values(InvoiceItemType).map((t) => (
                                <SelectItem key={t} value={t}>
                                  {INVOICE_ITEM_TYPE_LABELS[t]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`items.${index}.description`}
                      render={({ field }) => (
                        <FormItem className="sm:col-span-4">
                          <FormLabel>รายละเอียด</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`items.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem className="sm:col-span-2">
                          <FormLabel>จำนวน</FormLabel>
                          <FormControl>
                            <Input type="number" min={0} step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`items.${index}.unitPrice`}
                      render={({ field }) => (
                        <FormItem className="sm:col-span-2">
                          <FormLabel>ราคา/หน่วย</FormLabel>
                          <FormControl>
                            <Input type="number" min={0} step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex items-end sm:col-span-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        disabled={fields.length <= 1}
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                ยกเลิก
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                สร้างใบแจ้งหนี้
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
