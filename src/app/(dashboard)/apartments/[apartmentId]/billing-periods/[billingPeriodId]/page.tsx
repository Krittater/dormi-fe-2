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
  BILLING_PERIOD_TYPE_LABELS,
  BillingPeriodStatus,
} from "@/types";
import type { BillingPeriod, Invoice } from "@/types";

const MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];

export default function BillingPeriodDetailPage() {
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
      "สร้างใบแจ้งหนี้ (ฉบับร่าง) สำเร็จ"
    );

  const publishInvoices = () =>
    runAction(
      "publish",
      () =>
        api.post(
          endpoints.billingPeriods.publishInvoices(apartmentId, billingPeriodId),
          {}
        ),
      "เผยแพร่ใบแจ้งหนี้สำเร็จ"
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
      "สร้างใบแจ้งหนี้ใหม่สำเร็จ"
    );

  const status = period?.status;
  const isOpen = status === BillingPeriodStatus.OPEN;
  const isGenerated = status === BillingPeriodStatus.GENERATED;

  const invoiceColumns: Column<Invoice>[] = [
    {
      key: "number",
      header: "เลขที่บิล",
      cell: (i) => (
        <span className="font-medium text-gray-900">
          {i.invoiceNumber ?? i.id.slice(0, 8)}
        </span>
      ),
    },
    { key: "room", header: "ห้อง", cell: (i) => i.roomName ?? "-" },
    { key: "tenant", header: "ผู้เช่า", cell: (i) => i.tenantName ?? "-" },
    {
      key: "total",
      header: "ยอดรวม",
      cell: (i) => formatCurrency(i.total),
    },
    {
      key: "status",
      header: "สถานะ",
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
        กลับไปรายการรอบบิล
      </Button>

      {loading ? (
        <Skeleton className="h-32 w-full rounded-xl" />
      ) : !period ? (
        <p className="text-sm text-gray-500">ไม่พบรอบบิล</p>
      ) : (
        <>
          <PageHeader
            title={
              period.name ??
              `${MONTHS[(period.periodMonth ?? 1) - 1]} ${period.periodYear}`
            }
            description={BILLING_PERIOD_TYPE_LABELS[period.type] ?? period.type}
            actions={<StatusBadge kind="billing" value={period.status} />}
          />

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-500">จำนวนบิล</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {invoices.length}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-500">ครบกำหนด</p>
                <p className="mt-1 text-base font-medium text-gray-900">
                  {formatDate(period.dueDate)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-500">ยอดรวมทั้งหมด</p>
                <p className="mt-1 text-base font-medium text-gray-900">
                  {formatCurrency(
                    invoices.reduce((sum, i) => sum + (i.total ?? 0), 0)
                  )}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-500">ชำระแล้ว</p>
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
                จดมิเตอร์
              </Button>

              {isOpen && (
                <Button onClick={generateInvoices} disabled={busy !== null}>
                  {busy === "generate" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FilePlus2 className="h-4 w-4" />
                  )}
                  สร้างใบแจ้งหนี้
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
                    เผยแพร่ใบแจ้งหนี้
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setConfirm("regenerate")}
                    disabled={busy !== null}
                  >
                    <RefreshCw className="h-4 w-4" />
                    สร้างใหม่
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setConfirm("close")}
                    disabled={busy !== null}
                  >
                    <FileCheck2 className="h-4 w-4" />
                    ปิดรอบบิล
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
                  ยกเลิกรอบบิล
                </Button>
              )}
            </CardContent>
          </Card>

          <div>
            <h2 className="mb-3 text-sm font-semibold text-gray-900">
              ใบแจ้งหนี้ในรอบบิลนี้
            </h2>
            <DataTable
              columns={invoiceColumns}
              data={invoices}
              loading={false}
              getRowId={(i) => i.id}
              onRowClick={(i) =>
                router.push(`/apartments/${apartmentId}/invoices/${i.id}`)
              }
              emptyTitle="ยังไม่มีใบแจ้งหนี้"
              emptyDescription="กดสร้างใบแจ้งหนี้เพื่อออกบิลให้ผู้เช่า"
            />
          </div>
        </>
      )}

      <ConfirmDialog
        open={confirm === "cancel"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="ยกเลิกรอบบิล"
        description="การยกเลิกจะทำให้ไม่สามารถออกบิลในรอบนี้ได้ ต้องการดำเนินการต่อหรือไม่?"
        confirmLabel="ยกเลิกรอบบิล"
        destructive
        onConfirm={() =>
          transition(BillingPeriodStatus.CANCELLED, "ยกเลิกรอบบิลแล้ว")
        }
      />
      <ConfirmDialog
        open={confirm === "close"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="ปิดรอบบิล"
        description="ปิดรอบบิลหลังจากเรียกเก็บเงินเสร็จสิ้น ต้องการดำเนินการต่อหรือไม่?"
        confirmLabel="ปิดรอบบิล"
        onConfirm={() =>
          transition(BillingPeriodStatus.CLOSED, "ปิดรอบบิลแล้ว")
        }
      />
      <ConfirmDialog
        open={confirm === "regenerate"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="สร้างใบแจ้งหนี้ใหม่"
        description="ระบบจะสร้างใบแจ้งหนี้ฉบับร่างใหม่สำหรับรอบบิลนี้ ต้องการดำเนินการต่อหรือไม่?"
        confirmLabel="สร้างใหม่"
        onConfirm={regenerate}
      />
    </div>
  );
}
