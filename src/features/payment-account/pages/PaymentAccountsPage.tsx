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
import { ACTIVE, ALL, INACTIVE } from "@/constants/config";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  usePaymentAccountActions,
  usePaymentAccounts,
} from "@/hooks/usePaymentAccounts";
import { useT } from "@/i18n";
import { zodFormResolver } from "@/lib/zod-resolver";
import {
  makePaymentAccountSchema,
  type PaymentAccountFormValues,
} from "@/schemas/payment-account.schema";
import {
  PAYMENT_ACCOUNT_TYPE_CODES,
  PaymentAccountType,
} from "@/types";
import type { PaymentAccount } from "@/types";

export function PaymentAccountsPage() {
  const t = useT();
  const apartmentId = useApartmentId();

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>(ALL);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PaymentAccount | null>(null);
  const [deleting, setDeleting] = useState<PaymentAccount | null>(null);

  const {
    data: items = [],
    isLoading,
    error,
    refetch,
  } = usePaymentAccounts(apartmentId);
  const { create, update, remove } = usePaymentAccountActions(apartmentId);
  const submitting = create.isPending || update.isPending;

  const form = useForm<PaymentAccountFormValues>({
    resolver: zodFormResolver<PaymentAccountFormValues>(
      makePaymentAccountSchema(t)
    ),
    defaultValues: { name: "", type: PaymentAccountType.CASH, isActive: true },
  });

  const openCreate = useCallback(() => {
    setEditing(null);
    form.reset({ name: "", type: PaymentAccountType.CASH, isActive: true });
    setFormOpen(true);
  }, [form]);

  const openEdit = useCallback(
    (acc: PaymentAccount) => {
      setEditing(acc);
      form.reset({ name: acc.name, type: acc.type, isActive: acc.isActive });
      setFormOpen(true);
    },
    [form]
  );

  const onSubmit = useCallback(
    (values: PaymentAccountFormValues) => {
      const payload = {
        name: values.name,
        type: values.type,
        isActive: values.isActive,
      };
      if (editing) {
        update.mutate(
          { accountId: editing.id, payload },
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
    if (activeFilter === ACTIVE) {
      result = result.filter((a) => a.isActive);
    } else if (activeFilter === INACTIVE) {
      result = result.filter((a) => !a.isActive);
    }
    const q = search.trim().toLowerCase();
    if (!q) return result;
    return result.filter((a) => a.name.toLowerCase().includes(q));
  }, [items, search, activeFilter]);

  const columns = useMemo<Column<PaymentAccount>[]>(
    () => [
      {
        key: "name",
        header: t("name"),
        cell: (a) => (
          <span className="font-medium text-gray-900">{a.name}</span>
        ),
      },
      {
        key: "type",
        header: t("account-type"),
        cell: (a) => (
          <Badge variant="secondary">
            {t(PAYMENT_ACCOUNT_TYPE_CODES[a.type])}
          </Badge>
        ),
      },
      {
        key: "isActive",
        header: t("status"),
        cell: (a) =>
          a.isActive ? (
            <Badge variant="success">{t("active")}</Badge>
          ) : (
            <Badge variant="outline">{t("inactive")}</Badge>
          ),
      },
      {
        key: "actions",
        header: "",
        className: "text-right",
        cell: (a) => (
          <div className="flex justify-end gap-1">
            <IconActionButton
              label={t("edit")}
              className="h-8 w-8"
              onClick={() => openEdit(a)}
            >
              <Pencil className="h-4 w-4" />
            </IconActionButton>
            <IconActionButton
              label={t("delete")}
              destructive
              className="h-8 w-8"
              onClick={() => setDeleting(a)}
            >
              <Trash2 className="h-4 w-4" />
            </IconActionButton>
          </div>
        ),
      },
    ],
    [t, openEdit]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("nav-payment-accounts")}
        description={t("payment-accounts-page-description")}
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            {t("add-account")}
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
            id: "active",
            node: (
              <Select value={activeFilter} onValueChange={setActiveFilter}>
                <SelectTrigger className="sm:w-44">
                  <SelectValue placeholder={t("status")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>{t("all")}</SelectItem>
                  <SelectItem value={ACTIVE}>{t("active")}</SelectItem>
                  <SelectItem value={INACTIVE}>{t("inactive")}</SelectItem>
                </SelectContent>
              </Select>
            ),
          },
        ]}
        onClear={() => {
          setSearch("");
          setActiveFilter(ALL);
        }}
        showClear={search !== "" || activeFilter !== ALL}
      />

      <DataTable
        columns={columns}
        data={filtered}
        loading={isLoading}
        error={error}
        onRetry={() => refetch()}
        getRowId={(a) => a.id}
        emptyTitle={t("no-accounts")}
        emptyDescription={t("no-accounts-description")}
      />

      <Dialog open={formOpen} onOpenChange={(o) => !submitting && setFormOpen(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? t("edit-account") : t("add-account")}
            </DialogTitle>
            <DialogDescription>{t("account-form-description")}</DialogDescription>
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
                    <FormLabel>{t("account-type")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(PaymentAccountType).map((v) => (
                          <SelectItem key={v} value={v}>
                            {t(PAYMENT_ACCOUNT_TYPE_CODES[v])}
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
        title={t("delete-account")}
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
