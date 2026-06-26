"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { getApiErrorMessage } from "@/lib/format";
import type { Tenant } from "@/types";

const NO_ROOM = "none";

const schema = z.object({
  firstNameTH: z.string().min(1, "กรุณากรอกชื่อ"),
  lastNameTH: z.string().min(1, "กรุณากรอกนามสกุล"),
  email: z.string().email("รูปแบบอีเมลไม่ถูกต้อง"),
  phone: z.string().min(9, "เบอร์โทรศัพท์ไม่ถูกต้อง"),
  roomId: z.string().optional(),
  monthlyRentOverride: z.string().optional(),
  depositAmount: z.string().optional(),
  contractStartDate: z.string().optional(),
  contractEndDate: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

interface RoomOption {
  id: string;
  name: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apartmentId: string;
  tenant?: Tenant | null;
  rooms: RoomOption[];
  onSaved: () => void;
}

export function TenantFormDialog({
  open,
  onOpenChange,
  apartmentId,
  tenant,
  rooms,
  onSaved,
}: Props) {
  const isEdit = Boolean(tenant);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstNameTH: "",
      lastNameTH: "",
      email: "",
      phone: "",
      roomId: NO_ROOM,
      monthlyRentOverride: "",
      depositAmount: "",
      contractStartDate: "",
      contractEndDate: "",
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      firstNameTH: tenant?.firstNameTH ?? "",
      lastNameTH: tenant?.lastNameTH ?? "",
      email: tenant?.email ?? "",
      phone: tenant?.phone ?? "",
      roomId: tenant?.roomId ?? NO_ROOM,
      monthlyRentOverride: "",
      depositAmount: tenant?.deposit != null ? String(tenant.deposit) : "",
      contractStartDate: tenant?.contractStartDate?.slice(0, 10) ?? "",
      contractEndDate: tenant?.contractEndDate?.slice(0, 10) ?? "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tenant]);

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const roomId = values.roomId === NO_ROOM ? undefined : values.roomId;
      if (isEdit && tenant) {
        await api.patch(endpoints.tenants.updateById(tenant.id), {
          firstNameTH: values.firstNameTH,
          lastNameTH: values.lastNameTH,
          email: values.email,
          phone: values.phone,
          roomId: values.roomId === NO_ROOM ? null : roomId,
          monthlyRentOverride: values.monthlyRentOverride
            ? Number(values.monthlyRentOverride)
            : undefined,
          depositAmount: values.depositAmount
            ? Number(values.depositAmount)
            : undefined,
          contractStartDate: values.contractStartDate || undefined,
          contractEndDate: values.contractEndDate || undefined,
        });
        toast.success("แก้ไขผู้เช่าสำเร็จ");
      } else {
        await api.post(endpoints.tenants.create(), {
          firstNameTH: values.firstNameTH,
          lastNameTH: values.lastNameTH,
          email: values.email,
          phone: values.phone,
          apartmentId,
          roomId,
        });
        toast.success("เพิ่มผู้เช่าสำเร็จ");
      }
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "แก้ไขผู้เช่า" : "เพิ่มผู้เช่า"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "ปรับปรุงข้อมูลผู้เช่าและสัญญา"
              : "หากอีเมลยังไม่มีในระบบ จะสร้างบัญชีใหม่โดยใช้เบอร์โทรเป็นรหัสผ่านชั่วคราว"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="firstNameTH"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ชื่อ</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastNameTH"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>นามสกุล</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>อีเมล</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
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
                  <FormLabel>เบอร์โทรศัพท์</FormLabel>
                  <FormControl>
                    <Input placeholder="0812345678" {...field} />
                  </FormControl>
                  {!isEdit && (
                    <FormDescription>
                      ใช้เป็นรหัสผ่านชั่วคราวสำหรับผู้ใช้ใหม่
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="roomId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ห้องพัก</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกห้อง (ไม่บังคับ)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NO_ROOM}>ยังไม่ระบุห้อง</SelectItem>
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

            {isEdit && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="monthlyRentOverride"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ค่าเช่าพิเศษ/เดือน</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="depositAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>เงินมัดจำ</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contractStartDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>เริ่มสัญญา</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contractEndDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>สิ้นสุดสัญญา</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
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
                บันทึก
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
