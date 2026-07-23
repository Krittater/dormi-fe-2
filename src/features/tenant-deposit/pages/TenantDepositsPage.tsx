"use client";

import { useCallback, useMemo, useState } from "react";
import { useApartmentId } from "@/hooks/use-apartment-id";
import { useForm } from "react-hook-form";
import {
  HandCoins,
  Loader2,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { IconActionButton } from "@/components/shared/icon-action-button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { FilterBar } from "@/components/shared/filter-bar";
import { DataTable, type Column } from "@/components/shared/data-table";
import { ALL } from "@/constants/config";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { SettleDepositDialog } from "@/features/tenant-deposit/components/settle-deposit-dialog";
import {
  useTenantDepositActions,
  useTenantDeposits,
} from "@/hooks/useTenantDeposits";
import { useTenants } from "@/hooks/useTenants";
import { useRoomDropdown } from "@/hooks/useRooms";
import { useT } from "@/i18n";
import { formatCurrency, formatDate } from "@/lib/format";
import { zodFormResolver } from "@/lib/zod-resolver";
import {
  makeTenantDepositSchema,
  type TenantDepositFormValues,
} from "@/schemas/tenant-deposit.schema";
import {
  TENANT_DEPOSIT_STATUS_CODES,
  TenantDepositStatus,
} from "@/types";
import type { TenantDeposit } from "@/types";

const depositVariant: Record<
  TenantDepositStatus,
  "warning" | "success" | "danger" | "info"
> = {
  [TenantDepositStatus.HELD]: "warning",
  [TenantDepositStatus.REFUNDED]: "success",
  [TenantDepositStatus.FORFEITED]: "danger",
  [TenantDepositStatus.SETTLED]: "info",
};

export function TenantDepositsPage() {
  const t = useT();
  const apartmentId = useApartmentId();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(ALL);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TenantDeposit | null>(null);
  const [deleting, setDeleting] = useState<TenantDeposit | null>(null);
  const [settling, setSettling] = useState<TenantDeposit | null>(null);
  const [reversing, setReversing] = useState<TenantDeposit | null>(null);

  const {
    data: items = [],
    isLoading,
    error,
    refetch,
  } = useTenantDeposits(apartmentId);
  const { create, update, remove, reverse } =
    useTenantDepositActions(apartmentId);
  const { data: tenantsData } = useTenants(apartmentId);
  const { data: rooms = [] } = useRoomDropdown(apartmentId);
  const submitting = create.isPending || update.isPending;

  const tenants = tenantsData?.items ?? [];
  const tenantName = useCallback(
    (tenantId: string) => {
      const tn = tenants.find((x) => x.tenantId === tenantId);
      if (!tn) return tenantId;
      const name = `${tn.user?.firstNameTH ?? ""} ${tn.user?.lastNameTH ?? ""}`.trim();
      return name || tn.user?.email || tenantId;
    },
    [tenants]
  );
  const roomName = useCallback(
    (roomId?: string | null) =>
      roomId ? rooms.find((r) => r.id === roomId)?.name ?? "-" : "-",
    [rooms]
  );

  const form = useForm<TenantDepositFormValues>({
    resolver: zodFormResolver<TenantDepositFormValues>(
      makeTenantDepositSchema(t)
    ),
    defaultValues: {
      tenantId: "",
      roomId: "",
      amount: "",
      receivedDate: new Date().toISOString().slice(0, 10),
      status: TenantDepositStatus.HELD,
      refundedAmount: "",
      settledDate: "",
      note: "",
    },
  });

  const openCreate = useCallback(() => {
    setEditing(null);
    form.reset({
      tenantId: "",
      roomId: "",
      amount: "",
      receivedDate: new Date().toISOString().slice(0, 10),
      status: TenantDepositStatus.HELD,
      refundedAmount: "",
      settledDate: "",
      note: "",
    });
    setFormOpen(true);
  }, [form]);

  const openEdit = useCallback(
    (d: TenantDeposit) => {
      setEditing(d);
      form.reset({
        tenantId: d.tenantId,
        roomId: d.roomId ?? "",
        amount: String(d.amount ?? ""),
        receivedDate: d.receivedDate?.slice(0, 10) ?? "",
        status: d.status,
        refundedAmount: d.refundedAmount != null ? String(d.refundedAmount) : "",
        settledDate: d.settledDate?.slice(0, 10) ?? "",
        note: d.note ?? "",
      });
      setFormOpen(true);
    },
    [form]
  );

  const onSubmit = useCallback(
    (values: TenantDepositFormValues) => {
      const payload = {
        tenantId: values.tenantId,
        roomId: values.roomId || undefined,
        amount: Number(values.amount),
        receivedDate: values.receivedDate,
        status: values.status,
        refundedAmount: values.refundedAmount
          ? Number(values.refundedAmount)
          : undefined,
        settledDate: values.settledDate || undefined,
        note: values.note || undefined,
      };
      if (editing) {
        update.mutate(
          { depositId: editing.id, payload },
          { onSuccess: () => setFormOpen(false) }
        );
        return;
      }
      create.mutate(payload, { onSuccess: () => setFormOpen(false) });
    },
    [create, update, editing]
  );

  const handleDelete = useCallback(() => {
    if (!deleting) return;
    remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) });
  }, [deleting, remove]);

  const handleReverse = useCallback(() => {
    if (!reversing) return;
    reverse.mutate(reversing.id, { onSuccess: () => setReversing(null) });
  }, [reversing, reverse]);

  const filtered = useMemo(() => {
    let result = items;
    if (statusFilter !== ALL) {
      result = result.filter((d) => d.status === statusFilter);
    }
    const q = search.trim().toLowerCase();
    if (!q) return result;
    return result.filter((d) =>
      tenantName(d.tenantId).toLowerCase().includes(q)
    );
  }, [items, search, statusFilter, tenantName]);

  const columns = useMemo<Column<TenantDeposit>[]>(
    () => [
      {
        key: "tenant",
        header: t("tenant"),
        cell: (d) => (
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">
              {tenantName(d.tenantId)}
            </span>
            {d.sourceInvoiceId && (
              <Badge variant="info">{t("deposit-from-invoice")}</Badge>
            )}
          </div>
        ),
      },
      {
        key: "room",
        header: t("room"),
        cell: (d) => roomName(d.roomId),
        hideOnMobile: true,
      },
      {
        key: "amount",
        header: t("amount"),
        cell: (d) => formatCurrency(d.amount),
      },
      {
        key: "receivedDate",
        header: t("received-date"),
        cell: (d) => formatDate(d.receivedDate),
        hideOnMobile: true,
      },
      {
        key: "status",
        header: t("status"),
        cell: (d) => (
          <Badge variant={depositVariant[d.status] ?? "secondary"}>
            {t(TENANT_DEPOSIT_STATUS_CODES[d.status])}
          </Badge>
        ),
      },
      {
        key: "actions",
        header: "",
        className: "text-right",
        cell: (d) => (
          <div className="flex justify-end gap-1">
            {d.status === TenantDepositStatus.HELD ? (
              <IconActionButton
                label={t("settle-deposit")}
                className="h-8 w-8 text-emerald-600"
                onClick={() => setSettling(d)}
              >
                <HandCoins className="h-4 w-4" />
              </IconActionButton>
            ) : (
              <IconActionButton
                label={t("reverse-settlement")}
                className="h-8 w-8 text-amber-600"
                onClick={() => setReversing(d)}
              >
                <RotateCcw className="h-4 w-4" />
              </IconActionButton>
            )}
            <IconActionButton
              label={t("edit")}
              className="h-8 w-8"
              disabled={
                d.status !== TenantDepositStatus.HELD ||
                Boolean(d.sourceInvoiceId)
              }
              title={
                d.sourceInvoiceId
                  ? t("deposit-locked-from-bill")
                  : d.status !== TenantDepositStatus.HELD
                    ? t("edit-disabled-settled")
                    : undefined
              }
              onClick={() => openEdit(d)}
            >
              <Pencil className="h-4 w-4" />
            </IconActionButton>
            <IconActionButton
              label={t("delete")}
              destructive
              className="h-8 w-8"
              disabled={Boolean(d.sourceInvoiceId)}
              title={
                d.sourceInvoiceId ? t("deposit-locked-from-bill") : undefined
              }
              onClick={() => setDeleting(d)}
            >
              <Trash2 className="h-4 w-4" />
            </IconActionButton>
          </div>
        ),
      },
    ],
    [t, tenantName, roomName, openEdit]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("nav-tenant-deposits")}
        description={t("tenant-deposits-page-description")}
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            {t("add-deposit")}
          </Button>
        }
      />

      <FilterBar
        search={{
          value: search,
          onChange: setSearch,
          placeholder: t("search"),
        }}
        filters={[
          {
            id: "status",
            node: (
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="sm:w-44">
                  <SelectValue placeholder={t("status")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>{t("all-statuses")}</SelectItem>
                  {Object.values(TenantDepositStatus).map((v) => (
                    <SelectItem key={v} value={v}>
                      {t(TENANT_DEPOSIT_STATUS_CODES[v])}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ),
          },
        ]}
        onClear={() => {
          setSearch("");
          setStatusFilter(ALL);
        }}
        showClear={search !== "" || statusFilter !== ALL}
      />

      <DataTable
        columns={columns}
        data={filtered}
        loading={isLoading}
        error={error}
        onRetry={() => refetch()}
        getRowId={(d) => d.id}
        emptyTitle={t("no-deposits")}
        emptyDescription={t("no-deposits-description")}
      />

      <Dialog open={formOpen} onOpenChange={(o) => !submitting && setFormOpen(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? t("edit-deposit") : t("add-deposit")}
            </DialogTitle>
            <DialogDescription>{t("deposit-form-description")}</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="tenantId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("tenant")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("select-tenant")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {tenants.map((tn) => (
                          <SelectItem key={tn.tenantId} value={tn.tenantId}>
                            {tenantName(tn.tenantId)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="roomId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("room-optional")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("select-room")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {rooms.map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("amount")}</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="receivedDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("received-date")}</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("status")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(TenantDepositStatus).map((v) => (
                          <SelectItem key={v} value={v}>
                            {t(TENANT_DEPOSIT_STATUS_CODES[v])}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="refundedAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("refunded-amount-optional")}</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="settledDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("settled-date-optional")}</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("note-optional")}</FormLabel>
                    <FormControl>
                      <Textarea rows={2} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFormOpen(false)}
                  disabled={submitting}
                >
                  {t("cancel")}
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {t("save")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={t("delete-deposit")}
        description={t("delete-deposit-description")}
        confirmLabel={t("delete")}
        destructive
        onConfirm={handleDelete}
      />

      <ConfirmDialog
        open={Boolean(reversing)}
        onOpenChange={(o) => !o && setReversing(null)}
        title={t("reverse-settlement")}
        description={t("reverse-settlement-description")}
        confirmLabel={t("reverse-confirm")}
        onConfirm={handleReverse}
      />

      <SettleDepositDialog
        open={Boolean(settling)}
        onOpenChange={(o) => !o && setSettling(null)}
        apartmentId={apartmentId}
        deposit={settling}
      />
    </div>
  );
}
