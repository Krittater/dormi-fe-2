"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useApartmentId } from "@/hooks/use-apartment-id";
import { ChevronRight, Download, Info } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { FilterBar } from "@/components/shared/filter-bar";
import {
  DataTable,
  type Column,
  sortTableData,
  type SortDirection,
} from "@/components/shared/data-table";
import { exportTableCsv } from "@/lib/export";
import { StatusBadge } from "@/components/shared/status-badge";
import { ALL } from "@/constants/config";
import { MONTH_CODES } from "@/constants/months";
import {
  useBillingPeriodSetups,
  useBillingPeriods,
} from "@/hooks/useBillingPeriods";
import { useT } from "@/i18n";
import { filterBillingPeriodsByTab } from "@/utils/billing";
import {
  BILLING_PERIOD_TYPE_CODES,
  BillingPeriodStatus,
} from "@/types";
import type { BillingPeriod } from "@/types";

export function BillingPeriodsPage() {
  const t = useT();
  const apartmentId = useApartmentId();
  const router = useRouter();

  const [tab, setTab] = useState<string>(ALL);
  const [sortKey, setSortKey] = useState<string | null>("period");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const {
    data: items = [],
    isLoading,
    error,
    refetch,
  } = useBillingPeriods(apartmentId);
  const { data: setups = [], isLoading: setupsLoading } =
    useBillingPeriodSetups(apartmentId);

  const filtered = useMemo(
    () => filterBillingPeriodsByTab(items, tab, ALL),
    [items, tab]
  );

  const handleRowClick = useCallback(
    (b: BillingPeriod) => {
      router.push(`/apartments/${apartmentId}/billing-periods/${b.id}`);
    },
    [apartmentId, router]
  );

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

  const columns = useMemo<Column<BillingPeriod>[]>(
    () => [
      {
        key: "period",
        header: t("nav-billing-periods"),
        sortable: true,
        sortValue: (b) =>
          b.name ??
          `${(b.periodYear ?? 0) * 100 + (b.periodMonth ?? 0)}`,
        cell: (b) => (
          <span className="font-medium text-gray-900">
            {b.name ??
              `${t(MONTH_CODES[(b.periodMonth ?? 1) - 1])} ${b.periodYear}`}
          </span>
        ),
      },
      {
        key: "type",
        header: t("type"),
        cell: (b) =>
          b.type ? t(BILLING_PERIOD_TYPE_CODES[b.type]) ?? b.type : b.type,
      },
      {
        key: "invoices",
        header: t("invoice-count"),
        cell: (b) => b.invoiceCount ?? 0,
      },
      {
        key: "status",
        header: t("status"),
        sortable: true,
        sortValue: (b) => b.status,
        cell: (b) => <StatusBadge kind="billing" value={b.status} />,
      },
      {
        key: "actions",
        header: "",
        className: "text-right",
        hideOnMobile: true,
        cell: () => <ChevronRight className="ml-auto h-4 w-4 text-gray-400" />,
      },
    ],
    [t]
  );

  const sorted = useMemo(
    () => sortTableData(filtered, columns, sortKey, sortDirection),
    [filtered, columns, sortKey, sortDirection]
  );

  const handleExportCsv = useCallback(() => {
    exportTableCsv("billing-periods.csv", columns, sorted);
  }, [columns, sorted]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("nav-billing-periods")}
        description={t("billing-periods-page-description")}
      />

      {/* รอบบิลสร้างโดยระบบเท่านั้น — ไม่มี UI ให้ผู้ใช้สร้างเอง */}
      <p className="flex items-start gap-2 rounded-lg bg-primary/5 px-4 py-3 text-sm text-gray-700">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        {t("billing-periods-auto-note")}
      </p>

      {setups.length === 0 && !setupsLoading && (
        <p className="rounded-lg bg-warning/10 px-4 py-3 text-sm text-gray-700">
          {t("add-invoice-setup-first")}{" "}
          <Link
            href={`/apartments/${apartmentId}/invoice-setups`}
            className="font-medium text-primary hover:underline"
          >
            {t("nav-invoice-setups")}
          </Link>
        </p>
      )}

      <FilterBar
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="flex-wrap">
                <TabsTrigger value={ALL}>{t("all")}</TabsTrigger>
                <TabsTrigger value={BillingPeriodStatus.OPEN}>
                  {t("billing-period-status-open")}
                </TabsTrigger>
                <TabsTrigger value={BillingPeriodStatus.GENERATED}>
                  {t("billing-period-status-generated")}
                </TabsTrigger>
                <TabsTrigger value={BillingPeriodStatus.CLOSED}>
                  {t("billing-period-status-closed")}
                </TabsTrigger>
                <TabsTrigger value={BillingPeriodStatus.CANCELLED}>
                  {t("billing-period-status-cancelled")}
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Button variant="outline" size="sm" onClick={handleExportCsv}>
              <Download className="h-4 w-4" />
              {t("export-csv")}
            </Button>
          </div>
        }
      />

      <DataTable
        columns={columns}
        data={sorted}
        loading={isLoading}
        error={error}
        onRetry={() => refetch()}
        getRowId={(b) => b.id}
        onRowClick={handleRowClick}
        emptyTitle={t("no-billing-periods")}
        emptyDescription={t("no-billing-periods-description")}
        stickyHeader
        sortKey={sortKey}
        sortDirection={sortDirection}
        onSortChange={handleSortChange}
      />
    </div>
  );
}
