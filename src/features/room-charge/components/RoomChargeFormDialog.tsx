"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2 } from "lucide-react";

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
import { useRoomChargeActions } from "@/hooks/useChargeTypes";
import { useT, type TranslateFn } from "@/i18n";
import { zodFormResolver } from "@/lib/zod-resolver";
import type { ChargeType, RoomCharge } from "@/types";

interface RoomOption {
  id: string;
  name: string;
}

const makeSchema = (t: TranslateFn) =>
  z.object({
    roomId: z.string().min(1, t("please-select-room")),
    chargeTypeId: z.string().min(1, t("please-select-charge-type")),
    amount: z.coerce
      .number({ message: t("enter-a-number") })
      .min(0, t("must-not-be-negative")),
    unit: z.string().optional(),
    description: z.string().optional(),
  });
type FormValues = z.infer<ReturnType<typeof makeSchema>>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apartmentId: string;
  charge?: RoomCharge | null;
  rooms: RoomOption[];
  chargeTypes: ChargeType[];
  defaultRoomId?: string;
  onSuccess?: () => void;
}

export function RoomChargeFormDialog({
  open,
  onOpenChange,
  apartmentId,
  charge,
  rooms,
  chargeTypes,
  defaultRoomId,
  onSuccess,
}: Props) {
  const t = useT();
  const isEdit = Boolean(charge);
  const lockRoom = isEdit || Boolean(defaultRoomId);
  const { create, update } = useRoomChargeActions(apartmentId);
  const submitting = create.isPending || update.isPending;

  const form = useForm<FormValues>({
    resolver: zodFormResolver<FormValues>(makeSchema(t)),
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
      roomId: charge?.roomId ?? defaultRoomId ?? "",
      chargeTypeId: charge?.chargeTypeId ?? "",
      amount: charge?.amount ?? 0,
      unit: charge?.unit != null ? String(charge.unit) : "",
      description: charge?.description ?? "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, charge, defaultRoomId]);

  const handleChargeTypeChange = (value: string) => {
    form.setValue("chargeTypeId", value, { shouldValidate: true });
    const selected = chargeTypes.find((c) => c.id === value);
    if (selected?.defaultAmount != null) {
      form.setValue("amount", selected.defaultAmount, { shouldValidate: true });
    }
  };

  const onSubmit = (values: FormValues) => {
    if (isEdit && charge) {
      update.mutate(
        {
          chargeId: charge.id,
          payload: {
            amount: values.amount,
            unit: values.unit ? Number(values.unit) : null,
            description: values.description || undefined,
          },
        },
        {
          onSuccess: () => {
            onSuccess?.();
            onOpenChange(false);
          },
        }
      );
      return;
    }

    create.mutate(
      {
        roomId: values.roomId,
        chargeTypeId: values.chargeTypeId,
        amount: values.amount,
        unit: values.unit ? Number(values.unit) : undefined,
        description: values.description || undefined,
      },
      {
        onSuccess: () => {
          onSuccess?.();
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !submitting && onOpenChange(o)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t("edit-room-charge") : t("add-room-charge")}
          </DialogTitle>
          <DialogDescription>{t("room-charge-form-description")}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="roomId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("room")}</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={lockRoom}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("select-room")} />
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
                  <FormLabel>{t("nav-charge-types")}</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={handleChargeTypeChange}
                    disabled={isEdit}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("select-type")} />
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
                    <FormLabel>{t("charge-amount")}</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} step="0.01" {...field} disabled/>
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
                    <FormLabel>{t("unit-count-optional")}</FormLabel>
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
                  <FormLabel>{t("description-optional")}</FormLabel>
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
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {t("save")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
