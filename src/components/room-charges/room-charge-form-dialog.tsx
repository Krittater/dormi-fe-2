"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
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
import { zodFormResolver } from "@/lib/zod-resolver";
import { getApiErrorMessage } from "@/lib/format";
import type { ChargeType, RoomCharge } from "@/types";

interface RoomOption {
  id: string;
  name: string;
}

const schema = z.object({
  roomId: z.string().min(1, "กรุณาเลือกห้อง"),
  chargeTypeId: z.string().min(1, "กรุณาเลือกประเภทค่าใช้จ่าย"),
  amount: z.coerce.number({ message: "กรุณากรอกตัวเลข" }).min(0, "ต้องไม่ติดลบ"),
  unit: z.string().optional(),
  description: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apartmentId: string;
  charge?: RoomCharge | null;
  rooms: RoomOption[];
  chargeTypes: ChargeType[];
  onSaved: () => void;
}

export function RoomChargeFormDialog({
  open,
  onOpenChange,
  apartmentId,
  charge,
  rooms,
  chargeTypes,
  onSaved,
}: Props) {
  const isEdit = Boolean(charge);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodFormResolver<FormValues>(schema),
    defaultValues: {
      roomId: "",
      chargeTypeId: "",
      amount: 0,
      unit: "",
      description: "",
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      roomId: charge?.roomId ?? "",
      chargeTypeId: charge?.chargeTypeId ?? "",
      amount: charge?.amount ?? 0,
      unit: charge?.unit != null ? String(charge.unit) : "",
      description: charge?.description ?? "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, charge]);

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    const payload = {
      roomId: values.roomId,
      chargeTypeId: values.chargeTypeId,
      amount: values.amount,
      unit: values.unit ? Number(values.unit) : undefined,
      description: values.description || undefined,
    };
    try {
      if (isEdit && charge) {
        await api.patch(endpoints.roomCharges.update(apartmentId, charge.id), {
          amount: values.amount,
          unit: values.unit ? Number(values.unit) : null,
          description: values.description || undefined,
        });
        toast.success("แก้ไขค่าใช้จ่ายสำเร็จ");
      } else {
        await api.post(endpoints.roomCharges.create(apartmentId), payload);
        toast.success("เพิ่มค่าใช้จ่ายสำเร็จ");
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "แก้ไขค่าใช้จ่ายห้อง" : "เพิ่มค่าใช้จ่ายห้อง"}
          </DialogTitle>
          <DialogDescription>
            ผูกประเภทค่าใช้จ่ายเข้ากับห้องเพื่อเรียกเก็บประจำงวด
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="roomId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ห้อง</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isEdit}
                  >
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
              name="chargeTypeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ประเภทค่าใช้จ่าย</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isEdit}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกประเภท" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {chargeTypes.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ยอดเรียกเก็บ</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>จำนวนหน่วย (ไม่บังคับ)</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>คำอธิบาย (ไม่บังคับ)</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
