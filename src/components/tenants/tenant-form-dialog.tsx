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
import { useT, type TranslateFn } from "@/i18n";
import type { Tenant } from "@/types";

const NO_ROOM = "none";

const makeSchema = (t: TranslateFn) =>
  z.object({
    firstNameTH: z.string().min(1, t("enter-first-name")),
    lastNameTH: z.string().min(1, t("enter-last-name")),
    email: z.string().email(t("email-invalid")),
    phone: z.string().min(9, t("phone-invalid")),
    roomId: z.string().optional(),
    monthlyRentOverride: z.string().optional(),
    depositAmount: z.string().optional(),
    contractStartDate: z.string().optional(),
    contractEndDate: z.string().optional(),
  });
type FormValues = z.infer<ReturnType<typeof makeSchema>>;

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
  defaultRoomId?: string;
  onSaved: () => void;
}

export function TenantFormDialog({
  open,
  onOpenChange,
  apartmentId,
  tenant,
  rooms,
  defaultRoomId,
  onSaved,
}: Props) {
  const t = useT();
  const isEdit = Boolean(tenant);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(makeSchema(t)),
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
      roomId: tenant?.roomId ?? defaultRoomId ?? NO_ROOM,
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
        toast.success(t("tenant-updated"));
      } else {
        await api.post(endpoints.tenants.create(), {
          firstNameTH: values.firstNameTH,
          lastNameTH: values.lastNameTH,
          email: values.email,
          phone: values.phone,
          apartmentId,
          roomId,
        });
        toast.success(t("tenant-added"));
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
          <DialogTitle>{isEdit ? t("edit-tenant") : t("add-tenant")}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? t("edit-tenant-description")
              : t("add-tenant-description")}
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
                    <FormLabel>{t("first-name")}</FormLabel>
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
                    <FormLabel>{t("last-name")}</FormLabel>
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
                  <FormLabel>{t("email")}</FormLabel>
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
                  <FormLabel>{t("phone")}</FormLabel>
                  <FormControl>
                    <Input placeholder="0812345678" {...field} />
                  </FormControl>
                  {!isEdit && (
                    <FormDescription>
                      {t("phone-temp-password-hint")}
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
                  <FormLabel>{t("room-unit")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("select-room-optional")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NO_ROOM}>
                        {t("no-room-assigned")}
                      </SelectItem>
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
                      <FormLabel>{t("special-monthly-rent")}</FormLabel>
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
                      <FormLabel>{t("deposit")}</FormLabel>
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
                      <FormLabel>{t("contract-start")}</FormLabel>
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
                      <FormLabel>{t("contract-end")}</FormLabel>
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
