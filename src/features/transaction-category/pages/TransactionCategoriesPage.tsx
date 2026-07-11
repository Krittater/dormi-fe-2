"use client";

import { useCallback, useMemo, useState } from "react";
import { useApartmentId } from "@/hooks/use-apartment-id";
import { useForm } from "react-hook-form";
import { Loader2, Lock, Pencil, Plus, Trash2 } from "lucide-react";

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
import { ALL } from "@/constants/config";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  useTransactionCategories,
  useTransactionCategoryActions,
} from "@/hooks/useTransactionCategories";
import { useT } from "@/i18n";
import { zodFormResolver } from "@/lib/zod-resolver";
import {
  makeTransactionCategorySchema,
  type TransactionCategoryFormValues,
} from "@/schemas/transaction-category.schema";
import {
  TRANSACTION_CATEGORY_TYPE_CODES,
  TransactionCategoryType,
} from "@/types";
import type { TransactionCategory } from "@/types";

export function TransactionCategoriesPage() {
  const t = useT();
  const apartmentId = useApartmentId();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>(ALL);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TransactionCategory | null>(null);
  const [deleting, setDeleting] = useState<TransactionCategory | null>(null);

  const {
    data: items = [],
    isLoading,
    error,
    refetch,
  } = useTransactionCategories(apartmentId);
  const { create, update, remove } = useTransactionCategoryActions(apartmentId);
  const submitting = create.isPending || update.isPending;

  const form = useForm<TransactionCategoryFormValues>({
    resolver: zodFormResolver<TransactionCategoryFormValues>(
      makeTransactionCategorySchema(t)
    ),
    defaultValues: {
      name: "",
      type: TransactionCategoryType.INCOME,
      isLiability: false,
      isActive: true,
    },
  });

  const openCreate = useCallback(() => {
    setEditing(null);
    form.reset({
      name: "",
      type: TransactionCategoryType.INCOME,
      isLiability: false,
      isActive: true,
    });
    setFormOpen(true);
  }, [form]);

  const openEdit = useCallback(
    (c: TransactionCategory) => {
      setEditing(c);
      form.reset({
        name: c.name,
        type: c.type,
        isLiability: c.isLiability,
        isActive: c.isActive,
      });
      setFormOpen(true);
    },
    [form]
  );

  const onSubmit = useCallback(
    (values: TransactionCategoryFormValues) => {
      const payload = {
        name: values.name,
        type: values.type,
        isLiability: values.isLiability,
        isActive: values.isActive,
      };
      if (editing) {
        update.mutate(
          { categoryId: editing.id, payload },
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

  const filtered = useMemo(() => {
    let result = items;
    if (typeFilter !== ALL) {
      result = result.filter((c) => c.type === typeFilter);
    }
    const q = search.trim().toLowerCase();
    if (!q) return result;
    return result.filter((c) => c.name.toLowerCase().includes(q));
  }, [items, search, typeFilter]);

  const columns = useMemo<Column<TransactionCategory>[]>(
    () => [
      {
        key: "name",
        header: t("name"),
        cell: (c) => (
          <span className="flex items-center gap-2 font-medium text-gray-900">
            {c.name}
            {c.apartmentId === null && (
              <Badge variant="outline" className="gap-1 font-normal">
                <Lock className="h-3 w-3" />
                {t("shared-category")}
              </Badge>
            )}
          </span>
        ),
      },
      {
        key: "type",
        header: t("type"),
        cell: (c) => (
          <Badge variant={c.type === TransactionCategoryType.INCOME ? "success" : "danger"}>
            {t(TRANSACTION_CATEGORY_TYPE_CODES[c.type])}
          </Badge>
        ),
      },
      {
        key: "isLiability",
        header: t("liability"),
        cell: (c) =>
          c.isLiability ? <Badge variant="warning">{t("yes")}</Badge> : "-",
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
        cell: (c) => {
          const shared = c.apartmentId === null;
          return (
            <div className="flex justify-end gap-1">
              <IconActionButton
                label={t("edit")}
                className="h-8 w-8"
                disabled={shared}
                onClick={() => openEdit(c)}
              >
                <Pencil className="h-4 w-4" />
              </IconActionButton>
              <IconActionButton
                label={t("delete")}
                destructive
                className="h-8 w-8"
                disabled={shared}
                onClick={() => setDeleting(c)}
              >
                <Trash2 className="h-4 w-4" />
              </IconActionButton>
            </div>
          );
        },
      },
    ],
    [t, openEdit]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("nav-transaction-categories")}
        description={t("transaction-categories-page-description")}
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            {t("add-category")}
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
            id: "type",
            node: (
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="sm:w-44">
                  <SelectValue placeholder={t("type")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>{t("all")}</SelectItem>
                  {Object.values(TransactionCategoryType).map((v) => (
                    <SelectItem key={v} value={v}>
                      {t(TRANSACTION_CATEGORY_TYPE_CODES[v])}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ),
          },
        ]}
        onClear={() => {
          setSearch("");
          setTypeFilter(ALL);
        }}
        showClear={search !== "" || typeFilter !== ALL}
      />

      <DataTable
        columns={columns}
        data={filtered}
        loading={isLoading}
        error={error}
        onRetry={() => refetch()}
        getRowId={(c) => c.id}
        emptyTitle={t("no-categories")}
        emptyDescription={t("no-categories-description")}
      />

      <Dialog open={formOpen} onOpenChange={(o) => !submitting && setFormOpen(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? t("edit-category") : t("add-category")}
            </DialogTitle>
            <DialogDescription>{t("category-form-description")}</DialogDescription>
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
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                        {Object.values(TransactionCategoryType).map((v) => (
                          <SelectItem key={v} value={v}>
                            {t(TRANSACTION_CATEGORY_TYPE_CODES[v])}
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
                name="isLiability"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
                    <div>
                      <FormLabel>{t("is-liability")}</FormLabel>
                      <p className="text-xs text-gray-500">
                        {t("is-liability-hint")}
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
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
        title={t("delete-category")}
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
