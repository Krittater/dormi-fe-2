"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { useT } from "@/i18n";

export interface Column<T> {
  key: string;
  header: string;
  /** แสดงแทน header ในหัวตาราง (เช่น checkbox เลือกทั้งหน้า) — CSV ยังใช้ header */
  headerNode?: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  className?: string;
  hideOnMobile?: boolean;
  mobileFullWidth?: boolean;
  sortable?: boolean;
  /** Extract sortable value; defaults to string from cell if primitive */
  sortValue?: (row: T) => string | number;
}

export type TableDensity = "comfortable" | "compact";
export type SortDirection = "asc" | "desc";

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  /** error จาก react-query — เมื่อมีค่าจะแสดง ErrorState แทน EmptyState (กัน server ล่มแล้วดูเหมือนข้อมูลว่าง) */
  error?: unknown;
  onRetry?: () => void;
  getRowId: (row: T) => string;
  onRowClick?: (row: T) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  skeletonRows?: number;
  tableClassName?: string;
  density?: TableDensity;
  stickyHeader?: boolean;
  maxHeight?: string;
  sortKey?: string | null;
  sortDirection?: SortDirection;
  onSortChange?: (key: string) => void;
}

function cellSortValue<T>(col: Column<T>, row: T): string | number {
  if (col.sortValue) return col.sortValue(row);
  const rendered = col.cell(row);
  if (typeof rendered === "string" || typeof rendered === "number") {
    return rendered;
  }
  return "";
}

export function sortTableData<T>(
  data: T[],
  columns: Column<T>[],
  sortKey: string | null | undefined,
  direction: SortDirection
): T[] {
  if (!sortKey) return data;
  const col = columns.find((c) => c.key === sortKey);
  if (!col?.sortable) return data;
  const sorted = [...data].sort((a, b) => {
    const av = cellSortValue(col, a);
    const bv = cellSortValue(col, b);
    if (typeof av === "number" && typeof bv === "number") return av - bv;
    return String(av).localeCompare(String(bv), undefined, { numeric: true });
  });
  return direction === "desc" ? sorted.reverse() : sorted;
}

export function DataTable<T>({
  columns,
  data,
  loading,
  error,
  onRetry,
  getRowId,
  onRowClick,
  emptyTitle,
  emptyDescription,
  skeletonRows = 5,
  tableClassName,
  density = "comfortable",
  stickyHeader = false,
  maxHeight = "min(70vh, 640px)",
  sortKey,
  sortDirection = "asc",
  onSortChange,
}: DataTableProps<T>) {
  const t = useT();

  const rowPadding = density === "compact" ? "py-2" : "py-3";
  const headClass = density === "compact" ? "h-9" : "h-11";

  const displayData = React.useMemo(
    () => sortTableData(data, columns, sortKey, sortDirection),
    [columns, data, sortDirection, sortKey]
  );

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: skeletonRows }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (error != null) {
    return <ErrorState error={error} onRetry={onRetry} />;
  }

  if (!data.length) {
    return (
      <EmptyState
        title={emptyTitle ?? t("no-data")}
        description={emptyDescription}
      />
    );
  }

  const SortIcon = ({ colKey }: { colKey: string }) => {
    if (sortKey !== colKey) {
      return <ArrowUpDown className="ml-1 inline h-3.5 w-3.5 text-gray-400" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="ml-1 inline h-3.5 w-3.5 text-primary" />
    ) : (
      <ArrowDown className="ml-1 inline h-3.5 w-3.5 text-primary" />
    );
  };

  return (
    <>
      <div
        className={cn(
          "hidden rounded-xl border border-gray-200 bg-white md:block",
          stickyHeader && "overflow-auto"
        )}
        style={stickyHeader ? { maxHeight } : undefined}
      >
        <Table className={tableClassName}>
          <TableHeader
            className={cn(stickyHeader && "sticky top-0 z-10 bg-white")}
          >
            <TableRow className="hover:bg-transparent">
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={cn(headClass, col.className)}
                >
                  {col.sortable && onSortChange ? (
                    <button
                      type="button"
                      className="inline-flex items-center font-medium hover:text-gray-900"
                      onClick={() => onSortChange(col.key)}
                      aria-label={`${col.header} ${t("sort-asc")}`}
                    >
                      {col.header}
                      <SortIcon colKey={col.key} />
                    </button>
                  ) : (
                    (col.headerNode ?? col.header)
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayData.map((row) => (
              <TableRow
                key={getRowId(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(onRowClick && "cursor-pointer", rowPadding)}
              >
                {columns.map((col) => (
                  <TableCell key={col.key} className={col.className}>
                    {col.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-3 md:hidden">
        {displayData.map((row) => (
          <div
            key={getRowId(row)}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            className={cn(
              "rounded-xl border border-gray-200 bg-white p-4",
              onRowClick && "cursor-pointer active:bg-gray-50"
            )}
          >
            <dl className="space-y-2">
              {columns
                .filter((col) => !col.hideOnMobile && !col.mobileFullWidth)
                .map((col) => (
                  <div
                    key={col.key}
                    className="flex items-start justify-between gap-3"
                  >
                    <dt className="text-xs font-medium uppercase tracking-wide text-gray-600">
                      {col.header}
                    </dt>
                    <dd className="text-right text-sm text-gray-900">
                      {col.cell(row)}
                    </dd>
                  </div>
                ))}
            </dl>
            {columns
              .filter((col) => !col.hideOnMobile && col.mobileFullWidth)
              .map((col) => (
                <div key={col.key} className="mt-3">
                  {col.cell(row)}
                </div>
              ))}
          </div>
        ))}
      </div>
    </>
  );
}
