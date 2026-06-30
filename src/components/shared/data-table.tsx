"use client";

import * as React from "react";

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
import { useT } from "@/i18n";

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  className?: string;
  /** hide this column on the mobile stacked card view */
  hideOnMobile?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  getRowId: (row: T) => string;
  onRowClick?: (row: T) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  skeletonRows?: number;
  tableClassName?: string;
}

export function DataTable<T>({
  columns,
  data,
  loading,
  getRowId,
  onRowClick,
  emptyTitle,
  emptyDescription,
  skeletonRows = 5,
  tableClassName,
}: DataTableProps<T>) {
  const t = useT();
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: skeletonRows }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (!data.length) {
    return (
      <EmptyState
        title={emptyTitle ?? t("no-data")}
        description={emptyDescription}
      />
    );
  }

  return (
    <>
      {/* Desktop / tablet table */}
      <div className="hidden rounded-xl border border-gray-200 bg-white md:block">
        <Table className={tableClassName}>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {columns.map((col) => (
                <TableHead key={col.key} className={col.className}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow
                key={getRowId(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(onRowClick && "cursor-pointer")}
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

      {/* Mobile stacked cards */}
      <div className="space-y-3 md:hidden">
        {data.map((row) => (
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
                .filter((col) => !col.hideOnMobile)
                .map((col) => (
                  <div
                    key={col.key}
                    className="flex items-start justify-between gap-3"
                  >
                    <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      {col.header}
                    </dt>
                    <dd className="text-right text-sm text-gray-900">
                      {col.cell(row)}
                    </dd>
                  </div>
                ))}
            </dl>
          </div>
        ))}
      </div>
    </>
  );
}
