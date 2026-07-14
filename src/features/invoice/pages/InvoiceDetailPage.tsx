"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useApartmentRouteParams } from "@/hooks/use-apartment-id";
import {
  HandCoins,
  Loader2,
  Pencil,
  Plus,
  Printer,
  Save,
  Trash2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { IconActionButton } from "@/components/shared/icon-action-button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/error-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useBreadcrumbTail } from "@/contexts/breadcrumb.context";
import { RecordTransactionDialog } from "@/features/finance/components/record-transaction-dialog";
import {
  useInvoiceActions,
  useInvoiceDetail,
} from "@/hooks/useInvoices";
import { useT } from "@/i18n";
import { formatCurrency, formatDate, daysUntil } from "@/lib/format";
import { computeInvoiceTotal } from "@/utils/invoice";
import {
  INVOICE_ITEM_TYPE_CODES,
  InvoiceItemType,
  InvoiceStatus,
} from "@/types";
import type { InvoiceItem } from "@/types";

interface EditItem {
  itemType: InvoiceItemType;
  description: string;
  quantity: number;
  unitPrice: number;
}

export function InvoiceDetailPage() {
  const t = useT();
  const { apartmentId, invoiceId } = useApartmentRouteParams();
  const router = useRouter();

  const {
    data: invoice,
    isLoading,
    error: invoiceError,
    refetch: refetchInvoice,
  } = useInvoiceDetail(apartmentId, invoiceId);
  const { updateItems, cancel } = useInvoiceActions(apartmentId, invoiceId);

  const [editing, setEditing] = useState(false);
  const [editItems, setEditItems] = useState<EditItem[]>([]);
  const [confirm, setConfirm] = useState<null | "cancel">(null);
  const [payOpen, setPayOpen] = useState(false);

  useBreadcrumbTail(invoice?.invoiceNumber ?? invoiceId);

  const items = useMemo(
    () =>
      (invoice?.items ?? []).map((it) => ({
        ...it,
        amount:
          it.amount ??
          Number(it.quantity ?? 1) * Number(it.unitPrice ?? 0),
        name: it.name ?? "",
      })),
    [invoice?.items]
  );

  const invoiceTotal = useMemo(
    () => invoice?.total ?? computeInvoiceTotal(items),
    [invoice?.total, items]
  );

  const startEdit = useCallback(() => {
    setEditItems(
      items.map((it) => ({
        itemType: (it.itemType as InvoiceItemType) ?? InvoiceItemType.OTHER,
        description: it.description ?? it.name ?? "",
        quantity: it.quantity,
        unitPrice: it.unitPrice,
      }))
    );
    setEditing(true);
  }, [items]);

  const updateEditItem = useCallback(
    (idx: number, patch: Partial<EditItem>) =>
      setEditItems((prev) =>
        prev.map((it, i) => (i === idx ? { ...it, ...patch } : it))
      ),
    []
  );

  const saveItems = useCallback(() => {
    if (editItems.length === 0) {
      toast.error(t("at-least-one-item"));
      return;
    }
    updateItems.mutate(
      editItems.map(
        (it) =>
          ({
            itemType: it.itemType,
            description: it.description || undefined,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
          }) as InvoiceItem
      ),
      { onSuccess: () => setEditing(false) }
    );
  }, [editItems, t, updateItems]);

  const handleCancel = useCallback(() => {
    cancel.mutate(undefined, { onSuccess: () => setConfirm(null) });
  }, [cancel]);

  const busy = updateItems.isPending || cancel.isPending;

  const status = invoice?.status;
  const isDraft = status === InvoiceStatus.DRAFT;
  const canPay =
    status === InvoiceStatus.UNPAID ||
    status === InvoiceStatus.OVERDUE ||
    status === InvoiceStatus.PARTIAL;
  const canCancel =
    status !== InvoiceStatus.PAID && status !== InvoiceStatus.CANCELLED;

  const paidAmount = Number(invoice?.paidAmount ?? 0);
  const outstanding = Math.max(0, invoiceTotal - paidAmount);

  const editTotal = useMemo(
    () =>
      editItems.reduce(
        (sum, it) => sum + it.quantity * it.unitPrice,
        0
      ),
    [editItems]
  );

  return (
    <div className="space-y-6 print:space-y-4">
      {isLoading ? (
        <Skeleton className="h-40 w-full rounded-xl" />
      ) : invoiceError ? (
        <ErrorState error={invoiceError} onRetry={() => refetchInvoice()} />
      ) : !invoice ? (
        <p className="text-sm text-gray-600">{t("invoice-not-found")}</p>
      ) : (
        <>
          <PageHeader
            title={t("invoice-title", { number: invoice.invoiceNumber ?? "" })}
            actions={
              <div className="flex flex-wrap items-center gap-2 print:hidden">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.print()}
                >
                  <Printer className="h-4 w-4" />
                  {t("print-invoice")}
                </Button>
                <StatusBadge kind="invoice" value={invoice.status} />
              </div>
            }
          />

          <Card className="invoice-print-area">
            <CardContent className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-4">
              <div>
                <p className="text-xs text-gray-600">{t("room")}</p>
                <p className="font-medium text-gray-900">
                  {invoice.roomName ?? "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">{t("tenant")}</p>
                <p className="font-medium text-gray-900">
                  {invoice.tenantName ?? "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">{t("issue-date")}</p>
                <p className="font-medium text-gray-900">
                  {formatDate(invoice.issueDate)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">{t("due")}</p>
                <p className="font-medium text-gray-900">
                  {formatDate(invoice.dueDate)}
                </p>
                {(() => {
                  const d = daysUntil(invoice.dueDate);
                  if (
                    d == null ||
                    (invoice.status !== InvoiceStatus.UNPAID &&
                      invoice.status !== InvoiceStatus.OVERDUE)
                  ) {
                    return null;
                  }
                  return (
                    <p
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
                    </p>
                  );
                })()}
              </div>
              <div>
                <p className="text-xs text-gray-600">{t("paid-amount")}</p>
                <p className="font-medium text-emerald-600">
                  {formatCurrency(paidAmount)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">{t("outstanding")}</p>
                <p className="font-medium text-destructive">
                  {formatCurrency(outstanding)}
                </p>
              </div>
            </CardContent>
          </Card>

          {(invoice.paidAt || paidAmount > 0) && (
            <Card>
              <CardContent className="p-5">
                <h3 className="text-sm font-semibold text-gray-900">
                  {t("payment-history")}
                </h3>
                <dl className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-gray-600">{t("paid-amount")}</dt>
                    <dd className="font-medium text-gray-900">
                      {formatCurrency(paidAmount)}
                    </dd>
                  </div>
                  {invoice.paidAt && (
                    <div className="flex justify-between gap-4">
                      <dt className="text-gray-600">{t("paid-at")}</dt>
                      <dd className="font-medium text-gray-900">
                        {formatDate(invoice.paidAt)}
                      </dd>
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>
          )}

          <div className="flex flex-wrap gap-2 print:hidden">
            {isDraft && !editing && (
              <Button variant="outline" onClick={startEdit}>
                <Pencil className="h-4 w-4" />
                {t("edit-items")}
              </Button>
            )}
            {canPay && (
              <Button onClick={() => setPayOpen(true)} disabled={busy}>
                <HandCoins className="h-4 w-4" />
                {t("receive-payment")}
              </Button>
            )}
            {canCancel && (
              <Button
                variant="outline"
                className="text-destructive"
                onClick={() => setConfirm("cancel")}
                disabled={busy}
              >
                <XCircle className="h-4 w-4" />
                {t("cancel-invoice")}
              </Button>
            )}
          </div>

          <Card>
            <CardContent className="p-0">
              {editing ? (
                <div className="space-y-3 p-5">
                  {editItems.map((it, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-1 gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 sm:grid-cols-12"
                    >
                      <div className="sm:col-span-3">
                        <label className="text-xs text-gray-600">{t("type")}</label>
                        <Select
                          value={it.itemType}
                          onValueChange={(v) =>
                            updateEditItem(idx, {
                              itemType: v as InvoiceItemType,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.values(InvoiceItemType).map((opt) => (
                              <SelectItem key={opt} value={opt}>
                                {t(INVOICE_ITEM_TYPE_CODES[opt])}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="sm:col-span-4">
                        <label className="text-xs text-gray-600">
                          {t("details")}
                        </label>
                        <Input
                          value={it.description}
                          onChange={(e) =>
                            updateEditItem(idx, { description: e.target.value })
                          }
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-xs text-gray-600">{t("quantity")}</label>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={it.quantity}
                          onChange={(e) =>
                            updateEditItem(idx, {
                              quantity: Number(e.target.value),
                            })
                          }
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-xs text-gray-600">
                          {t("unit-price")}
                        </label>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={it.unitPrice}
                          onChange={(e) =>
                            updateEditItem(idx, {
                              unitPrice: Number(e.target.value),
                            })
                          }
                        />
                      </div>
                      <div className="flex items-end sm:col-span-1">
                        <IconActionButton
                          label={t("remove-row")}
                          destructive
                          disabled={editItems.length <= 1}
                          onClick={() =>
                            setEditItems((prev) =>
                              prev.filter((_, i) => i !== idx)
                            )
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </IconActionButton>
                      </div>
                    </div>
                  ))}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setEditItems((prev) => [
                          ...prev,
                          {
                            itemType: InvoiceItemType.OTHER,
                            description: "",
                            quantity: 1,
                            unitPrice: 0,
                          },
                        ])
                      }
                    >
                      <Plus className="h-4 w-4" />
                      {t("add-item")}
                    </Button>
                    <p className="text-sm font-semibold text-gray-900">
                      {t("total")}: {formatCurrency(editTotal)}
                    </p>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setEditing(false)}
                      disabled={updateItems.isPending}
                    >
                      {t("cancel")}
                    </Button>
                    <Button onClick={saveItems} disabled={updateItems.isPending}>
                      {updateItems.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      {t("save")}
                    </Button>
                  </div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>{t("items")}</TableHead>
                      <TableHead className="text-right">{t("quantity")}</TableHead>
                      <TableHead className="text-right">{t("unit-price")}</TableHead>
                      <TableHead className="text-right">{t("amount")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((it, idx) => (
                      <TableRow key={it.id ?? idx}>
                        <TableCell>
                          <p className="font-medium text-gray-900">
                            {it.itemType
                              ? t(
                                  INVOICE_ITEM_TYPE_CODES[
                                    it.itemType as InvoiceItemType
                                  ]
                                ) ?? it.itemType
                              : it.name}
                          </p>
                          {it.description && (
                            <p className="text-xs text-gray-600">
                              {it.description}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {it.quantity}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(it.unitPrice)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(it.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={3} className="text-right font-semibold">
                        {t("grand-total")}
                      </TableCell>
                      <TableCell className="text-right text-base font-bold text-gray-900">
                        {formatCurrency(invoiceTotal)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="grid grid-cols-1 gap-3 p-5 text-sm sm:grid-cols-2">
              <div>
                <p className="text-xs text-gray-600">{t("created-by")}</p>
                <p className="text-gray-900">
                  {invoice.createdByName ?? "-"}
                  {invoice.createdAt && (
                    <span className="text-gray-400">
                      {" · "}
                      {formatDate(invoice.createdAt)}
                    </span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">{t("updated-by")}</p>
                <p className="text-gray-900">
                  {invoice.updatedByName ?? "-"}
                  {invoice.updatedAt && (
                    <span className="text-gray-400">
                      {" · "}
                      {formatDate(invoice.updatedAt)}
                    </span>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {invoice && (
        <RecordTransactionDialog
          open={payOpen}
          onOpenChange={setPayOpen}
          apartmentId={apartmentId}
          presetInvoice={invoice}
        />
      )}
      <ConfirmDialog
        open={confirm === "cancel"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={t("cancel-invoice")}
        description={t("cancel-invoice-description")}
        confirmLabel={t("cancel-bill")}
        destructive
        onConfirm={handleCancel}
      />
    </div>
  );
}
