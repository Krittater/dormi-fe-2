"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useApartmentId } from "@/hooks/use-apartment-id";
import { useFilterParams } from "@/hooks/use-filter-params";
import { useQueries } from "@tanstack/react-query";
import { Plus, Send, FileDown, X, Check } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pagination } from "@/components/ui/pagination";
import { FilterBar } from "@/components/shared/filter-bar";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column, type SortDirection } from "@/components/shared/data-table";
import { exportTableCsv } from "@/lib/export";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { InvoiceFormDialog } from "@/features/invoice/components/invoice-form-dialog";
import { ALL, DEFAULT_PAGE_SIZE, DROPDOWN_LIMIT } from "@/constants/config";
import {
  useBillingActions,
  useBillingPeriodDropdown,
} from "@/hooks/useBillingPeriods";
import { useInvoices } from "@/hooks/useInvoices";
import { useT } from "@/i18n";
import { formatCurrency, formatDate, daysUntil } from "@/lib/format";
import { totalPagesOf } from "@/lib/list";
import { cn } from "@/lib/utils";
import { formatBillingPeriodName } from "@/utils/billing";
import { invoiceQueries } from "@/queries/invoice.query";
import { INVOICE_STATUS_CODES, InvoiceStatus } from "@/types";
import type { Invoice } from "@/types";

const STATUS_CARDS: InvoiceStatus[] = [
  InvoiceStatus.DRAFT,
  InvoiceStatus.UNPAID,
  InvoiceStatus.PARTIAL,
  InvoiceStatus.OVERDUE,
  InvoiceStatus.PAID,
  InvoiceStatus.CANCELLED,
];

const STATUS_TEXT: Record<InvoiceStatus, string> = {
  [InvoiceStatus.DRAFT]: "text-gray-600",
  [InvoiceStatus.UNPAID]: "text-amber-600",
  [InvoiceStatus.PARTIAL]: "text-blue-600",
  [InvoiceStatus.OVERDUE]: "text-red-600",
  [InvoiceStatus.PAID]: "text-green-600",
  [InvoiceStatus.CANCELLED]: "text-gray-400",
};

const EMPTY_INVOICES: Invoice[] = [];
const EMPTY_PERIODS: Array<{
  id: string;
  name?: string;
  periodYear?: number;
  periodMonth?: number;
}> = [];

export function InvoicesPage() {
  const t = useT();
  const apartmentId = useApartmentId();
  const router = useRouter();

  const { values, setValue, hasActiveFilters } = useFilterParams({
    defaults: { status: ALL, q: "", page: "1", period: "" },
    debounceKeys: ["q"],
  });
  const status = values.status;
  const invoiceNumber = values.q;
  const page = Math.max(1, Number(values.page) || 1);
  const periodFromUrl = values.period;

  const [formOpen, setFormOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmPublish, setConfirmPublish] = useState(false);
  const [sortKey, setSortKey] = useState<string | null>("number");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const { data: periodOptionsData } = useBillingPeriodDropdown(apartmentId, {
    type: "RENT",
    limit: DROPDOWN_LIMIT,
  });
  const periodOptions = periodOptionsData ?? EMPTY_PERIODS;

  const periodApplied = useMemo(() => {
    if (periodFromUrl) return periodFromUrl;
    return periodOptions[0]?.id ?? "";
  }, [periodFromUrl, periodOptions]);

  const { data, isLoading, error, refetch, dataUpdatedAt } = useInvoices(apartmentId, {
    page,
    limit: DEFAULT_PAGE_SIZE,
    status: status === ALL ? undefined : status,
    invoiceNumber: invoiceNumber || undefined,
    billingPeriodId: periodApplied || undefined,
  });

  const items = data?.items ?? EMPTY_INVOICES;
  const meta = data?.meta;

  useEffect(() => {
    setSelectedIds([]);
  }, [dataUpdatedAt]);

  const summaryQueries = useQueries({
    queries: useMemo(
      () => [
        {
          ...invoiceQueries.list(apartmentId, {
            page: 1,
            limit: 1,
            billingPeriodId: periodApplied || undefined,
          }),
          enabled: Boolean(apartmentId) && Boolean(periodApplied),
        },
        ...STATUS_CARDS.map((s) => ({
          ...invoiceQueries.list(apartmentId, {
            page: 1,
            limit: 1,
            billingPeriodId: periodApplied || undefined,
            status: s,
          }),
          enabled: Boolean(apartmentId) && Boolean(periodApplied),
        })),
      ],
      [apartmentId, periodApplied]
    ),
  });

  const summaryTotal = summaryQueries[0]?.data?.meta?.total ?? 0;
  const counts = useMemo(() => {
    const c: Partial<Record<InvoiceStatus, number>> = {};
    STATUS_CARDS.forEach((s, i) => {
      c[s] = summaryQueries[i + 1]?.data?.meta?.total ?? 0;
    });
    return c;
  }, [
    summaryQueries[0]?.dataUpdatedAt,
    summaryQueries[1]?.dataUpdatedAt,
    summaryQueries[2]?.dataUpdatedAt,
    summaryQueries[3]?.dataUpdatedAt,
    summaryQueries[4]?.dataUpdatedAt,
    summaryQueries[5]?.dataUpdatedAt,
  ]);

  const { publishSelectedInvoices } = useBillingActions(apartmentId);

  const handleRowClick = useCallback(
    (invoice: Invoice) => {
      router.push(`/apartments/${apartmentId}/invoices/${invoice.id}`);
    },
    [apartmentId, router]
  );

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const selectedDrafts = useMemo(
    () =>
      items.filter(
        (i) =>
          selectedIds.includes(i.id) &&
          i.status === InvoiceStatus.DRAFT &&
          i.billingPeriodId
      ),
    [items, selectedIds]
  );

  const openPublishConfirm = useCallback(() => {
    if (selectedDrafts.length === 0) {
      toast.error(t("no-draft-selected"));
      return;
    }
    setConfirmPublish(true);
  }, [selectedDrafts.length, t]);

  const handlePublish = useCallback(() => {
    const byPeriod = new Map<string, string[]>();
    for (const inv of selectedDrafts) {
      const pid = inv.billingPeriodId as string;
      byPeriod.set(pid, [...(byPeriod.get(pid) ?? []), inv.id]);
    }
    const groups = [...byPeriod.entries()].map(([billingPeriodId, invoiceIds]) => ({
      billingPeriodId,
      invoiceIds,
    }));

    publishSelectedInvoices.mutate(groups, {
      onSuccess: () => {
        toast.success(t("publish-success", { n: selectedDrafts.length }));
        setSelectedIds([]);
        setConfirmPublish(false);
        refetch();
      },
    });
  }, [publishSelectedInvoices, refetch, selectedDrafts, t]);

  const handleExportPdf = useCallback(() => {
    toast.info(t("pdf-coming-soon"));
  }, [t]);

  const handleSortChange = useCallback(
    (key: string) => {
      if (sortKey === key) {
        setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortKey(key);
        setSortDirection("asc");
      }
    },
    [sortKey]
  );

  const selectStatusFilter = useCallback(
    (value: string) => {
      setValue("page", "1");
      setValue("status", value);
    },
    [setValue]
  );

  const columns = useMemo<Column<Invoice>[]>(
    () => [
      {
        key: "select",
        header: t("select"),
        className: "w-10 shrink-0",
        cell: (i) => (
          <Checkbox
            checked={selectedIds.includes(i.id)}
            onCheckedChange={() => toggleSelect(i.id)}
            onClick={(e) => e.stopPropagation()}
            aria-label={t("select")}
          />
        ),
      },
      {
        key: "number",
        header: t("invoice-number"),
        sortable: true,
        sortValue: (i) => i.invoiceNumber ?? i.id,
        className: "min-w-[9rem] whitespace-nowrap",
        cell: (i) => (
          <span
            className="block truncate font-medium text-gray-900"
            title={i.invoiceNumber ?? undefined}
          >
            {i.invoiceNumber ?? i.id.slice(0, 8)}
          </span>
        ),
      },
      {
        key: "room",
        header: t("room"),
        className: "min-w-[4.5rem] max-w-[5.5rem]",
        cell: (i) => (
          <span className="block truncate" title={i.roomName ?? undefined}>
            {i.roomName ?? "-"}
          </span>
        ),
      },
      {
        key: "tenant",
        header: t("tenant"),
        className: "min-w-[5.5rem] max-w-[8rem]",
        cell: (i) => (
          <span className="block truncate" title={i.tenantName ?? undefined}>
            {i.tenantName ?? "-"}
          </span>
        ),
      },
      {
        key: "createdAt",
        header: t("created-at"),
        hideOnMobile: true,
        className: "hidden whitespace-nowrap xl:table-cell",
        cell: (i) => formatDate(i.createdAt),
      },
      {
        key: "updatedBy",
        header: t("updated-by-col"),
        hideOnMobile: true,
        className: "hidden min-w-[6.5rem] max-w-[9rem] xl:table-cell",
        cell: (i) => (
          <span className="block truncate" title={i.updatedByName ?? undefined}>
            {i.updatedByName ?? "-"}
          </span>
        ),
      },
      {
        key: "due",
        header: t("due"),
        className: "min-w-[7.5rem]",
        cell: (i) => {
          const d = daysUntil(i.dueDate);
          const showHint =
            d != null &&
            (i.status === InvoiceStatus.UNPAID ||
              i.status === InvoiceStatus.OVERDUE);
          return (
            <div className="leading-snug">
              <div>{formatDate(i.dueDate)}</div>
              {showHint && (
                <div
                  className={
                    d < 0
                      ? "text-xs text-destructive"
                      : d <= 3
                        ? "text-xs text-warning"
                        : "text-xs text-gray-400"
                  }
                >
                  {d < 0
                    ? t("overdue-by-days", { n: Math.abs(d) })
                    : d === 0
                      ? t("due-today")
                      : t("due-in-days", { n: d })}
                </div>
              )}
            </div>
          );
        },
      },
      {
        key: "total",
        header: t("total"),
        sortable: true,
        sortValue: (i) => i.total ?? 0,
        className: "min-w-[6rem] whitespace-nowrap text-right",
        cell: (i) => formatCurrency(i.total),
      },
      {
        key: "issued",
        header: t("column-issued"),
        className: "w-28 shrink-0 whitespace-nowrap",
        cell: (i) => {
          const issued =
            i.status !== InvoiceStatus.DRAFT &&
            i.status !== InvoiceStatus.CANCELLED;
          return issued ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
              <Check className="h-3 w-3 shrink-0" />
              {t("issued")}
            </span>
          ) : (
            <span className="text-xs text-gray-400">{t("not-issued")}</span>
          );
        },
      },
      {
        key: "status",
        header: t("status"),
        className: "w-28 shrink-0 whitespace-nowrap",
        cell: (i) => <StatusBadge kind="invoice" value={i.status} />,
      },
    ],
    [selectedIds, t, toggleSelect]
  );

  const handleExportCsv = useCallback(() => {
    exportTableCsv("invoices.csv", columns, items);
  }, [columns, items]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("nav-invoices")}
        description={t("invoices-page-description")}
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" />
            {t("create-invoice")}
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <button
          type="button"
          onClick={() => selectStatusFilter(ALL)}
          className={cn(
            "rounded-xl border bg-white px-4 py-3 text-left transition hover:shadow-sm",
            status === ALL
              ? "border-primary ring-1 ring-primary"
              : "border-gray-200"
          )}
        >
          <p className="text-xs text-gray-500">{t("all-statuses")}</p>
          <p className="text-2xl font-bold text-gray-900">{summaryTotal}</p>
        </button>
        {STATUS_CARDS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => selectStatusFilter(s)}
            className={cn(
              "rounded-xl border bg-white px-4 py-3 text-left transition hover:shadow-sm",
              status === s
                ? "border-primary ring-1 ring-primary"
                : "border-gray-200"
            )}
          >
            <p className="text-xs text-gray-500">
              {t(INVOICE_STATUS_CODES[s])}
            </p>
            <p className={cn("text-2xl font-bold", STATUS_TEXT[s])}>
              {counts[s] ?? 0}
            </p>
          </button>
        ))}
      </div>

      <FilterBar
        filters={[
          {
            id: "period",
            node: (
              <Select
                value={periodApplied}
                onValueChange={(v) => {
                  setValue("page", "1");
                  setValue("period", v);
                }}
                disabled={periodOptions.length === 0}
              >
                <SelectTrigger className="w-full sm:w-56">
                  <SelectValue placeholder={t("billing-period")} />
                </SelectTrigger>
                <SelectContent>
                  {periodOptions.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {formatBillingPeriodName(p.name, p, t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ),
          },
          {
            id: "status",
            node: (
              <Select
                value={status}
                onValueChange={(v) => {
                  setValue("page", "1");
                  setValue("status", v);
                }}
              >
                <SelectTrigger className="sm:w-48">
                  <SelectValue placeholder={t("status")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>{t("all-statuses")}</SelectItem>
                  {Object.values(InvoiceStatus).map((s) => (
                    <SelectItem key={s} value={s}>
                      {t(INVOICE_STATUS_CODES[s])}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ),
          },
        ]}
        search={{
          value: invoiceNumber,
          onChange: (v) => {
            setValue("page", "1");
            setValue("q", v);
          },
          placeholder: t("search-invoice-number"),
        }}
        onClear={() => {
          setValue("page", "1");
          setValue("q", "");
          setValue("status", ALL);
        }}
        showClear={hasActiveFilters && (invoiceNumber !== "" || status !== ALL)}
        actions={
          <Button variant="outline" size="sm" onClick={handleExportCsv}>
            <FileDown className="h-4 w-4" />
            {t("export-csv")}
          </Button>
        }
      />

      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
          <span className="text-sm font-medium text-gray-900">
            {t("selected-count", { n: selectedIds.length })}
          </span>
          <div className="flex flex-wrap gap-2 sm:ml-auto">
            <Button
              size="sm"
              onClick={openPublishConfirm}
              disabled={publishSelectedInvoices.isPending}
            >
              <Send className="h-4 w-4" />
              {t("publish-to-unpaid")}
            </Button>
            <Button size="sm" variant="outline" onClick={handleExportPdf}>
              <FileDown className="h-4 w-4" />
              {t("export-pdf")}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setSelectedIds([])}
            >
              <X className="h-4 w-4" />
              {t("clear-selection")}
            </Button>
          </div>
        </div>
      )}

      <DataTable
        columns={columns}
        data={items}
        loading={isLoading}
        error={error}
        onRetry={() => refetch()}
        tableClassName="min-w-[1080px]"
        getRowId={(i) => i.id}
        onRowClick={handleRowClick}
        emptyTitle={t("no-invoices")}
        emptyDescription={t("no-invoices-description")}
        stickyHeader
        sortKey={sortKey}
        sortDirection={sortDirection}
        onSortChange={handleSortChange}
      />

      <Pagination
        page={page}
        totalPages={totalPagesOf(meta, items.length, DEFAULT_PAGE_SIZE)}
        onPageChange={(p) => setValue("page", String(p))}
      />

      <InvoiceFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        apartmentId={apartmentId}
        onSuccess={() => {
          setFormOpen(false);
          refetch();
        }}
      />

      <ConfirmDialog
        open={confirmPublish}
        onOpenChange={setConfirmPublish}
        title={t("confirm-issue-title")}
        description={t("confirm-issue-description", {
          n: selectedDrafts.length,
        })}
        confirmLabel={t("publish-to-unpaid")}
        onConfirm={handlePublish}
      />
    </div>
  );
}
