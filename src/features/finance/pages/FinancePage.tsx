"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useApartmentId } from "@/hooks/use-apartment-id";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Ban,
  ChevronDown,
  Download,
  Pencil,
  Plus,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { exportTableCsv } from "@/lib/export";
import { IconActionButton } from "@/components/shared/icon-action-button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { FilterBar } from "@/components/shared/filter-bar";
import { DataTable, type Column } from "@/components/shared/data-table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ALL } from "@/constants/config";
import {
  RecordTransactionDialog,
  type FinanceEntryDraft,
} from "@/features/finance/components/record-transaction-dialog";
import { FinanceControls } from "@/features/finance/components/finance-controls";
import { useIncomeActions, useIncomes } from "@/hooks/useIncomes";
import { useExpenseActions, useExpenses } from "@/hooks/useExpenses";
import { useAccountBalances, useFinanceSummary } from "@/hooks/useFinance";
import { useT } from "@/i18n";
import type { TranslateFn } from "@/i18n";
import { formatCurrency, formatDate } from "@/lib/format";
import { MONEY_ENTRY_STATUS_CODES, MoneyEntryStatus } from "@/types";
import type { Expense, Income } from "@/types";

type Period = "month" | "year" | "custom";

/** จำนวนรายการล่าสุดที่ดึงมาแสดงในตาราง (การ์ดสรุปใช้ยอดรวมจริงจาก API แยกต่างหาก) */
const TABLE_LIMIT = 50;

interface Row {
  kind: "income" | "expense";
  id: string;
  date: string;
  categoryName: string;
  accountName: string;
  invoiceId?: string | null;
  invoiceNumber?: string | null;
  reference?: string | null;
  amount: number;
  status: MoneyEntryStatus;
  /** หมวดหนี้สิน (เช่น มัดจำ) — ไม่นับในกำไร-ขาดทุน แสดงแยกในลิสต์ */
  isLiability: boolean;
  draft: FinanceEntryDraft;
}

/** รายการที่ระบบเคลียร์มัดจำสร้าง — แก้/ยกเลิกได้ผ่าน "กลับรายการ" ที่หน้ามัดจำเท่านั้น */
function isDepositEntry(ref?: string | null): boolean {
  return (
    !!ref &&
    (ref.startsWith("DEPOSIT-REFUND:") || ref.startsWith("DEPOSIT-FORFEIT:"))
  );
}

/** ข้อความคอลัมน์ "ที่มา" — ใช้ร่วมกันทั้งการ sort/export (text) และ cell (แสดงผล) */
function linkedInvoiceLabel(row: Row, t: TranslateFn): string {
  if (row.kind === "income" && row.invoiceId)
    return row.invoiceNumber ?? row.invoiceId.slice(0, 8);
  if (isDepositEntry(row.reference)) return t("from-deposit");
  if (row.kind === "expense") return "-";
  return t("manual-entry");
}

export function FinancePage() {
  const t = useT();
  const router = useRouter();
  const apartmentId = useApartmentId();

  const [period, setPeriod] = useState<Period>("month");
  const [accountFilter, setAccountFilter] = useState<string>(ALL);
  const [walletOpen, setWalletOpen] = useState(true);
  const [recordOpen, setRecordOpen] = useState(false);
  const [editing, setEditing] = useState<FinanceEntryDraft | null>(null);
  const [voiding, setVoiding] = useState<Row | null>(null);

  // period toggle → พารามิเตอร์ที่ส่งให้ API (month=YYYY-MM, year=YYYY, custom=ทั้งหมด)
  const apiPeriod = useMemo(() => {
    const iso = new Date().toISOString();
    if (period === "month") return iso.slice(0, 7);
    if (period === "year") return iso.slice(0, 4);
    return undefined;
  }, [period]);

  const listParams = {
    period: apiPeriod,
    limit: TABLE_LIMIT,
    accountId: accountFilter !== ALL ? accountFilter : undefined,
  };

  const { data: summary } = useFinanceSummary(apartmentId, {
    period: apiPeriod,
  });
  const { data: balances } = useAccountBalances(apartmentId);
  const {
    data: incData,
    isLoading: loadingIn,
    error: incomesError,
    refetch: refetchIncomes,
  } = useIncomes(apartmentId, listParams);
  const {
    data: exData,
    isLoading: loadingEx,
    error: expensesError,
    refetch: refetchExpenses,
  } = useExpenses(apartmentId, listParams);
  const income = useIncomeActions(apartmentId);
  const expense = useExpenseActions(apartmentId);

  const incomes = incData?.items ?? [];
  const expenses = exData?.items ?? [];

  const rows = useMemo<Row[]>(() => {
    const inRows: Row[] = incomes.map((i: Income) => ({
      kind: "income",
      id: i.id,
      date: i.paidDate,
      categoryName: i.category?.name ?? "-",
      accountName: i.account?.name ?? "-",
      invoiceId: i.invoiceId ?? null,
      invoiceNumber: i.invoice?.invoiceNumber ?? null,
      reference: i.reference ?? null,
      amount: Number(i.amount) || 0,
      status: i.status,
      isLiability: i.category?.isLiability ?? false,
      draft: {
        kind: "income",
        id: i.id,
        categoryId: i.categoryId,
        accountId: i.accountId,
        amount: String(i.amount ?? ""),
        date: i.paidDate,
        roomId: i.roomId,
        invoiceId: i.invoiceId,
        note: i.note,
      },
    }));
    const exRows: Row[] = expenses.map((e: Expense) => ({
      kind: "expense",
      id: e.id,
      date: e.expenseDate,
      categoryName: e.category?.name ?? "-",
      accountName: e.account?.name ?? "-",
      invoiceId: null,
      invoiceNumber: null,
      reference: e.reference ?? null,
      amount: Number(e.amount) || 0,
      status: e.status,
      isLiability: e.category?.isLiability ?? false,
      draft: {
        kind: "expense",
        id: e.id,
        categoryId: e.categoryId,
        accountId: e.accountId,
        amount: String(e.amount ?? ""),
        date: e.expenseDate,
        roomId: e.roomId,
        note: e.note,
      },
    }));
    return [...inRows, ...exRows].sort((a, b) =>
      a.date < b.date ? 1 : a.date > b.date ? -1 : 0
    );
  }, [incomes, expenses]);

  const totalCount =
    (incData?.meta?.total ?? incomes.length) +
    (exData?.meta?.total ?? expenses.length);
  const hasMore = totalCount > rows.length;

  const openCreate = useCallback(() => {
    setEditing(null);
    setRecordOpen(true);
  }, []);

  const openEdit = useCallback((row: Row) => {
    setEditing(row.draft);
    setRecordOpen(true);
  }, []);

  const handleVoid = useCallback(() => {
    if (!voiding) return;
    const done = { onSuccess: () => setVoiding(null) };
    if (voiding.kind === "income") income.voidEntry.mutate(voiding.id, done);
    else expense.voidEntry.mutate(voiding.id, done);
  }, [voiding, income, expense]);

  const periodLabel: Record<Period, string> = {
    month: t("period-monthly"),
    year: t("period-yearly"),
    custom: t("period-custom"),
  };

  const columns = useMemo<Column<Row>[]>(
    () => [
      {
        key: "date",
        header: t("date"),
        cell: (r) => formatDate(r.date),
      },
      {
        key: "category",
        header: t("category"),
        cell: (r) => (
          <div className="flex items-center gap-2">
            {r.kind === "income" ? (
              <ArrowUpCircle
                className={cn(
                  "h-4 w-4",
                  r.isLiability ? "text-gray-400" : "text-emerald-600"
                )}
              />
            ) : (
              <ArrowDownCircle
                className={cn(
                  "h-4 w-4",
                  r.isLiability ? "text-gray-400" : "text-red-600"
                )}
              />
            )}
            <span className="font-medium text-gray-900">{r.categoryName}</span>
            {r.isLiability && (
              <Badge variant="outline" className="text-gray-500">
                {t("liability-badge")}
              </Badge>
            )}
          </div>
        ),
      },
      {
        key: "account",
        header: t("account"),
        sortValue: (r) => r.accountName,
        cell: (r) => (
          <span className="whitespace-nowrap">
            <span className="text-xs text-gray-400">
              {r.kind === "income" ? t("wallet-in") : t("wallet-out")}
            </span>{" "}
            <span className="text-gray-700">{r.accountName}</span>
          </span>
        ),
      },
      {
        key: "linked-invoice",
        header: t("source"),
        hideOnMobile: true,
        sortValue: (r) => linkedInvoiceLabel(r, t),
        cell: (r) => {
          // จากบิล → เลขบิล (คลิกไปหน้าบิล)
          if (r.kind === "income" && r.invoiceId) {
            return (
              <button
                type="button"
                className="font-medium text-primary underline-offset-4 hover:underline"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(
                    `/apartments/${apartmentId}/invoices/${r.invoiceId}`
                  );
                }}
              >
                {linkedInvoiceLabel(r, t)}
              </button>
            );
          }
          // จากเคลียร์มัดจำ (ยึด/คืน) → ป้าย "จากมัดจำ" (คลิกไปหน้าเงินมัดจำ)
          if (isDepositEntry(r.reference)) {
            return (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/apartments/${apartmentId}/tenant-deposits`);
                }}
              >
                <Badge variant="outline" className="text-gray-500">
                  {t("from-deposit")}
                </Badge>
              </button>
            );
          }
          if (r.kind === "expense") return "-";
          return (
            <span className="text-gray-500">{linkedInvoiceLabel(r, t)}</span>
          );
        },
      },
      {
        key: "amount",
        header: t("amount"),
        className: "text-right",
        cell: (r) => (
          <span
            className={cn(
              "font-semibold tabular-nums",
              r.status === MoneyEntryStatus.VOID
                ? "text-gray-400 line-through"
                : r.isLiability
                  ? "text-gray-400"
                  : r.kind === "income"
                    ? "text-emerald-600"
                    : "text-red-600"
            )}
          >
            {r.kind === "income" ? "+" : "-"}
            {formatCurrency(r.amount)}
          </span>
        ),
      },
      {
        key: "status",
        header: t("status"),
        cell: (r) => (
          <Badge
            variant={
              r.status === MoneyEntryStatus.POSTED ? "success" : "outline"
            }
          >
            {t(MONEY_ENTRY_STATUS_CODES[r.status])}
          </Badge>
        ),
        hideOnMobile: true,
      },
      {
        key: "actions",
        header: "",
        className: "text-right",
        cell: (r) =>
          r.status === MoneyEntryStatus.POSTED ? (
            <div className="flex justify-end gap-1">
              <IconActionButton
                label={t("edit")}
                className="h-8 w-8"
                disabled={isDepositEntry(r.reference)}
                title={
                  isDepositEntry(r.reference)
                    ? t("deposit-entry-locked")
                    : undefined
                }
                onClick={() => openEdit(r)}
              >
                <Pencil className="h-4 w-4" />
              </IconActionButton>
              <IconActionButton
                label={t("void-transaction")}
                destructive
                className="h-8 w-8"
                disabled={isDepositEntry(r.reference)}
                title={
                  isDepositEntry(r.reference)
                    ? t("deposit-entry-locked")
                    : undefined
                }
                onClick={() => setVoiding(r)}
              >
                <Ban className="h-4 w-4" />
              </IconActionButton>
            </div>
          ) : null,
      },
    ],
    [t, openEdit, router, apartmentId]
  );

  const handleExportCsv = useCallback(() => {
    exportTableCsv("finance-transactions.csv", columns, rows);
  }, [columns, rows]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("nav-finance")}
        description={t("finance-page-description")}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportCsv}>
              <Download className="h-4 w-4" />
              {t("export-excel")}
            </Button>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              {t("record-transaction")}
            </Button>
          </div>
        }
      />

      <FilterBar
        filters={[
          {
            id: "account",
            node: (
              <Select value={accountFilter} onValueChange={setAccountFilter}>
                <SelectTrigger className="sm:w-48">
                  <SelectValue placeholder={t("account")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>{t("all-accounts")}</SelectItem>
                  {(balances?.accounts ?? []).map((acc) => (
                    <SelectItem key={acc.accountId} value={acc.accountId}>
                      {acc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ),
          },
        ]}
        onClear={() => setAccountFilter(ALL)}
        showClear={accountFilter !== ALL}
        actions={
          <div className="inline-flex gap-1 rounded-lg bg-gray-100 p-1">
            {(["month", "year", "custom"] as Period[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={cn(
                  "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
                  period === p
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-700"
                )}
              >
                {periodLabel[p]}
              </button>
            ))}
          </div>
        }
      />

      {/* Summary cards — ยอดรวมจริงจาก API (aggregate ใน DB) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label={t("total-income")}
          value={formatCurrency(summary?.totalIncome ?? 0)}
          icon={<ArrowUpCircle className="h-5 w-5" />}
          tone="income"
        />
        <SummaryCard
          label={t("total-expense")}
          value={formatCurrency(summary?.totalExpense ?? 0)}
          icon={<ArrowDownCircle className="h-5 w-5" />}
          tone="expense"
        />
        <SummaryCard
          label={t("net-profit")}
          value={formatCurrency(summary?.net ?? 0)}
          icon={<TrendingUp className="h-5 w-5" />}
          tone={(summary?.net ?? 0) >= 0 ? "income" : "expense"}
        />
        <SummaryCard
          label={t("collection-rate")}
          value={
            summary?.collectionRate != null
              ? `${summary.collectionRate}%`
              : "—"
          }
          icon={<Wallet className="h-5 w-5" />}
          tone="neutral"
        />
      </div>

      {/* ยอดคงเหลือแต่ละกระเป๋าเงิน — การ์ดแนวนอน (wrap) เงินจริงในบัญชี (รวมมัดจำ ≠ กำไร-ขาดทุน) */}
      {balances && balances.accounts.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <button
            type="button"
            onClick={() => setWalletOpen((v) => !v)}
            className="flex w-full items-center gap-2"
            aria-expanded={walletOpen}
          >
            <Wallet className="h-4 w-4 text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-700">
              {t("wallet-balances")}
            </h3>
            <ChevronDown
              className={cn(
                "ml-auto h-4 w-4 text-gray-400 transition-transform",
                walletOpen ? "" : "-rotate-90"
              )}
            />
          </button>
          <div
            className={cn(
              "grid transition-[grid-template-rows] duration-300 ease-in-out",
              walletOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
            )}
          >
            <div className="min-h-0 overflow-hidden">
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {balances.accounts.map((acc) => (
              <BalanceChip
                key={acc.accountId}
                label={acc.name}
                value={acc.balance}
              />
            ))}
            <BalanceChip
              label={t("total-balance")}
              value={balances.totalBalance}
              highlight
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {t("wallet-balances-hint")}
          </p>
            </div>
          </div>
        </div>
      )}

      {/* Transactions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">
            {t("recent-transactions")}
          </h3>
          {hasMore && (
            <span className="text-xs text-gray-400">
              {t("showing-latest", {
                shown: String(rows.length),
                total: String(totalCount),
              })}
            </span>
          )}
        </div>
        <DataTable
          columns={columns}
          data={rows}
          loading={loadingIn || loadingEx}
          error={incomesError ?? expensesError}
          onRetry={() => {
            refetchIncomes();
            refetchExpenses();
          }}
          getRowId={(r) => `${r.kind}-${r.id}`}
          emptyTitle={t("no-transactions")}
          emptyDescription={t("no-transactions-description")}
        />
        {rows.some((r) => r.isLiability) && (
          <p className="mt-2 text-xs text-muted-foreground">
            {t("liability-note")}
          </p>
        )}
      </div>

      {/* ล็อกงวด + ประวัติล่าสุด (ต่อ API จริง) */}
      <FinanceControls apartmentId={apartmentId} />

      <RecordTransactionDialog
        open={recordOpen}
        onOpenChange={setRecordOpen}
        apartmentId={apartmentId}
        editing={editing}
      />

      <ConfirmDialog
        open={Boolean(voiding)}
        onOpenChange={(o) => !o && setVoiding(null)}
        title={t("void-transaction")}
        description={t("void-transaction-description")}
        confirmLabel={t("void-confirm")}
        destructive
        onConfirm={handleVoid}
      />
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone: "income" | "expense" | "neutral";
}) {
  const toneClass =
    tone === "income"
      ? "text-emerald-600 bg-emerald-50"
      : tone === "expense"
        ? "text-red-600 bg-red-50"
        : "text-gray-500 bg-gray-100";
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">{label}</span>
        <span className={cn("rounded-lg p-1.5", toneClass)}>{icon}</span>
      </div>
      <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

/** การ์ดยอดกระเป๋าเงิน 1 ใบ — highlight=true สำหรับการ์ด "รวม" */
function BalanceChip({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-2",
        highlight
          ? "border-emerald-200 bg-emerald-50"
          : "border-gray-100 bg-gray-50/60"
      )}
    >
      <p
        className={cn(
          "truncate text-xs",
          highlight ? "font-medium text-emerald-700" : "text-gray-500"
        )}
        title={label}
      >
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 text-base font-bold tabular-nums",
          value < 0
            ? "text-red-600"
            : highlight
              ? "text-emerald-700"
              : "text-gray-900"
        )}
      >
        {formatCurrency(value)}
      </p>
    </div>
  );
}
