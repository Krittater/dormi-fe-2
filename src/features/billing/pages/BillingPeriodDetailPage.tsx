"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useApartmentRouteParams } from "@/hooks/use-apartment-id";
import {
  ArrowLeft,
  FileCheck2,
  FilePlus2,
  Gauge,
  Loader2,
  RefreshCw,
  Send,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { DataTable, type Column } from "@/components/shared/data-table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { MONTH_CODES } from "@/constants/months";
import {
  useBillingActions,
  useBillingPeriod,
  useBillingPeriodInvoices,
} from "@/hooks/useBillingPeriods";
import { useT } from "@/i18n";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  BILLING_PERIOD_TYPE_CODES,
  BillingPeriodStatus,
  InvoiceStatus,
} from "@/types";
import type { Invoice } from "@/types";
import { countInvoicesByStatus } from "@/utils/invoice";

export function BillingPeriodDetailPage() {
  const t = useT();
  const { apartmentId, billingPeriodId } = useApartmentRouteParams();
  const router = useRouter();

  const [confirm, setConfirm] = useState<
    null | "cancel" | "close" | "regenerate" | "generate" | "publish"
  >(null);

  const { data: period, isLoading: loadingPeriod } = useBillingPeriod(
    apartmentId,
    billingPeriodId
  );
  const { data: invoiceResult, isLoading: loadingInvoices } =
    useBillingPeriodInvoices(apartmentId, billingPeriodId);
  const invoices = invoiceResult?.items ?? [];

  const {
    generateInvoices,
    publishInvoices,
    regenerateInvoices,
    updateStatus,
  } = useBillingActions(apartmentId);

  const isLoading = loadingPeriod || loadingInvoices;
  const isBusy =
    generateInvoices.isPending ||
    publishInvoices.isPending ||
    regenerateInvoices.isPending ||
    updateStatus.isPending;

  const handleGenerateInvoices = useCallback(() => {
    generateInvoices.mutate(billingPeriodId, {
      onSuccess: () => setConfirm(null),
    });
  }, [billingPeriodId, generateInvoices]);

  const handlePublishInvoices = useCallback(() => {
    publishInvoices.mutate(billingPeriodId, {
      onSuccess: () => setConfirm(null),
    });
  }, [billingPeriodId, publishInvoices]);

  const handleRegenerate = useCallback(() => {
    regenerateInvoices.mutate(billingPeriodId, {
      onSuccess: () => setConfirm(null),
    });
  }, [billingPeriodId, regenerateInvoices]);

  const handleTransition = useCallback(
    (status: BillingPeriodStatus, successMessage: string) => {
      updateStatus.mutate(
        { billingPeriodId, status, successMessage },
        { onSuccess: () => setConfirm(null) }
      );
    },
    [billingPeriodId, updateStatus]
  );

  const handleBack = useCallback(() => {
    router.push(`/apartments/${apartmentId}/billing-periods`);
  }, [apartmentId, router]);

  const handleMeters = useCallback(() => {
    router.push(`/apartments/${apartmentId}/meters`);
  }, [apartmentId, router]);

  const handleInvoiceClick = useCallback(
    (i: Invoice) => {
      router.push(`/apartments/${apartmentId}/invoices/${i.id}`);
    },
    [apartmentId, router]
  );

  const status = period?.status;
  const isOpen = status === BillingPeriodStatus.OPEN;
  const isGenerated = status === BillingPeriodStatus.GENERATED;

  const invoiceColumns = useMemo<Column<Invoice>[]>(
    () => [
      {
        key: "number",
        header: t("invoice-number"),
        cell: (i) => (
          <span className="font-medium text-gray-900">
            {i.invoiceNumber ?? i.id.slice(0, 8)}
          </span>
        ),
      },
      { key: "room", header: t("room"), cell: (i) => i.roomName ?? "-" },
      { key: "tenant", header: t("tenant"), cell: (i) => i.tenantName ?? "-" },
      {
        key: "total",
        header: t("total"),
        cell: (i) => formatCurrency(i.total),
      },
      {
        key: "status",
        header: t("status"),
        cell: (i) => <StatusBadge kind="invoice" value={i.status} />,
      },
    ],
    [t]
  );

  const grandTotal = useMemo(
    () => invoices.reduce((sum, i) => sum + (i.total ?? 0), 0),
    [invoices]
  );

  const paidCount = useMemo(
    () => countInvoicesByStatus(invoices, InvoiceStatus.PAID),
    [invoices]
  );

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 w-fit text-gray-500"
        onClick={handleBack}
      >
        <ArrowLeft className="h-4 w-4" />
        {t("back-to-billing-periods")}
      </Button>

      {isLoading ? (
        <Skeleton className="h-32 w-full rounded-xl" />
      ) : !period ? (
        <p className="text-sm text-gray-500">{t("billing-period-not-found")}</p>
      ) : (
        <>
          <PageHeader
            title={
              period.name ??
              `${t(MONTH_CODES[(period.periodMonth ?? 1) - 1])} ${period.periodYear}`
            }
            description={
              period.type
                ? t(BILLING_PERIOD_TYPE_CODES[period.type]) ?? period.type
                : period.type
            }
            actions={<StatusBadge kind="billing" value={period.status} />}
          />

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-500">{t("invoice-count")}</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {invoices.length}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-500">{t("due")}</p>
                <p className="mt-1 text-base font-medium text-gray-900">
                  {formatDate(period.dueDate)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-500">{t("grand-total")}</p>
                <p className="mt-1 text-base font-medium text-gray-900">
                  {formatCurrency(grandTotal)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-500">{t("invoice-status-paid")}</p>
                <p className="mt-1 text-base font-medium text-success">
                  {paidCount}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="flex flex-wrap gap-2 p-5">
              <Button variant="outline" onClick={handleMeters}>
                <Gauge className="h-4 w-4" />
                {t("record-meters")}
              </Button>

              {isOpen && (
                <Button onClick={() => setConfirm("generate")} disabled={isBusy}>
                  {generateInvoices.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FilePlus2 className="h-4 w-4" />
                  )}
                  {t("create-invoice")}
                </Button>
              )}

              {isGenerated && (
                <>
                  <Button onClick={() => setConfirm("publish")} disabled={isBusy}>
                    {publishInvoices.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    {t("publish-invoices")}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setConfirm("regenerate")}
                    disabled={isBusy}
                  >
                    <RefreshCw className="h-4 w-4" />
                    {t("regenerate")}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setConfirm("close")}
                    disabled={isBusy}
                  >
                    <FileCheck2 className="h-4 w-4" />
                    {t("close-billing-period")}
                  </Button>
                </>
              )}

              {isOpen && (
                <Button
                  variant="outline"
                  className="text-destructive"
                  onClick={() => setConfirm("cancel")}
                  disabled={isBusy}
                >
                  <XCircle className="h-4 w-4" />
                  {t("cancel-billing-period")}
                </Button>
              )}
            </CardContent>
          </Card>

          <div>
            <h2 className="mb-3 text-sm font-semibold text-gray-900">
              {t("invoices-in-period")}
            </h2>
            <DataTable
              columns={invoiceColumns}
              data={invoices}
              loading={false}
              getRowId={(i) => i.id}
              onRowClick={handleInvoiceClick}
              emptyTitle={t("no-invoices")}
              emptyDescription={t("no-invoices-period-description")}
            />
          </div>
        </>
      )}

      <ConfirmDialog
        open={confirm === "cancel"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={t("cancel-billing-period")}
        description={t("cancel-billing-period-description")}
        confirmLabel={t("cancel-billing-period")}
        destructive
        onConfirm={() =>
          handleTransition(
            BillingPeriodStatus.CANCELLED,
            t("billing-period-cancelled")
          )
        }
      />
      <ConfirmDialog
        open={confirm === "close"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={t("close-billing-period")}
        description={t("close-billing-period-description")}
        confirmLabel={t("close-billing-period")}
        onConfirm={() =>
          handleTransition(
            BillingPeriodStatus.CLOSED,
            t("billing-period-closed")
          )
        }
      />
      <ConfirmDialog
        open={confirm === "regenerate"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={t("regenerate-invoices")}
        description={t("regenerate-invoices-description")}
        confirmLabel={t("regenerate")}
        onConfirm={handleRegenerate}
      />
      <ConfirmDialog
        open={confirm === "generate"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={t("create-invoice")}
        description={t("create-invoice-description")}
        confirmLabel={t("create-invoice")}
        onConfirm={handleGenerateInvoices}
      />
      <ConfirmDialog
        open={confirm === "publish"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={t("publish-invoices")}
        description={t("publish-invoices-description")}
        confirmLabel={t("publish-invoices")}
        onConfirm={handlePublishInvoices}
      />
    </div>
  );
}
