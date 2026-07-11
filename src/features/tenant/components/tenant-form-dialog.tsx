"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Copy, KeyRound, Loader2 } from "lucide-react";
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
import { NO_ROOM } from "@/constants/config";
import { useTenantActions } from "@/hooks/useTenants";
import { useT } from "@/i18n";
import { zodFormResolver } from "@/lib/zod-resolver";
import {
  makeTenantSchema,
  type TenantFormValues,
} from "@/schemas/tenant.schema";
import type { Tenant } from "@/types";

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
  onSuccess?: () => void;
}

export function TenantFormDialog({
  open,
  onOpenChange,
  apartmentId,
  tenant,
  rooms,
  defaultRoomId,
  onSuccess,
}: Props) {
  const t = useT();
  const isEdit = Boolean(tenant);
  const { create, update } = useTenantActions(apartmentId);
  const submitting = create.isPending || update.isPending;
  const [credentials, setCredentials] = useState<{
    email: string;
    password: string;
  } | null>(null);

  const form = useForm<TenantFormValues>({
    resolver: zodFormResolver<TenantFormValues>(makeTenantSchema(t)),
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
      firstNameTH: tenant?.user.firstNameTH ?? "",
      lastNameTH: tenant?.user.lastNameTH ?? "",
      email: tenant?.user.email ?? "",
      phone: tenant?.user.phone ?? "",
      roomId: tenant?.roomId ?? defaultRoomId ?? NO_ROOM,
      monthlyRentOverride:
        tenant?.monthlyRentOverride != null
          ? String(tenant.monthlyRentOverride)
          : "",
      depositAmount:
        tenant?.depositAmount != null ? String(tenant.depositAmount) : "",
      contractStartDate: tenant?.contractStartDate?.slice(0, 10) ?? "",
      contractEndDate: tenant?.contractEndDate?.slice(0, 10) ?? "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tenant]);

  const onSubmit = (values: TenantFormValues) => {
    const roomId = values.roomId === NO_ROOM ? undefined : values.roomId;

    if (isEdit && tenant) {
      update.mutate(
        {
          tenantId: tenant.tenantId,
          payload: {
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
        firstNameTH: values.firstNameTH,
        lastNameTH: values.lastNameTH,
        email: values.email,
        phone: values.phone,
        apartmentId,
        roomId,
      },
      {
        onSuccess: (result) => {
          onSuccess?.();
          onOpenChange(false);
          // บัญชีใหม่ → แสดงรหัสผ่านชั่วคราวใน dialog (toast หายเร็วเกินไป)
          if (result?.userCreated) {
            setCredentials({
              email: values.email,
              password: result.phone || values.phone,
            });
          }
        },
      }
    );
  };

  const copyCredential = useCallback(
    async (value: string) => {
      try {
        await navigator.clipboard.writeText(value);
        toast.success(t("copied"));
      } catch {
        // clipboard API ใช้ไม่ได้ (บาง webview/ไม่มี permission) — fallback วิธีเก่า
        try {
          const ta = document.createElement("textarea");
          ta.value = value;
          ta.style.position = "fixed";
          ta.style.opacity = "0";
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          ta.remove();
          toast.success(t("copied"));
        } catch {
          toast.error(t("generic-error"));
        }
      }
    },
    [t]
  );

  return (
    <>
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

    {/* แสดงรหัสผ่านชั่วคราวของบัญชีที่เพิ่งสร้าง — คงอยู่จนผู้ใช้ปิดเอง */}
    <Dialog
      open={Boolean(credentials)}
      onOpenChange={(o) => !o && setCredentials(null)}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            {t("tenant-credentials-title")}
          </DialogTitle>
          <DialogDescription>
            {t("tenant-credentials-description")}
          </DialogDescription>
        </DialogHeader>
        {credentials && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{t("email")}</p>
                <p className="truncate text-sm font-medium text-gray-900">
                  {credentials.email}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => copyCredential(credentials.email)}
              >
                <Copy className="h-4 w-4" />
                {t("copy")}
              </Button>
            </div>
            <div className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">
                  {t("temp-password")}
                </p>
                <p className="truncate font-mono text-sm font-medium text-gray-900">
                  {credentials.password}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => copyCredential(credentials.password)}
              >
                <Copy className="h-4 w-4" />
                {t("copy")}
              </Button>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button type="button" onClick={() => setCredentials(null)}>
            {t("close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
