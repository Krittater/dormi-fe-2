"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
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
import { cn } from "@/lib/utils";
import { useT } from "@/i18n";
import { zodFormResolver } from "@/lib/zod-resolver";
import { useIncomeActions } from "@/hooks/useIncomes";
import { useExpenseActions } from "@/hooks/useExpenses";
import { usePaymentAccounts } from "@/hooks/usePaymentAccounts";
import { useTransactionCategories } from "@/hooks/useTransactionCategories";
import { useRoomDropdown } from "@/hooks/useRooms";
import { useInvoices } from "@/hooks/useInvoices";
import { formatCurrency } from "@/lib/format";
import {
  makeTransactionSchema,
  type TransactionFormValues,
} from "@/schemas/transaction.schema";
import { InvoiceStatus, TransactionCategoryType } from "@/types";
import type { Invoice } from "@/types";

/** รายการรวม (income/expense) ที่ตารางส่งมาแก้ไข */
export interface FinanceEntryDraft {
  kind: "income" | "expense";
  id: string;
  categoryId: string;
  accountId: string;
  amount: string;
  date: string;
  roomId?: string | null;
  note?: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apartmentId: string;
  editing?: FinanceEntryDraft | null;
  /** เปิดในโหมด "รับชำระบิล" — ล็อกเป็นรายรับ + ผูกบิลนี้ + เติมยอดค้าง */
  presetInvoice?: Invoice | null;
}

const today = () => new Date().toISOString().slice(0, 10);

export function RecordTransactionDialog({
  open,
  onOpenChange,
  apartmentId,
  editing,
  presetInvoice,
}: Props) {
  const t = useT();

  const presetOutstanding = presetInvoice
    ? (Number(presetInvoice.total) || 0) -
      (Number(presetInvoice.paidAmount) || 0)
    : 0;

  const { data: accounts = [] } = usePaymentAccounts(apartmentId);
  const { data: categories = [] } = useTransactionCategories(apartmentId);
  const { data: rooms = [] } = useRoomDropdown(apartmentId);
  const { data: invData } = useInvoices(apartmentId, { limit: 100 });

  // โหมดรับชำระบิล: ชื่อห้องมาจากบิล (ล็อก แก้ไม่ได้) — fallback หาจาก dropdown
  const presetRoomName = presetInvoice
    ? presetInvoice.roomName ??
      rooms.find((r) => r.id === presetInvoice.roomId)?.name ??
      ""
    : "";

  const income = useIncomeActions(apartmentId);
  const expense = useExpenseActions(apartmentId);
  const submitting =
    income.create.isPending ||
    income.update.isPending ||
    expense.create.isPending ||
    expense.update.isPending;

  const form = useForm<TransactionFormValues>({
    resolver: zodFormResolver<TransactionFormValues>(makeTransactionSchema(t)),
    defaultValues: {
      type: TransactionCategoryType.INCOME,
      categoryId: "",
      accountId: "",
      amount: "",
      date: today(),
      roomId: "",
      invoiceId: "",
      note: "",
    },
  });

  const selectedType = form.watch("type");

  useEffect(() => {
    if (!open) return;
    if (presetInvoice) {
      // โหมดรับชำระบิล — ล็อกรายรับ + ผูกบิล + เติมยอดค้าง
      form.reset({
        type: TransactionCategoryType.INCOME,
        categoryId: "",
        accountId: "",
        amount: presetOutstanding > 0 ? String(presetOutstanding) : "",
        date: today(),
        roomId: presetInvoice.roomId ?? "",
        invoiceId: presetInvoice.id,
        note: "",
      });
    } else if (editing) {
      form.reset({
        type:
          editing.kind === "income"
            ? TransactionCategoryType.INCOME
            : TransactionCategoryType.EXPENSE,
        categoryId: editing.categoryId,
        accountId: editing.accountId,
        amount: String(editing.amount ?? ""),
        date: editing.date?.slice(0, 10) ?? today(),
        roomId: editing.roomId ?? "",
        invoiceId: "",
        note: editing.note ?? "",
      });
    } else {
      form.reset({
        type: TransactionCategoryType.INCOME,
        categoryId: "",
        accountId: "",
        amount: "",
        date: today(),
        roomId: "",
        invoiceId: "",
        note: "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing, presetInvoice?.id]);

  const typeCategories = useMemo(
    () => categories.filter((c) => c.type === selectedType && c.isActive),
    [categories, selectedType]
  );

  const activeAccounts = useMemo(
    () => accounts.filter((a) => a.isActive),
    [accounts]
  );

  // บิลที่ยังชำระได้ (สำหรับ "รับชำระบิล")
  const payableInvoices = useMemo(
    () =>
      (invData?.items ?? []).filter((i) =>
        [
          InvoiceStatus.UNPAID,
          InvoiceStatus.PARTIAL,
          InvoiceStatus.OVERDUE,
        ].includes(i.status)
      ),
    [invData]
  );

  const outstandingOf = (inv: {
    total: number;
    paidAmount?: number | string;
  }) => (Number(inv.total) || 0) - (Number(inv.paidAmount) || 0);

  const onPickInvoice = (invoiceId: string) => {
    form.setValue("invoiceId", invoiceId);
    const inv = payableInvoices.find((i) => i.id === invoiceId);
    if (inv) {
      const outstanding = outstandingOf(inv);
      if (outstanding > 0) form.setValue("amount", String(outstanding));
    }
  };

  const missingSetup = activeAccounts.length === 0 || categories.length === 0;

  const setType = (next: TransactionCategoryType) => {
    if (next === selectedType) return;
    form.setValue("type", next);
    form.setValue("categoryId", ""); // หมวดคนละชนิด → ล้าง
  };

  const onSubmit = (values: TransactionFormValues) => {
    const isIncome = values.type === TransactionCategoryType.INCOME;
    const base = {
      categoryId: values.categoryId,
      accountId: values.accountId,
      amount: Number(values.amount),
      roomId: values.roomId || undefined,
      note: values.note || undefined,
    };

    if (isIncome) {
      const payload = {
        ...base,
        paidDate: values.date,
        invoiceId: values.invoiceId || undefined,
      };
      if (editing) {
        income.update.mutate(
          { incomeId: editing.id, payload },
          { onSuccess: () => onOpenChange(false) }
        );
      } else {
        income.create.mutate(payload, {
          onSuccess: () => onOpenChange(false),
        });
      }
      return;
    }

    const payload = { ...base, expenseDate: values.date };
    if (editing) {
      expense.update.mutate(
        { expenseId: editing.id, payload },
        { onSuccess: () => onOpenChange(false) }
      );
    } else {
      expense.create.mutate(payload, { onSuccess: () => onOpenChange(false) });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !submitting && onOpenChange(o)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {presetInvoice
              ? `${t("receive-payment")}${
                  presetInvoice.invoiceNumber
                    ? ` · ${presetInvoice.invoiceNumber}`
                    : ""
                }`
              : editing
                ? t("edit-transaction")
                : t("record-transaction")}
          </DialogTitle>
          <DialogDescription>
            {presetInvoice
              ? `${t("outstanding")} ${formatCurrency(presetOutstanding)}`
              : t("record-transaction-description")}
          </DialogDescription>
        </DialogHeader>

        {/* Toggle รายรับ / รายจ่าย — ซ่อนในโหมดรับชำระบิล */}
        {!presetInvoice && (
          <div className="grid grid-cols-2 gap-2 rounded-lg bg-gray-100 p-1">
            <button
              type="button"
              disabled={Boolean(editing)}
              onClick={() => setType(TransactionCategoryType.INCOME)}
              className={cn(
                "rounded-md py-2 text-sm font-medium transition-colors",
                selectedType === TransactionCategoryType.INCOME
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-gray-500",
                editing && "cursor-not-allowed opacity-60"
              )}
            >
              {t("income")}
            </button>
            <button
              type="button"
              disabled={Boolean(editing)}
              onClick={() => setType(TransactionCategoryType.EXPENSE)}
              className={cn(
                "rounded-md py-2 text-sm font-medium transition-colors",
                selectedType === TransactionCategoryType.EXPENSE
                  ? "bg-white text-red-700 shadow-sm"
                  : "text-gray-500",
                editing && "cursor-not-allowed opacity-60"
              )}
            >
              {t("expense")}
            </button>
          </div>
        )}

        {missingSetup ? (
          <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <p>{t("finance-setup-required")}</p>
            <div className="flex gap-2">
              <Link href={`/apartments/${apartmentId}/payment-accounts`}>
                <Button variant="outline" size="sm">
                  {t("nav-payment-accounts")}
                </Button>
              </Link>
              <Link href={`/apartments/${apartmentId}/transaction-categories`}>
                <Button variant="outline" size="sm">
                  {t("nav-transaction-categories")}
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("category")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("select-category")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {typeCategories.map((c) => (
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
              {!editing &&
                !presetInvoice &&
                selectedType === TransactionCategoryType.INCOME &&
                payableInvoices.length > 0 && (
                  <FormField
                    control={form.control}
                    name="invoiceId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("pay-invoice-optional")}</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={onPickInvoice}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("select-invoice")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {payableInvoices.map((inv) => (
                              <SelectItem key={inv.id} value={inv.id}>
                                {(inv.invoiceNumber ?? inv.id.slice(0, 8)) +
                                  " · " +
                                  t("outstanding") +
                                  " " +
                                  formatCurrency(outstandingOf(inv))}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              <FormField
                control={form.control}
                name="accountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("account")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("select-account")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {activeAccounts.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("amount-baht")}</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("date")}</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="roomId"
                render={({ field }) =>
                  presetInvoice ? (
                    <FormItem>
                      <FormLabel>{t("room")}</FormLabel>
                      <FormControl>
                        {/* ห้องมาจากบิล — read-only เทา ห้ามแก้ */}
                        <Input
                          readOnly
                          value={presetRoomName}
                          className="cursor-not-allowed bg-muted font-medium text-foreground"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  ) : (
                    <FormItem>
                      <FormLabel>{t("room-optional")}</FormLabel>
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
                  )
                }
              />
              <FormField
                control={form.control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("note-optional")}</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={2}
                        placeholder={t("note-placeholder")}
                        {...field}
                      />
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
                  {t("record-transaction")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
