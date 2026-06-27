"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
import { DataTable, type Column } from "@/components/shared/data-table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { toList } from "@/lib/list";
import { zodFormResolver } from "@/lib/zod-resolver";
import { formatCurrency, formatDate, getApiErrorMessage } from "@/lib/format";
import { useT, type TranslateFn } from "@/i18n";
import { INVOICE_TYPE_CODES, InvoiceType } from "@/types";
import type { InvoiceSetup } from "@/types";

const RATE_TYPES = [InvoiceType.ELECTRICITY, InvoiceType.WATER];

const makeSchema = (t: TranslateFn) =>
  z
    .object({
      type: z.nativeEnum(InvoiceType),
      cutOffDate: z.coerce.number().int().min(1).max(31),
      issueDate: z.coerce.number().int().min(1).max(31),
      dueDate: z.coerce.number().int().min(1).max(31),
      effectiveFrom: z.string().min(1, t("select-effective-date")),
      effectiveTo: z.string().optional(),
      ratePerUnit: z.string().optional(),
      isActive: z.boolean(),
    })
    .refine(
      (d) =>
        !RATE_TYPES.includes(d.type) ||
        (d.ratePerUnit !== "" && d.ratePerUnit !== undefined),
      { message: t("rate-required-for-utilities"), path: ["ratePerUnit"] }
    );
type FormValues = z.infer<ReturnType<typeof makeSchema>>;

export default function InvoiceSetupsPage() {
  const t = useT();
  const { apartmentId } = useParams<{ apartmentId: string }>();

  const [items, setItems] = useState<InvoiceSetup[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<InvoiceSetup | null>(null);
  const [deleting, setDeleting] = useState<InvoiceSetup | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodFormResolver<FormValues>(makeSchema(t)),
    defaultValues: {
      type: InvoiceType.RENT,
      cutOffDate: 25,
      issueDate: 26,
      dueDate: 5,
      effectiveFrom: "",
      effectiveTo: "",
      ratePerUnit: "",
      isActive: true,
    },
  });

  const watchType = form.watch("type");
  const needsRate = RATE_TYPES.includes(watchType);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(endpoints.invoiceSetups.list(apartmentId));
      setItems(toList<InvoiceSetup>(res).items);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [apartmentId]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    form.reset({
      type: InvoiceType.RENT,
      cutOffDate: 25,
      issueDate: 26,
      dueDate: 5,
      effectiveFrom: "",
      effectiveTo: "",
      ratePerUnit: "",
      isActive: true,
    });
    setFormOpen(true);
  };

  const openEdit = (s: InvoiceSetup) => {
    setEditing(s);
    form.reset({
      type: s.type,
      cutOffDate: s.cutOffDate,
      issueDate: s.issueDate,
      dueDate: s.dueDate,
      effectiveFrom: s.effectiveFrom?.slice(0, 10) ?? "",
      effectiveTo: s.effectiveTo?.slice(0, 10) ?? "",
      ratePerUnit: s.ratePerUnit != null ? String(s.ratePerUnit) : "",
      isActive: s.isActive,
    });
    setFormOpen(true);
  };

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      if (editing) {
        await api.patch(endpoints.invoiceSetups.update(editing.id), {
          type: values.type,
          cutOffDate: values.cutOffDate,
          ratePerUnit:
            needsRate && values.ratePerUnit
              ? Number(values.ratePerUnit)
              : undefined,
        });
        toast.success(t("invoice-setup-updated"));
      } else {
        await api.post(endpoints.invoiceSetups.create(apartmentId), {
          type: values.type,
          cutOffDate: values.cutOffDate,
          issueDate: values.issueDate,
          dueDate: values.dueDate,
          effectiveFrom: values.effectiveFrom,
          effectiveTo: values.effectiveTo || undefined,
          isActive: values.isActive,
          ratePerUnit:
            needsRate && values.ratePerUnit
              ? Number(values.ratePerUnit)
              : undefined,
        });
        toast.success(t("invoice-setup-added"));
      }
      setFormOpen(false);
      load();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await api.delete(endpoints.invoiceSetups.remove(apartmentId, deleting.id));
      toast.success(t("invoice-setup-deleted"));
      load();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setDeleting(null);
    }
  };

  const columns: Column<InvoiceSetup>[] = [
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
      cell: (s) => (s.ratePerUnit != null ? formatCurrency(s.ratePerUnit) : "-"),
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
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => openEdit(s)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive"
            onClick={() => setDeleting(s)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

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

      <DataTable
        columns={columns}
        data={items}
        loading={loading}
        getRowId={(s) => s.id}
        emptyTitle={t("no-invoice-setups")}
        emptyDescription={t("no-invoice-setups-description")}
      />

      <Dialog open={formOpen} onOpenChange={(o) => !submitting && setFormOpen(o)}>
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
