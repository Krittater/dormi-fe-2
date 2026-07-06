"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useApartmentId } from "@/hooks/use-apartment-id";
import { useForm } from "react-hook-form";
import { ChevronRight, Loader2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { ALL } from "@/constants/config";
import { MONTH_CODES } from "@/constants/months";
import {
  useBillingActions,
  useBillingPeriodSetups,
  useBillingPeriods,
} from "@/hooks/useBillingPeriods";
import { useT } from "@/i18n";
import { zodFormResolver } from "@/lib/zod-resolver";
import {
  ANY_SETUP,
  billingPeriodGenerateSchema,
  type BillingPeriodGenerateValues,
} from "@/schemas/billing.schema";
import { filterBillingPeriodsByTab } from "@/utils/billing";
import {
  BILLING_PERIOD_TYPE_CODES,
  BillingPeriodStatus,
  BillingPeriodType,
} from "@/types";
import type { BillingPeriod } from "@/types";

export function BillingPeriodsPage() {
  const t = useT();
  const apartmentId = useApartmentId();
  const router = useRouter();

  const [tab, setTab] = useState<string>(ALL);
  const [formOpen, setFormOpen] = useState(false);

  const { data: items = [], isLoading } = useBillingPeriods(apartmentId);
  const { data: setups = [], isLoading: setupsLoading } =
    useBillingPeriodSetups(apartmentId);
  const { generate } = useBillingActions(apartmentId);

  const now = new Date();
  const form = useForm<BillingPeriodGenerateValues>({
    resolver: zodFormResolver<BillingPeriodGenerateValues>(
      billingPeriodGenerateSchema
    ),
    defaultValues: {
      periodYear: now.getFullYear(),
      periodMonth: now.getMonth() + 1,
      type: ANY_SETUP,
      setupId: ANY_SETUP,
    },
  });

  const filtered = useMemo(
    () => filterBillingPeriodsByTab(items, tab, ALL),
    [items, tab]
  );

  const onGenerate = useCallback(
    (values: BillingPeriodGenerateValues) => {
      generate.mutate(
        {
          periodYear: values.periodYear,
          periodMonth: values.periodMonth,
          type: values.type === ANY_SETUP ? undefined : values.type,
          setupId: values.setupId === ANY_SETUP ? undefined : values.setupId,
        },
        {
          onSuccess: () => setFormOpen(false),
        }
      );
    },
    [generate]
  );

  const handleRowClick = useCallback(
    (b: BillingPeriod) => {
      router.push(`/apartments/${apartmentId}/billing-periods/${b.id}`);
    },
    [apartmentId, router]
  );

  const columns = useMemo<Column<BillingPeriod>[]>(
    () => [
      {
        key: "period",
        header: t("nav-billing-periods"),
        cell: (b) => (
          <span className="font-medium text-gray-900">
            {b.name ??
              `${t(MONTH_CODES[(b.periodMonth ?? 1) - 1])} ${b.periodYear}`}
          </span>
        ),
      },
      {
        key: "type",
        header: t("type"),
        cell: (b) =>
          b.type ? t(BILLING_PERIOD_TYPE_CODES[b.type]) ?? b.type : b.type,
      },
      {
        key: "invoices",
        header: t("invoice-count"),
        cell: (b) => b.invoiceCount ?? 0,
      },
      {
        key: "status",
        header: t("status"),
        cell: (b) => <StatusBadge kind="billing" value={b.status} />,
      },
      {
        key: "actions",
        header: "",
        className: "text-right",
        hideOnMobile: true,
        cell: () => <ChevronRight className="ml-auto h-4 w-4 text-gray-400" />,
      },
    ],
    [t]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("nav-billing-periods")}
        description={t("billing-periods-page-description")}
        actions={
          <Button
            onClick={() => setFormOpen(true)}
            disabled={setups.length === 0}
          >
            <Plus className="h-4 w-4" />
            {t("create-billing-period")}
          </Button>
        }
      />

      {setups.length === 0 && !setupsLoading && (
        <p className="rounded-lg bg-warning/10 px-4 py-3 text-sm text-gray-700">
          {t("add-invoice-setup-first")}
        </p>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value={ALL}>{t("all")}</TabsTrigger>
          <TabsTrigger value={BillingPeriodStatus.OPEN}>
            {t("billing-period-status-open")}
          </TabsTrigger>
          <TabsTrigger value={BillingPeriodStatus.GENERATED}>
            {t("billing-period-status-generated")}
          </TabsTrigger>
          <TabsTrigger value={BillingPeriodStatus.CLOSED}>
            {t("billing-period-status-closed")}
          </TabsTrigger>
          <TabsTrigger value={BillingPeriodStatus.CANCELLED}>
            {t("billing-period-status-cancelled")}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <DataTable
        columns={columns}
        data={filtered}
        loading={isLoading}
        getRowId={(b) => b.id}
        onRowClick={handleRowClick}
        emptyTitle={t("no-billing-periods")}
        emptyDescription={t("no-billing-periods-description")}
      />

      <Dialog
        open={formOpen}
        onOpenChange={(o) => !generate.isPending && setFormOpen(o)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("create-billing-period")}</DialogTitle>
            <DialogDescription>
              {t("create-billing-period-description")}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onGenerate)}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="periodMonth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("month")}</FormLabel>
                      <Select
                        value={String(field.value)}
                        onValueChange={(v) => field.onChange(Number(v))}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {MONTH_CODES.map((code, i) => (
                            <SelectItem key={code} value={String(i + 1)}>
                              {t(code)}
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
                  name="periodYear"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("year-ce")}</FormLabel>
                      <FormControl>
                        <Input type="number" min={2000} max={2100} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("type-optional")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("all-types")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={ANY_SETUP}>{t("all-types")}</SelectItem>
                        {Object.values(BillingPeriodType).map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {t(BILLING_PERIOD_TYPE_CODES[opt])}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {setups.length > 0 && (
                <FormField
                  control={form.control}
                  name="setupId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("invoice-setup-optional")}</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("all-setups")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={ANY_SETUP}>
                            {t("all-setups")}
                          </SelectItem>
                          {setups.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFormOpen(false)}
                  disabled={generate.isPending}
                >
                  {t("cancel")}
                </Button>
                <Button type="submit" disabled={generate.isPending}>
                  {generate.isPending && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  {t("create-billing-period")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
