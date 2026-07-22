"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { useT } from "@/i18n";
import { formatCurrency } from "@/lib/format";
import { zodFormResolver } from "@/lib/zod-resolver";
import { useTenantDepositActions } from "@/hooks/useTenantDeposits";
import { usePaymentAccounts } from "@/hooks/usePaymentAccounts";
import {
  makeSettleDepositSchema,
  type SettleDepositFormValues,
} from "@/schemas/settle-deposit.schema";
import type { TenantDeposit } from "@/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apartmentId: string;
  deposit: TenantDeposit | null;
}

const today = () => new Date().toISOString().slice(0, 10);

export function SettleDepositDialog({
  open,
  onOpenChange,
  apartmentId,
  deposit,
}: Props) {
  const t = useT();
  const { settle } = useTenantDepositActions(apartmentId);
  const { data: accounts = [] } = usePaymentAccounts(apartmentId);

  const amount = Number(deposit?.amount ?? 0);

  const form = useForm<SettleDepositFormValues>({
    resolver: zodFormResolver<SettleDepositFormValues>(
      makeSettleDepositSchema(t)
    ),
    defaultValues: {
      settledDate: today(),
      refundAmount: "",
      refundCategoryId: "",
      refundAccountId: "",
      forfeitCategoryId: "",
      forfeitAccountId: "",
      note: "",
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      settledDate: today(),
      refundAmount: "",
      refundCategoryId: "",
      refundAccountId: "",
      forfeitCategoryId: "",
      forfeitAccountId: "",
      note: "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, deposit?.id]);

  const refund = Number(form.watch("refundAmount")) || 0;
  const forfeit = Math.max(0, Math.round((amount - refund) * 100) / 100);

  const activeAccounts = useMemo(
    () => accounts.filter((a) => a.isActive),
    [accounts]
  );

  const onSubmit = (values: SettleDepositFormValues) => {
    if (!deposit) return;
    // หมวดมัดจำ backend resolve เอง (auto) — ส่งแค่บัญชี
    const payload = {
      settledDate: values.settledDate,
      refundAmount: refund,
      refundAccountId: refund > 0 ? values.refundAccountId : undefined,
      forfeitAccountId: forfeit > 0 ? values.forfeitAccountId : undefined,
      note: values.note || undefined,
    };
    settle.mutate(
      { depositId: deposit.id, payload },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !settle.isPending && onOpenChange(o)}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("settle-deposit")}</DialogTitle>
          <DialogDescription>
            {t("settle-deposit-description")}
          </DialogDescription>
        </DialogHeader>

        {/* สรุปยอด */}
        <div className="grid grid-cols-3 gap-2 rounded-lg bg-gray-50 p-3 text-center text-sm">
          <div>
            <p className="text-xs text-gray-500">{t("deposit-amount")}</p>
            <p className="font-semibold">{formatCurrency(amount)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">{t("refund")}</p>
            <p className="font-semibold text-red-600">
              {formatCurrency(refund)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">{t("forfeit")}</p>
            <p className="font-semibold text-emerald-600">
              {formatCurrency(forfeit)}
            </p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="refundAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("refund-amount")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={amount}
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
                name="settledDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("settled-date")}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* ส่วนคืน (expense) */}
            {refund > 0 && (
              <div className="space-y-3 rounded-lg border border-red-100 bg-red-50/40 p-3">
                <p className="text-xs font-semibold text-red-700">
                  {t("refund-section-hint")}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {/* หมวดมาจากระบบอัตโนมัติ — read-only เทา เลือกเองไม่ได้ */}
                  <FormItem>
                    <FormLabel>{t("category")}</FormLabel>
                    <FormControl>
                      <Input
                        readOnly
                        value={t("deposit-refund-category-name")}
                        className="cursor-not-allowed bg-muted font-medium text-foreground"
                      />
                    </FormControl>
                  </FormItem>
                  <FormField
                    control={form.control}
                    name="refundAccountId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("account")}</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("select-account")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {activeAccounts.map((acc) => (
                              <SelectItem key={acc.id} value={acc.id}>
                                {acc.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {/* ส่วนยึด (income) */}
            {forfeit > 0 && (
              <div className="space-y-3 rounded-lg border border-emerald-100 bg-emerald-50/40 p-3">
                <p className="text-xs font-semibold text-emerald-700">
                  {t("forfeit-section-hint")}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {/* หมวดมาจากระบบอัตโนมัติ — read-only เทา เลือกเองไม่ได้ */}
                  <FormItem>
                    <FormLabel>{t("category")}</FormLabel>
                    <FormControl>
                      <Input
                        readOnly
                        value={t("deposit-forfeit-category-name")}
                        className="cursor-not-allowed bg-muted font-medium text-foreground"
                      />
                    </FormControl>
                  </FormItem>
                  <FormField
                    control={form.control}
                    name="forfeitAccountId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("account")}</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("select-account")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {activeAccounts.map((acc) => (
                              <SelectItem key={acc.id} value={acc.id}>
                                {acc.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("note-optional")}</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
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
                disabled={settle.isPending}
              >
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={settle.isPending}>
                {settle.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {t("settle-deposit")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
