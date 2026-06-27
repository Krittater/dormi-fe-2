"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pagination } from "@/components/ui/pagination";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { InvoiceFormDialog } from "@/components/invoices/invoice-form-dialog";
import { api, buildQuery } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { toList, totalPagesOf } from "@/lib/list";
import { formatCurrency, formatDate, getApiErrorMessage } from "@/lib/format";
import { INVOICE_STATUS_CODES, InvoiceStatus } from "@/types";
import type { Invoice, PaginationMeta } from "@/types";
import { useT } from "@/i18n";

const LIMIT = 20;
const ALL = "all";

export default function InvoicesPage() {
  const t = useT();
  const { apartmentId } = useParams<{ apartmentId: string }>();
  const router = useRouter();

  const [items, setItems] = useState<Invoice[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>(ALL);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(
        endpoints.invoices.list(apartmentId) +
          buildQuery({
            page,
            limit: LIMIT,
            status: status === ALL ? undefined : status,
            invoiceNumber: invoiceNumber || undefined,
          })
      );
      const norm = toList<Invoice>(res);
      setItems(norm.items);
      setMeta(norm.meta);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [apartmentId, page, status, invoiceNumber]);

  useEffect(() => {
    load();
  }, [load]);

  const columns: Column<Invoice>[] = [
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
      key: "due",
      header: t("due"),
      cell: (i) => formatDate(i.dueDate),
    },
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

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder={t("search-invoice-number")}
          value={invoiceNumber}
          onChange={(e) => {
            setPage(1);
            setInvoiceNumber(e.target.value);
          }}
          className="sm:max-w-xs"
        />
        <Select
          value={status}
          onValueChange={(v) => {
            setPage(1);
            setStatus(v);
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
      </div>

      <DataTable
        columns={columns}
        data={items}
        loading={loading}
        getRowId={(i) => i.id}
        onRowClick={(i) =>
          router.push(`/apartments/${apartmentId}/invoices/${i.id}`)
        }
        emptyTitle={t("no-invoices")}
        emptyDescription={t("no-invoices-description")}
      />

      <Pagination
        page={page}
        totalPages={totalPagesOf(meta, items.length, LIMIT)}
        onPageChange={setPage}
      />

      <InvoiceFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        apartmentId={apartmentId}
        onSaved={load}
      />
    </div>
  );
}
