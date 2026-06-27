"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { DataTable, type Column } from "@/components/shared/data-table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { api, buildQuery } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { toList } from "@/lib/list";
import { formatCurrency, formatDate, getApiErrorMessage } from "@/lib/format";
import {
  BILLING_PERIOD_TYPE_CODES,
  BillingPeriodStatus,
} from "@/types";
import type { BillingPeriod, Invoice } from "@/types";
import { useT } from "@/i18n";

const MONTH_CODES = [
  "month-january", "month-february", "month-march", "month-april",
  "month-may", "month-june", "month-july", "month-august",
  "month-september", "month-october", "month-november", "month-december",
];

export default function BillingPeriodDetailPage() {
  const t = useT();
  const { apartmentId, billingPeriodId } = useParams<{
    apartmentId: string;
    billingPeriodId: string;
  }>();
  const router = useRouter();

  const [period, setPeriod] = useState<BillingPeriod | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<
    null | "cancel" | "close" | "regenerate"
  >(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, inv] = await Promise.all([
        api.get<BillingPeriod>(
          endpoints.billingPeriods.byId(apartmentId, billingPeriodId)
        ),
        api.get(
          endpoints.invoices.list(apartmentId) +
            buildQuery({ billingPeriodId, limit: 100 })
        ),
      ]);
      setPeriod(p);
      setInvoices(toList<Invoice>(inv).items);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [apartmentId, billingPeriodId]);

  useEffect(() => {
    load();
  }, [load]);

  const runAction = async (key: string, fn: () => Promise<unknown>, msg: string) => {
    setBusy(key);
    try {
      await fn();
      toast.success(msg);
      await load();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const generateInvoices = () =>
    runAction(
      "generate",
      () =>
        api.post(
          endpoints.billingPeriods.generateInvoices(apartmentId, billingPeriodId),
          { skipExistingInvoices: true }
        ),
      t("invoices-generated-draft")
    );

  const publishInvoices = () =>
    runAction(
      "publish",
      () =>
        api.post(
          endpoints.billingPeriods.publishInvoices(apartmentId, billingPeriodId),
          {}
        ),
      t("invoices-published")
    );

  const transition = (status: BillingPeriodStatus, msg: string) =>
    runAction(
      "status",
      () =>
        api.patch(
          endpoints.billingPeriods.status(apartmentId, billingPeriodId),
          { status }
        ),
      msg
    );

  const regenerate = () =>
    runAction(
      "regenerate",
      () =>
        api.post(
          endpoints.billingPeriods.regenerateInvoices(
            apartmentId,
            billingPeriodId
          ),
          {}
        ),
      t("invoices-regenerated")
    );

  const status = period?.status;
  const isOpen = status === BillingPeriodStatus.OPEN;
  const isGenerated = status === BillingPeriodStatus.GENERATED;

  const invoiceColumns: Column<Invoice>[] = [
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
  ];

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 w-fit text-gray-500"
        onClick={() => router.push(`/apartments/${apartmentId}/billing-periods`)}
      >
        <ArrowLeft className="h-4 w-4" />
        {t("back-to-billing-periods")}
      </Button>

      {loading ? (
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
                  {formatCurrency(
                    invoices.reduce((sum, i) => sum + (i.total ?? 0), 0)
                  )}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-500">{t("invoice-status-paid")}</p>
                <p className="mt-1 text-base font-medium text-success">
                  {invoices.filter((i) => i.status === "PAID").length}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="flex flex-wrap gap-2 p-5">
              <Button
                variant="outline"
                onClick={() =>
                  router.push(`/apartments/${apartmentId}/meters`)
                }
              >
                <Gauge className="h-4 w-4" />
                {t("record-meters")}
              </Button>

              {isOpen && (
                <Button onClick={generateInvoices} disabled={busy !== null}>
                  {busy === "generate" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FilePlus2 className="h-4 w-4" />
                  )}
                  {t("create-invoice")}
                </Button>
              )}

              {isGenerated && (
                <>
                  <Button onClick={publishInvoices} disabled={busy !== null}>
                    {busy === "publish" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    {t("publish-invoices")}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setConfirm("regenerate")}
                    disabled={busy !== null}
                  >
                    <RefreshCw className="h-4 w-4" />
                    {t("regenerate")}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setConfirm("close")}
                    disabled={busy !== null}
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
                  disabled={busy !== null}
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
              onRowClick={(i) =>
                router.push(`/apartments/${apartmentId}/invoices/${i.id}`)
              }
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
          transition(BillingPeriodStatus.CANCELLED, t("billing-period-cancelled"))
        }
      />
      <ConfirmDialog
        open={confirm === "close"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={t("close-billing-period")}
        description={t("close-billing-period-description")}
        confirmLabel={t("close-billing-period")}
        onConfirm={() =>
          transition(BillingPeriodStatus.CLOSED, t("billing-period-closed"))
        }
      />
      <ConfirmDialog
        open={confirm === "regenerate"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={t("regenerate-invoices")}
        description={t("regenerate-invoices-description")}
        confirmLabel={t("regenerate")}
        onConfirm={regenerate}
      />
    </div>
  );
}
