"use client";

import { useCallback, useMemo, useState } from "react";
import { useApartmentId } from "@/hooks/use-apartment-id";
import { useForm } from "react-hook-form";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { IconActionButton } from "@/components/shared/icon-action-button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import { PageHeader } from "@/components/shared/page-header";
import { FilterBar } from "@/components/shared/filter-bar";
import { DataTable, type Column } from "@/components/shared/data-table";
import { ACTIVE, ALL } from "@/constants/config";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { InvoiceSetupWizard } from "@/features/invoice-setup/components/invoice-setup-wizard";
import {
  useInvoiceSetupActions,
  useInvoiceSetups,
} from "@/hooks/useInvoices";
import { useT } from "@/i18n";
import { zodFormResolver } from "@/lib/zod-resolver";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  invoiceSetupDefaultValues,
  makeInvoiceSetupSchema,
  RATE_INVOICE_TYPES,
  type InvoiceSetupFormValues,
} from "@/schemas/invoice-setup.schema";
import { INVOICE_TYPE_CODES, InvoiceType } from "@/types";
import type { InvoiceSetup } from "@/types";

export function InvoiceSetupsPage() {
  const t = useT();
  const apartmentId = useApartmentId();

  const [typeFilter, setTypeFilter] = useState<string>(ALL);
  const [activeFilter, setActiveFilter] = useState<string>(ALL);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<InvoiceSetup | null>(null);
  const [deleting, setDeleting] = useState<InvoiceSetup | null>(null);

  const {
    data: items = [],
    isLoading,
    error,
    refetch,
  } = useInvoiceSetups(apartmentId);
  const { create, update, remove } = useInvoiceSetupActions(apartmentId);

  const form = useForm<InvoiceSetupFormValues>({
    resolver: zodFormResolver<InvoiceSetupFormValues>(makeInvoiceSetupSchema(t)),
    defaultValues: invoiceSetupDefaultValues,
  });

  const watchType = form.watch("type");
  const needsRate = RATE_INVOICE_TYPES.includes(
    watchType as (typeof RATE_INVOICE_TYPES)[number]
  );

  const isPending = create.isPending || update.isPending;

  const openCreate = useCallback(() => {
    setEditing(null);
    form.reset(invoiceSetupDefaultValues);
    setFormOpen(true);
  }, [form]);

  const openEdit = useCallback(
    (setup: InvoiceSetup) => {
      setEditing(setup);
      form.reset({
        type: setup.type,
        cutOffDate: setup.cutOffDate,
        issueDate: setup.issueDate,
        dueDate: setup.dueDate,
        effectiveFrom: setup.effectiveFrom?.slice(0, 10) ?? "",
        effectiveTo: setup.effectiveTo?.slice(0, 10) ?? "",
        ratePerUnit: setup.ratePerUnit != null ? String(setup.ratePerUnit) : "",
        isActive: setup.isActive,
      });
      setFormOpen(true);
    },
    [form]
  );

  const onSubmit = useCallback(
    (values: InvoiceSetupFormValues) => {
      const ratePayload =
        needsRate && values.ratePerUnit
          ? Number(values.ratePerUnit)
          : undefined;

      if (editing) {
        update.mutate(
          {
            setupId: editing.id,
            payload: {
              type: values.type,
              cutOffDate: values.cutOffDate,
              ratePerUnit: ratePayload,
            },
          },
          { onSuccess: () => setFormOpen(false) }
        );
      } else {
        create.mutate(
          {
            type: values.type,
            cutOffDate: values.cutOffDate,
            issueDate: values.issueDate,
            dueDate: values.dueDate,
            effectiveFrom: values.effectiveFrom,
            effectiveTo: values.effectiveTo || undefined,
            isActive: values.isActive,
            ratePerUnit: ratePayload,
          },
          { onSuccess: () => setFormOpen(false) }
        );
      }
    },
    [create, editing, needsRate, update]
  );

  const handleDelete = useCallback(async () => {
    if (!deleting) return;
    await remove.mutateAsync(deleting.id);
    setDeleting(null);
  }, [deleting, remove]);

  const filtered = useMemo(() => {
    let result = items;
    if (typeFilter !== ALL) {
      result = result.filter((s) => s.type === typeFilter);
    }
    if (activeFilter === ACTIVE) {
      result = result.filter((s) => s.isActive);
    }
    return result;
  }, [items, typeFilter, activeFilter]);

  const columns = useMemo<Column<InvoiceSetup>[]>(
    () => [
      {
        key: "type",
        header: t("type"),
        cell: (s) => (
          <span className="font-medium text-gray-900">
            {t(INVOICE_TYPE_CODES[s.type])}
          </span>
        ),
      },
      {
        key: "dates",
        header: t("cutoff-issue-due"),
        cell: (s) => `${s.cutOffDate} / ${s.issueDate} / ${s.dueDate}`,
      },
      {
        key: "rate",
        header: t("rate-per-unit"),
        cell: (s) =>
          s.ratePerUnit != null ? formatCurrency(s.ratePerUnit) : "-",
      },
      {
        key: "effective",
        header: t("effective"),
        cell: (s) =>
          `${formatDate(s.effectiveFrom)} - ${
            s.effectiveTo ? formatDate(s.effectiveTo) : t("no-end-date")
          }`,
      },
      {
        key: "status",
        header: t("status"),
        cell: (s) =>
          s.isActive ? (
            <Badge variant="success">{t("active")}</Badge>
          ) : (
            <Badge variant="outline">{t("inactive")}</Badge>
          ),
      },
      {
        key: "actions",
        header: "",
        className: "text-right",
        cell: (s) => (
          <div className="flex justify-end gap-1">
            <IconActionButton
              label={t("edit")}
              className="h-8 w-8"
              onClick={() => openEdit(s)}
            >
              <Pencil className="h-4 w-4" />
            </IconActionButton>
            <IconActionButton
              label={t("delete")}
              destructive
              className="h-8 w-8"
              onClick={() => setDeleting(s)}
            >
              <Trash2 className="h-4 w-4" />
            </IconActionButton>
          </div>
        ),
      },
    ],
    [openEdit, t]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("nav-invoice-setups")}
        description={t("invoice-setups-page-description")}
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            {t("add-setup")}
          </Button>
        }
      />

      {items.length === 0 && !isLoading ? (
        <InvoiceSetupWizard apartmentId={apartmentId} />
      ) : (
        <>
          <FilterBar
            filters={[
              {
                id: "type",
                node: (
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="sm:w-44">
                      <SelectValue placeholder={t("type")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL}>{t("all")}</SelectItem>
                      {Object.values(InvoiceType).map((it) => (
                        <SelectItem key={it} value={it}>
                          {t(INVOICE_TYPE_CODES[it])}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ),
              },
              {
                id: "active",
                node: (
                  <Select value={activeFilter} onValueChange={setActiveFilter}>
                    <SelectTrigger className="sm:w-44">
                      <SelectValue placeholder={t("status")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL}>{t("all")}</SelectItem>
                      <SelectItem value={ACTIVE}>{t("active")}</SelectItem>
                    </SelectContent>
                  </Select>
                ),
              },
            ]}
            onClear={() => {
              setTypeFilter(ALL);
              setActiveFilter(ALL);
            }}
            showClear={typeFilter !== ALL || activeFilter !== ALL}
          />

          <DataTable
            columns={columns}
            data={filtered}
            loading={isLoading}
            error={error}
            onRetry={() => refetch()}
            getRowId={(s) => s.id}
            emptyTitle={t("no-invoice-setups")}
            emptyDescription={t("no-invoice-setups-description")}
          />
        </>
      )}

      <Dialog open={formOpen} onOpenChange={(o) => !isPending && setFormOpen(o)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? t("edit-invoice-setup") : t("add-invoice-setup")}
            </DialogTitle>
            <DialogDescription>{t("invoice-setup-form-description")}</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("type")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(InvoiceType).map((it) => (
                          <SelectItem key={it} value={it}>
                            {t(INVOICE_TYPE_CODES[it])}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-3 gap-3">
                <FormField
                  control={form.control}
                  name="cutOffDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("cutoff-date")}</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} max={31} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="issueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("issue-date")}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={31}
                          disabled={Boolean(editing)}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("due-date")}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={31}
                          disabled={Boolean(editing)}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {needsRate && (
                <FormField
                  control={form.control}
                  name="ratePerUnit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("rate-per-unit-baht")}</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="effectiveFrom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("effective-from")}</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          disabled={Boolean(editing)}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="effectiveTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("effective-to-optional")}</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          disabled={Boolean(editing)}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {!editing && (
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
                      <FormLabel>{t("enable")}</FormLabel>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFormOpen(false)}
                  disabled={isPending}
                >
                  {t("cancel")}
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
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
        title={t("delete-invoice-setup")}
        description={t("delete-invoice-setup-description", {
          name: deleting ? t(INVOICE_TYPE_CODES[deleting.type]) : "",
        })}
        confirmLabel={t("delete")}
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}
