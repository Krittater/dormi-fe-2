"use client";

import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodFormResolver } from "@/lib/zod-resolver";
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
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { getApiErrorMessage } from "@/lib/format";
import type { Apartment } from "@/types";

const dayField = z.coerce
  .number({ message: "กรุณากรอกตัวเลข" })
  .int()
  .min(1, "ระหว่าง 1-31")
  .max(31, "ระหว่าง 1-31");
const rateField = z.coerce
  .number({ message: "กรุณากรอกตัวเลข" })
  .min(0, "ต้องไม่ติดลบ");

const roomTypeSchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อประเภทห้อง"),
  price: z.coerce.number({ message: "กรุณากรอกตัวเลข" }).positive("ราคาต้องมากกว่า 0"),
  description: z.string().optional(),
});

const baseSchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อหอพัก"),
  province: z.string().min(1, "กรุณากรอกจังหวัด"),
  district: z.string().min(1, "กรุณากรอกอำเภอ/เขต"),
  subDistrict: z.string().min(1, "กรุณากรอกตำบล/แขวง"),
  postalCode: z.string().min(1, "กรุณากรอกรหัสไปรษณีย์"),
  phone: z.string().optional(),
  description: z.string().optional(),
  invoiceCutOffDate: dayField,
  invoiceDueDate: dayField,
  electricityCutOffDate: dayField,
  electricityRatePerUnit: rateField,
  waterCutOffDate: dayField,
  waterRatePerUnit: rateField,
});

const createSchema = baseSchema.extend({
  roomTypes: z.array(roomTypeSchema).min(1, "ต้องมีประเภทห้องอย่างน้อย 1 ประเภท"),
});

type CreateValues = z.infer<typeof createSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apartment?: Apartment | null;
  onSaved: (apartment: Apartment) => void;
}

export function ApartmentFormDialog({
  open,
  onOpenChange,
  apartment,
  onSaved,
}: Props) {
  const isEdit = Boolean(apartment);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<CreateValues>({
    resolver: zodFormResolver<CreateValues>(isEdit ? baseSchema : createSchema),
    defaultValues: {
      name: "",
      province: "",
      district: "",
      subDistrict: "",
      postalCode: "",
      phone: "",
      description: "",
      invoiceCutOffDate: 1,
      invoiceDueDate: 5,
      electricityCutOffDate: 1,
      electricityRatePerUnit: 0,
      waterCutOffDate: 1,
      waterRatePerUnit: 0,
      roomTypes: [{ name: "", price: 0, description: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "roomTypes",
  });

  useEffect(() => {
    if (open) {
      if (apartment) {
        form.reset({
          name: apartment.name,
          province: apartment.province,
          district: apartment.district,
          subDistrict: apartment.subDistrict,
          postalCode: apartment.postalCode,
          phone: apartment.phone ?? "",
          description: apartment.description ?? "",
          invoiceCutOffDate: apartment.invoiceCutOffDate,
          invoiceDueDate: apartment.invoiceDueDate,
          electricityCutOffDate: apartment.electricityCutOffDate,
          electricityRatePerUnit: apartment.electricityRatePerUnit,
          waterCutOffDate: apartment.waterCutOffDate,
          waterRatePerUnit: apartment.waterRatePerUnit,
          roomTypes: [{ name: "", price: 0, description: "" }],
        });
      } else {
        form.reset({
          name: "",
          province: "",
          district: "",
          subDistrict: "",
          postalCode: "",
          phone: "",
          description: "",
          invoiceCutOffDate: 1,
          invoiceDueDate: 5,
          electricityCutOffDate: 1,
          electricityRatePerUnit: 0,
          waterCutOffDate: 1,
          waterRatePerUnit: 0,
          roomTypes: [{ name: "", price: 0, description: "" }],
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, apartment]);

  const onSubmit = async (values: CreateValues) => {
    setSubmitting(true);
    try {
      let result: Apartment;
      if (isEdit && apartment) {
        const { roomTypes: _omit, ...payload } = values;
        void _omit;
        result = await api.patch<Apartment>(
          endpoints.apartments.update(apartment.id),
          payload
        );
        toast.success("แก้ไขหอพักสำเร็จ");
      } else {
        result = await api.post<Apartment>(
          endpoints.apartments.create(),
          values
        );
        toast.success("สร้างหอพักสำเร็จ");
      }
      onSaved(result ?? { ...(apartment ?? {}), ...values, id: apartment?.id ?? "" });
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
          <DialogTitle>{isEdit ? "แก้ไขหอพัก" : "เพิ่มหอพักใหม่"}</DialogTitle>
          <DialogDescription>
            กรอกข้อมูลหอพัก อัตราค่าน้ำ-ค่าไฟ และวันตัดรอบบิล
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>ชื่อหอพัก</FormLabel>
                    <FormControl>
                      <Input placeholder="เช่น Dormi Residence" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="province"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>จังหวัด</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="district"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>อำเภอ/เขต</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="subDistrict"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ตำบล/แขวง</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="postalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>รหัสไปรษณีย์</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>เบอร์โทรศัพท์ (ไม่บังคับ)</FormLabel>
                    <FormControl>
                      <Input placeholder="0812345678" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>คำอธิบาย (ไม่บังคับ)</FormLabel>
                    <FormControl>
                      <Textarea rows={2} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />
            <div>
              <h3 className="mb-3 text-sm font-semibold text-gray-900">
                อัตราค่าบริการและวันตัดรอบ
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="invoiceCutOffDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>วันตัดรอบบิล</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} max={31} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="invoiceDueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>วันครบกำหนดชำระ</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} max={31} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="electricityCutOffDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>วันตัดมิเตอร์ไฟ</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} max={31} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="electricityRatePerUnit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ค่าไฟ/หน่วย (บาท)</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="waterCutOffDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>วันตัดมิเตอร์น้ำ</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} max={31} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="waterRatePerUnit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ค่าน้ำ/หน่วย (บาท)</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {!isEdit && (
              <>
                <Separator />
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900">
                      ประเภทห้อง
                    </h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        append({ name: "", price: 0, description: "" })
                      }
                    >
                      <Plus className="h-4 w-4" />
                      เพิ่มประเภท
                    </Button>
                  </div>
                  {form.formState.errors.roomTypes?.root && (
                    <p className="mb-2 text-xs font-medium text-destructive">
                      {form.formState.errors.roomTypes.root.message}
                    </p>
                  )}
                  <div className="space-y-3">
                    {fields.map((fieldRow, index) => (
                      <div
                        key={fieldRow.id}
                        className="rounded-lg border border-gray-200 bg-gray-50 p-3"
                      >
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
                          <FormField
                            control={form.control}
                            name={`roomTypes.${index}.name`}
                            render={({ field }) => (
                              <FormItem className="sm:col-span-5">
                                <FormLabel>ชื่อประเภท</FormLabel>
                                <FormControl>
                                  <Input placeholder="Standard" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`roomTypes.${index}.price`}
                            render={({ field }) => (
                              <FormItem className="sm:col-span-3">
                                <FormLabel>ราคา/เดือน</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`roomTypes.${index}.description`}
                            render={({ field }) => (
                              <FormItem className="sm:col-span-3">
                                <FormLabel>คำอธิบาย</FormLabel>
                                <FormControl>
                                  <Input {...field} />
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
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

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
                {isEdit ? "บันทึก" : "สร้างหอพัก"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
