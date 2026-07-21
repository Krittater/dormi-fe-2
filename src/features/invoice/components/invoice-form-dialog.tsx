"use client";

import { useEffect, useMemo } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { Loader2, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { IconActionButton } from "@/components/shared/icon-action-button";
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
import { MANUAL } from "@/constants/config";
import {
  useInvoiceActions,
  useInvoiceFormDropdowns,
} from "@/hooks/useInvoices";
import { useT } from "@/i18n";
import { zodFormResolver } from "@/lib/zod-resolver";
import {
  makeInvoiceSchema,
  type InvoiceFormValues,
} from "@/schemas/invoice.schema";
import { INVOICE_ITEM_TYPE_CODES, InvoiceItemType } from "@/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apartmentId: string;
  onSuccess?: () => void;
}

const defaultValues: InvoiceFormValues = {
  billingPeriodId: "",
  roomId: "",
  tenantId: "",
  issuedDate: new Date().toISOString().slice(0, 10),
  dueDate: "",
  billType: MANUAL,
  items: [
    {
      itemType: InvoiceItemType.RENT,
      description: "",
      quantity: 1,
      unitPrice: 0,
    },
  ],
};

export function InvoiceFormDialog({
  open,
  onOpenChange,
  apartmentId,
  onSuccess,
}: Props) {
  const t = useT();
  const { create } = useInvoiceActions(apartmentId);
  const { data: dropdowns } = useInvoiceFormDropdowns(apartmentId, open);

  const form = useForm<InvoiceFormValues>({
    resolver: zodFormResolver<InvoiceFormValues>(makeInvoiceSchema(t)),
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const periods = useMemo(
    () =>
      (dropdowns?.periods ?? []).map((p) => ({
        id: p.id,
        name: p.name,
      })),
    [dropdowns?.periods]
  );

  const rooms = useMemo(
    () =>
      (dropdowns?.rooms ?? []).map((r) => ({
        id: r.roomId ?? r.id ?? "",
        name: r.name,
      })),
    [dropdowns?.rooms]
  );

  const tenants = dropdowns?.tenants ?? [];
  const billTypes = dropdowns?.billTypes ?? [];

  // periods ถูกกรองเป็นรอบ RENT ที่ OPEN เรียงใหม่สุดก่อนแล้ว → ตัวแรก = รอบปัจจุบัน
  const currentPeriod = periods[0] ?? null;

  // ล็อกรอบบิลเป็นรอบ RENT ปัจจุบัน (ผู้ใช้แก้เองไม่ได้)
  useEffect(() => {
    form.setValue("billingPeriodId", currentPeriod?.id ?? "", {
      shouldValidate: true,
    });
  }, [currentPeriod, form]);

  const selectedRoomId = form.watch("roomId");

  // ผู้เช่าปัจจุบันของห้องที่เลือก — 1 ห้องปกติมีผู้เช่า active เดียว
  // ถ้ามีมากกว่า 1 (DB ไม่กัน) เลือกคนที่ moveInDate ล่าสุด
  const roomTenant = useMemo(() => {
    if (!selectedRoomId) return null;
    return (
      tenants
        .filter((tn) => tn.roomId === selectedRoomId && tn.isActive)
        .sort((a, b) =>
          (b.moveInDate ?? "").localeCompare(a.moveInDate ?? "")
        )[0] ?? null
    );
  }, [tenants, selectedRoomId]);

  const roomTenantName = roomTenant
    ? [
        roomTenant.user?.firstNameTH ?? roomTenant.firstNameTH,
        roomTenant.user?.lastNameTH ?? roomTenant.lastNameTH,
      ]
        .filter(Boolean)
        .join(" ")
        .trim()
    : "";

  // เลือกห้อง → ล็อกผู้เช่าตามห้องอัตโนมัติ (ผู้ใช้แก้เองไม่ได้)
  useEffect(() => {
    form.setValue("tenantId", roomTenant?.tenantId ?? "", {
      shouldValidate: true,
    });
  }, [roomTenant, form]);

  useEffect(() => {
    if (!open) return;
    form.reset({
      ...defaultValues,
      issuedDate: new Date().toISOString().slice(0, 10),
    });
  }, [open, form]);

  const onSubmit = (values: InvoiceFormValues) => {
    create.mutate(
      {
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
    <Dialog
      open={open}
      onOpenChange={(o) => !create.isPending && onOpenChange(o)}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("create-invoice")}</DialogTitle>
          <DialogDescription>
            {t("create-invoice-description")}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="billingPeriodId"
                render={() => (
                  <FormItem>
                    <FormLabel>{t("nav-billing-periods")}</FormLabel>
                    <FormControl>
                      {/* ล็อกเป็นรอบ RENT ปัจจุบัน — อ่านอย่างเดียว (เทา) เลือกเองไม่ได้ */}
                      <Input
                        readOnly
                        value={currentPeriod?.name ?? ""}
                        placeholder={t("no-current-billing-period")}
                        className="cursor-not-allowed bg-muted font-medium text-foreground"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="billType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("bill-type")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("select-bill-type")} />
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
                    <FormLabel>{t("room")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
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
                name="tenantId"
                render={() => (
                  <FormItem>
                    <FormLabel>{t("tenant")}</FormLabel>
                    <FormControl>
                      {/* ล็อกตามห้อง — อ่านอย่างเดียว (เทา) แก้เองไม่ได้ */}
                      <Input
                        readOnly
                        value={roomTenantName}
                        placeholder={
                          selectedRoomId
                            ? t("no-tenant-in-room")
                            : t("select-room-first")
                        }
                        className="cursor-not-allowed bg-muted font-medium text-foreground"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="issuedDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("issue-date")}</FormLabel>
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
                    <FormLabel>{t("due-date")}</FormLabel>
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
                  {t("items")}
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
                  {t("add-item")}
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
                          <FormLabel>{t("type")}</FormLabel>
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
                              {Object.values(InvoiceItemType).map((it) => (
                                <SelectItem key={it} value={it}>
                                  {t(INVOICE_ITEM_TYPE_CODES[it])}
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
                          <FormLabel>{t("details")}</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`items.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem className="sm:col-span-2">
                          <FormLabel>{t("quantity")}</FormLabel>
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
                          <FormLabel>{t("unit-price")}</FormLabel>
                          <FormControl>
                            <Input type="number" min={0} step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex items-end sm:col-span-1">
                      <IconActionButton
                        type="button"
                        label={t("remove-row")}
                        destructive
                        disabled={fields.length <= 1}
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </IconActionButton>
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
                disabled={create.isPending}
              >
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={create.isPending}>
                {create.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {t("create-invoice")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
