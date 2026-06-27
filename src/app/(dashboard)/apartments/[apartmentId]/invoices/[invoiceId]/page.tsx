"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { formatCurrency, formatDate, getApiErrorMessage } from "@/lib/format";
import {
  INVOICE_ITEM_TYPE_CODES,
  InvoiceItemType,
  InvoiceStatus,
} from "@/types";
import type { Invoice, InvoiceItem } from "@/types";
import { useT } from "@/i18n";

interface EditItem {
  itemType: InvoiceItemType;
  description: string;
  quantity: number;
  unitPrice: number;
}

export default function InvoiceDetailPage() {
  const t = useT();
  const { apartmentId, invoiceId } = useParams<{
    apartmentId: string;
    invoiceId: string;
  }>();
  const router = useRouter();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editItems, setEditItems] = useState<EditItem[]>([]);
  const [confirm, setConfirm] = useState<null | "paid" | "cancel">(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [base, detail] = await Promise.all([
        api.get<Invoice>(endpoints.invoices.byId(apartmentId, invoiceId)).catch(
          () => null
        ),
        api
          .get<Record<string, unknown>>(
            endpoints.invoices.detail(apartmentId, invoiceId)
          )
          .catch(() => null),
      ]);

      const rawItems =
        (detail?.invoiceItems as InvoiceItem[]) ??
        (detail?.items as InvoiceItem[]) ??
        base?.items ??
        [];
      const normItems: InvoiceItem[] = rawItems.map((it) => ({
        ...it,
        quantity: Number(it.quantity ?? 1),
        unitPrice: Number(it.unitPrice ?? 0),
        amount: Number(
          it.amount ?? Number(it.quantity ?? 1) * Number(it.unitPrice ?? 0)
        ),
        name: it.name ?? "",
      }));

      const merged: Invoice = {
        id: invoiceId,
        apartmentId,
        invoiceNumber:
          (detail?.invoiceNumber as string) ?? base?.invoiceNumber,
        status:
          (base?.status as InvoiceStatus) ??
          (detail?.status as InvoiceStatus) ??
          InvoiceStatus.DRAFT,
        roomName: base?.roomName ?? null,
        tenantName: base?.tenantName ?? null,
        issueDate:
          base?.issueDate ?? (detail?.issueDate as string) ?? null,
        dueDate: base?.dueDate ?? (detail?.dueDate as string) ?? null,
        total:
          base?.total ??
          normItems.reduce((sum, it) => sum + (it.amount ?? 0), 0),
      };

      setInvoice(merged);
      setItems(normItems);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [apartmentId, invoiceId]);

  useEffect(() => {
    load();
  }, [load]);

  const startEdit = () => {
    setEditItems(
      items.map((it) => ({
        itemType: (it.itemType as InvoiceItemType) ?? InvoiceItemType.OTHER,
        description: it.description ?? it.name ?? "",
        quantity: it.quantity,
        unitPrice: it.unitPrice,
      }))
    );
    setEditing(true);
  };

  const updateEditItem = (idx: number, patch: Partial<EditItem>) =>
    setEditItems((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, ...patch } : it))
    );

  const saveItems = async () => {
    if (editItems.length === 0) {
      toast.error(t("at-least-one-item"));
      return;
    }
    setBusy("save");
    try {
      await api.patch(endpoints.invoices.updateItems(apartmentId, invoiceId), {
        items: editItems.map((it) => ({
          itemType: it.itemType,
          description: it.description || undefined,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
        })),
      });
      toast.success(t("items-saved"));
      setEditing(false);
      load();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const markPaid = async () => {
    setBusy("paid");
    try {
      await api.patch(endpoints.invoices.markPaid(apartmentId, invoiceId), {});
      toast.success(t("mark-as-paid"));
      load();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const cancelInvoice = async () => {
    setBusy("cancel");
    try {
      await api.delete(endpoints.invoices.cancel(apartmentId, invoiceId));
      toast.success(t("invoice-cancelled"));
      load();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const status = invoice?.status;
  const isDraft = status === InvoiceStatus.DRAFT;
  const canPay =
    status === InvoiceStatus.UNPAID || status === InvoiceStatus.OVERDUE;
  const canCancel =
    status !== InvoiceStatus.PAID && status !== InvoiceStatus.CANCELLED;

  const editTotal = editItems.reduce(
    (sum, it) => sum + it.quantity * it.unitPrice,
    0
  );

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 w-fit text-gray-500"
        onClick={() => router.push(`/apartments/${apartmentId}/invoices`)}
      >
        <ArrowLeft className="h-4 w-4" />
        {t("back-to-invoices")}
      </Button>

      {loading ? (
        <Skeleton className="h-40 w-full rounded-xl" />
      ) : !invoice ? (
        <p className="text-sm text-gray-500">{t("invoice-not-found")}</p>
      ) : (
        <>
          <PageHeader
            title={t("invoice-title", { number: invoice.invoiceNumber ?? "" })}
            actions={<StatusBadge kind="invoice" value={invoice.status} />}
          />

          <Card>
            <CardContent className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-4">
              <div>
                <p className="text-xs text-gray-500">{t("room")}</p>
                <p className="font-medium text-gray-900">
                  {invoice.roomName ?? "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">{t("tenant")}</p>
                <p className="font-medium text-gray-900">
                  {invoice.tenantName ?? "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">{t("issue-date")}</p>
                <p className="font-medium text-gray-900">
                  {formatDate(invoice.issueDate)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">{t("due")}</p>
                <p className="font-medium text-gray-900">
                  {formatDate(invoice.dueDate)}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-2">
            {isDraft && !editing && (
              <Button variant="outline" onClick={startEdit}>
                <Pencil className="h-4 w-4" />
                {t("edit-items")}
              </Button>
            )}
            {canPay && (
              <Button onClick={() => setConfirm("paid")} disabled={busy !== null}>
                <BadgeCheck className="h-4 w-4" />
                {t("mark-as-paid")}
              </Button>
            )}
            {canCancel && (
              <Button
                variant="outline"
                className="text-destructive"
                onClick={() => setConfirm("cancel")}
                disabled={busy !== null}
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
                        <label className="text-xs text-gray-500">{t("type")}</label>
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
                        <label className="text-xs text-gray-500">
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
                        <label className="text-xs text-gray-500">{t("quantity")}</label>
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
                        <label className="text-xs text-gray-500">
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
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          disabled={editItems.length <= 1}
                          onClick={() =>
                            setEditItems((prev) =>
                              prev.filter((_, i) => i !== idx)
                            )
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
                      disabled={busy === "save"}
                    >
                      {t("cancel")}
                    </Button>
                    <Button onClick={saveItems} disabled={busy === "save"}>
                      {busy === "save" ? (
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
                            <p className="text-xs text-gray-500">
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
                        {formatCurrency(invoice.total)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <ConfirmDialog
        open={confirm === "paid"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={t("confirm-payment")}
        description={t("confirm-payment-description")}
        confirmLabel={t("confirm")}
        onConfirm={markPaid}
      />
      <ConfirmDialog
        open={confirm === "cancel"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={t("cancel-invoice")}
        description={t("cancel-invoice-description")}
        confirmLabel={t("cancel-bill")}
        destructive
        onConfirm={cancelInvoice}
      />
    </div>
  );
}
