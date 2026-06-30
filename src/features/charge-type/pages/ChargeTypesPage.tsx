"use client";

import { useCallback, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";

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
import { Textarea } from "@/components/ui/textarea";
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
import {
  useChargeTypeActions,
  useChargeTypes,
} from "@/hooks/useChargeTypes";
import { useT } from "@/i18n";
import { zodFormResolver } from "@/lib/zod-resolver";
import { formatCurrency } from "@/lib/format";
import {
  makeChargeTypeSchema,
  type ChargeTypeFormValues,
} from "@/schemas/charge-type.schema";
import {
  CHARGE_TYPE_CATEGORY_CODES,
  ChargeTypeCategory,
} from "@/types";
import type { ChargeType } from "@/types";

export function ChargeTypesPage() {
  const t = useT();
  const { apartmentId } = useParams<{ apartmentId: string }>();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ChargeType | null>(null);
  const [deleting, setDeleting] = useState<ChargeType | null>(null);

  const { data: items = [], isLoading } = useChargeTypes(apartmentId);
  const { create, update, remove } = useChargeTypeActions(apartmentId);
  const submitting = create.isPending || update.isPending;

  const form = useForm<ChargeTypeFormValues>({
    resolver: zodFormResolver<ChargeTypeFormValues>(makeChargeTypeSchema(t)),
    defaultValues: {
      name: "",
      description: "",
      category: ChargeTypeCategory.OTHER,
      defaultAmount: "",
      isActive: true,
    },
  });

  const openCreate = useCallback(() => {
    setEditing(null);
    form.reset({
      name: "",
      description: "",
      category: ChargeTypeCategory.OTHER,
      defaultAmount: "",
      isActive: true,
    });
    setFormOpen(true);
  }, [form]);

  const openEdit = useCallback(
    (ct: ChargeType) => {
      setEditing(ct);
      form.reset({
        name: ct.name,
        description: ct.description ?? "",
        category: ct.category,
        defaultAmount:
          ct.defaultAmount != null ? String(ct.defaultAmount) : "",
        isActive: ct.isActive,
      });
      setFormOpen(true);
    },
    [form]
  );

  const onSubmit = useCallback(
    (values: ChargeTypeFormValues) => {
      const payload = {
        name: values.name,
        description: values.description || undefined,
        category: values.category,
        defaultAmount: values.defaultAmount
          ? Number(values.defaultAmount)
          : undefined,
        isActive: values.isActive,
      };

      if (editing) {
        update.mutate(
          { chargeTypeId: editing.id, payload },
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

  const columns = useMemo<Column<ChargeType>[]>(
    () => [
      {
        key: "name",
        header: t("name"),
        cell: (c) => (
          <span className="font-medium text-gray-900">{c.name}</span>
        ),
      },
      {
        key: "category",
        header: t("category"),
        cell: (c) => (
          <Badge variant="secondary">
            {t(CHARGE_TYPE_CATEGORY_CODES[c.category])}
          </Badge>
        ),
      },
      {
        key: "defaultAmount",
        header: t("suggested-amount"),
        cell: (c) =>
          c.defaultAmount != null ? formatCurrency(c.defaultAmount) : "-",
      },
      {
        key: "isActive",
        header: t("status"),
        cell: (c) =>
          c.isActive ? (
            <Badge variant="success">{t("active")}</Badge>
          ) : (
            <Badge variant="outline">{t("inactive")}</Badge>
          ),
      },
      {
        key: "actions",
        header: "",
        className: "text-right",
        cell: (c) => (
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => openEdit(c)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive"
              onClick={() => setDeleting(c)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [t, openEdit]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("nav-charge-types")}
        description={t("charge-types-page-description")}
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            {t("add-type")}
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={items}
        loading={isLoading}
        getRowId={(c) => c.id}
        emptyTitle={t("no-charge-types")}
        emptyDescription={t("no-charge-types-description")}
      />

      <Dialog open={formOpen} onOpenChange={(o) => !submitting && setFormOpen(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? t("edit-charge-type") : t("add-charge-type")}
            </DialogTitle>
            <DialogDescription>{t("charge-type-form-description")}</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("name")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("common-area-fee")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("category")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(ChargeTypeCategory).map((c) => (
                          <SelectItem key={c} value={c}>
                            {t(CHARGE_TYPE_CATEGORY_CODES[c])}
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
                name="defaultAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("suggested-amount-optional")}</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("description-optional")}</FormLabel>
                    <FormControl>
                      <Textarea rows={2} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
        title={t("delete-charge-type")}
        description={t("delete-confirm-description", {
          name: deleting?.name ?? "",
        })}
        confirmLabel={t("delete")}
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}
