"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bell,
  Building2,
  CalendarClock,
  ChevronRight,
  Clock,
  DoorOpen,
  FileText,
  Gauge,
  Receipt,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { useFetch } from "@/hooks/use-fetch";
import { api, buildQuery } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { toList } from "@/lib/list";
import { formatNumber } from "@/lib/format";
import { getIntlLocale } from "@/i18n/runtime";
import { useApartmentStore } from "@/stores/apartment.store";
import { useAuthStore } from "@/stores/auth.store";
import { useT, type TranslateFn } from "@/i18n";
import {
  BillingPeriodStatus,
  InvoiceStatus,
  type BillingPeriod,
  type Invoice,
  type RoomOverview,
} from "@/types";

const DAY_MS = 24 * 60 * 60 * 1000;
const DUE_SOON_DAYS = 3;

const numberOr = (v: unknown) => (typeof v === "number" ? v : 0);
const pct = (part: number, total: number) =>
  total > 0 ? Math.round((part / total) * 1000) / 10 : 0;

function greetingCode(hour: number): string {
  if (hour < 12) return "greeting-morning";
  if (hour < 18) return "greeting-afternoon";
  return "greeting-evening";
}

function formatLongDate(d: Date): string {
  return new Intl.DateTimeFormat(getIntlLocale(), {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

function daysOverdue(dueDate?: string | null): number {
  if (!dueDate) return 0;
  const due = new Date(dueDate).getTime();
  if (Number.isNaN(due)) return 0;
  return Math.max(0, Math.floor((Date.now() - due) / DAY_MS));
}

interface Kpi {
  label: string;
  value: number;
  unit: string;
  sub: string;
  icon: typeof Building2;
  iconClass: string;
}

export default function ApartmentOverviewPage() {
  const params = useParams<{ apartmentId: string }>();
  const apartmentId = params.apartmentId;
  const router = useRouter();
  const t = useT();

  const apartment = useApartmentStore((s) =>
    s.apartments.find((a) => a.id === apartmentId)
  );
  const user = useAuthStore((s) => s.user);

  const { data: overview, loading: loadingOverview } = useFetch<RoomOverview>(
    () => api.get<RoomOverview>(endpoints.rooms.overview(apartmentId)),
    [apartmentId]
  );

  const { data: invoicesRaw, loading: loadingInvoices } = useFetch<unknown>(
    () => api.get(endpoints.invoices.list(apartmentId) + buildQuery({ limit: 100 })),
    [apartmentId]
  );

  const { data: periodsRaw } = useFetch<unknown>(
    () => api.get(endpoints.billingPeriods.list(apartmentId)),
    [apartmentId]
  );

  const invoices = useMemo(
    () => toList<Invoice>(invoicesRaw).items,
    [invoicesRaw]
  );
  const periods = useMemo(
    () => toList<BillingPeriod>(periodsRaw).items,
    [periodsRaw]
  );

  const now = new Date();
  const firstName =
    user?.firstNameTH?.trim() ||
    user?.email?.split("@")[0] ||
    t("user");

  const total = numberOr(overview?.total);
  const available = numberOr(overview?.available);
  const rented = numberOr(overview?.rented);

  const overdueInvoices = useMemo(
    () =>
      invoices
        .filter(
          (inv) =>
            inv.status === InvoiceStatus.OVERDUE ||
            (inv.status === InvoiceStatus.UNPAID && daysOverdue(inv.dueDate) > 0)
        )
        .sort((a, b) => daysOverdue(b.dueDate) - daysOverdue(a.dueDate)),
    [invoices]
  );

  const overdueAmount = useMemo(
    () => overdueInvoices.reduce((sum, inv) => sum + numberOr(inv.total), 0),
    [overdueInvoices]
  );

  const dueSoon = useMemo(
    () =>
      invoices.filter((inv) => {
        if (inv.status !== InvoiceStatus.UNPAID || !inv.dueDate) return false;
        const diff = (new Date(inv.dueDate).getTime() - Date.now()) / DAY_MS;
        return diff >= 0 && diff <= DUE_SOON_DAYS;
      }),
    [invoices]
  );

  const openPeriods = useMemo(
    () => periods.filter((p) => p.status === BillingPeriodStatus.OPEN),
    [periods]
  );

  const revenue = useMemo(() => buildRevenue(invoices, now), [invoices]);

  const kpis: Kpi[] = [
    {
      label: t("rooms-total"),
      value: total,
      unit: t("unit-room"),
      sub: t("occupancy-rate", { rate: pct(rented, total) }),
      icon: Building2,
      iconClass: "bg-primary-tint text-primary-hover",
    },
    {
      label: t("rooms-available"),
      value: available,
      unit: t("unit-room"),
      sub: t("percent-of-total", { rate: pct(available, total) }),
      icon: DoorOpen,
      iconClass: "bg-blue-50 text-blue-600",
    },
    {
      label: t("rooms-rented"),
      value: rented,
      unit: t("unit-room"),
      sub: t("percent-of-total", { rate: pct(rented, total) }),
      icon: Users,
      iconClass: "bg-emerald-50 text-emerald-600",
    },
    {
      label: t("rooms-overdue"),
      value: overdueInvoices.length,
      unit: t("unit-items"),
      sub: t("total-overdue-amount", { amount: formatNumber(overdueAmount) }),
      icon: Receipt,
      iconClass: "bg-red-50 text-red-600",
    },
  ];

  const shortcuts = [
    { label: t("nav-rooms"), desc: t("link-rooms-desc"), icon: DoorOpen, seg: "rooms" },
    { label: t("nav-tenants"), desc: t("link-tenants-desc"), icon: Users, seg: "tenants" },
    { label: t("nav-meters"), desc: t("link-meters-desc"), icon: Gauge, seg: "meters" },
    { label: t("nav-billing-periods"), desc: t("link-billing-periods-desc"), icon: FileText, seg: "billing-periods" },
    { label: t("nav-invoices"), desc: t("link-invoices-desc"), icon: Receipt, seg: "invoices" },
    { label: t("nav-reports"), desc: t("link-reports-desc"), icon: BarChart3, seg: "invoices" },
  ];

  const notifications = buildNotifications(t, {
    dueSoonCount: dueSoon.length,
    overdueCount: overdueInvoices.length,
    overdueAmount,
    openPeriodsCount: openPeriods.length,
  });

  const go = (seg: string) => router.push(`/apartments/${apartmentId}/${seg}`);

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="space-y-1">
        <h1
          suppressHydrationWarning
          className="flex items-center gap-2 text-2xl font-bold tracking-tight text-gray-900"
        >
          {t(greetingCode(now.getHours()))}, {firstName}
          {/* <span aria-hidden>👋</span> */} 
        </h1>
        <p suppressHydrationWarning className="text-sm text-gray-500">
          {apartment?.name ? `${apartment.name} · ` : ""}
          {t("dashboard-overview-subtitle", { date: formatLongDate(now) })}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <p className="text-sm text-gray-500">{kpi.label}</p>
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${kpi.iconClass}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                {loadingOverview ? (
                  <Skeleton className="mt-3 h-8 w-20" />
                ) : (
                  <p className="mt-2 text-3xl font-bold text-gray-900">
                    {formatNumber(kpi.value)}
                    <span className="ml-1 text-base font-medium text-gray-400">
                      {kpi.unit}
                    </span>
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-400">{kpi.sub}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Shortcuts */}
          <Card>
            <CardContent className="p-5">
              <h2 className="mb-4 text-base font-semibold text-gray-900">
                {t("shortcuts")}
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {shortcuts.map((link, i) => {
                  const Icon = link.icon;
                  return (
                    <button
                      key={`${link.seg}-${i}`}
                      onClick={() => go(link.seg)}
                      className="group flex items-center justify-between gap-2 rounded-xl border border-gray-200 p-4 text-left transition-colors hover:border-primary/40 hover:bg-primary-tint"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-tint text-primary-hover transition-colors group-hover:bg-white">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-gray-900">
                            {link.label}
                          </p>
                          <p className="truncate text-xs text-gray-500">
                            {link.desc}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Revenue */}
          <Card>
            <CardContent className="p-5">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">
                    {t("revenue-overview")}
                  </h2>
                  <p className="text-xs text-gray-500">{t("revenue-subtitle")}</p>
                </div>
                <span className="rounded-lg bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                  {t("this-month")}
                </span>
              </div>

              <div className="mb-3 flex items-end gap-3">
                <div>
                  <p className="text-xs text-gray-500">
                    {t("revenue-total-label", { month: revenue.monthLabel })}
                  </p>
                  {loadingInvoices ? (
                    <Skeleton className="mt-1 h-8 w-32" />
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">
                      {t("amount-with-baht", {
                        amount: formatNumber(revenue.total),
                      })}
                    </p>
                  )}
                </div>
                {revenue.changePct !== null && (
                  <span
                    className={`mb-1 inline-flex items-center gap-1 text-xs font-medium ${
                      revenue.changePct >= 0 ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {revenue.changePct >= 0 ? (
                      <TrendingUp className="h-3.5 w-3.5" />
                    ) : (
                      <TrendingDown className="h-3.5 w-3.5" />
                    )}
                    {Math.abs(revenue.changePct)}%
                  </span>
                )}
              </div>

              <RevenueChart points={revenue.points} xLabels={revenue.xLabels} />
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Recent overdue */}
          <Card>
            <CardContent className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold text-gray-900">
                  {t("recent-overdue")}
                </h2>
                <button
                  onClick={() => go("invoices")}
                  className="inline-flex items-center gap-0.5 text-xs font-medium text-primary hover:text-primary-hover"
                >
                  {t("view-all")}
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>

              {loadingInvoices ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full rounded-lg" />
                  ))}
                </div>
              ) : overdueInvoices.length === 0 ? (
                <p className="py-6 text-center text-sm text-gray-400">
                  {t("no-overdue")}
                </p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {overdueInvoices.slice(0, 4).map((inv) => (
                    <li
                      key={inv.id}
                      className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                          <AlertTriangle className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-gray-900">
                            {[inv.roomName, inv.tenantName]
                              .filter(Boolean)
                              .join(" · ") ||
                              inv.invoiceNumber ||
                              inv.id.slice(0, 8)}
                          </p>
                          <p className="text-xs text-gray-400">
                            {t("overdue-days", {
                              days: daysOverdue(inv.dueDate),
                            })}
                          </p>
                        </div>
                      </div>
                      <span className="shrink-0 text-sm font-semibold text-red-600">
                        {t("amount-with-baht", {
                          amount: formatNumber(numberOr(inv.total)),
                        })}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardContent className="p-5">
              <div className="mb-4 flex items-center gap-2">
                <Bell className="h-4 w-4 text-gray-500" />
                <h2 className="text-base font-semibold text-gray-900">
                  {t("notifications")}
                </h2>
              </div>

              {notifications.length === 0 ? (
                <p className="py-6 text-center text-sm text-gray-400">
                  {t("no-notifications")}
                </p>
              ) : (
                <ul className="space-y-3">
                  {notifications.map((n) => {
                    const Icon = n.icon;
                    return (
                      <li
                        key={n.id}
                        className="flex items-start gap-3 rounded-lg bg-gray-50 p-3"
                      >
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${n.iconClass}`}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {n.title}
                          </p>
                          <p className="text-xs text-gray-500">{n.desc}</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

interface RevenueResult {
  total: number;
  monthLabel: string;
  changePct: number | null;
  points: number[];
  xLabels: string[];
}

function buildRevenue(invoices: Invoice[], now: Date): RevenueResult {
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const paidThisMonth = (inv: Invoice) => {
    if (inv.status !== InvoiceStatus.PAID || !inv.paidAt) return false;
    const d = new Date(inv.paidAt);
    return d.getFullYear() === year && d.getMonth() === month;
  };

  const daily = new Array(daysInMonth).fill(0) as number[];
  let total = 0;
  for (const inv of invoices) {
    if (!paidThisMonth(inv)) continue;
    const day = new Date(inv.paidAt as string).getDate() - 1;
    const amount = typeof inv.total === "number" ? inv.total : 0;
    daily[day] += amount;
    total += amount;
  }

  const points: number[] = [];
  let running = 0;
  for (let i = 0; i < daysInMonth; i++) {
    running += daily[i];
    points.push(running);
  }

  let prevTotal = 0;
  for (const inv of invoices) {
    if (inv.status !== InvoiceStatus.PAID || !inv.paidAt) continue;
    const d = new Date(inv.paidAt);
    const prev = new Date(year, month - 1, 1);
    if (
      d.getFullYear() === prev.getFullYear() &&
      d.getMonth() === prev.getMonth()
    ) {
      prevTotal += typeof inv.total === "number" ? inv.total : 0;
    }
  }
  const changePct =
    prevTotal > 0
      ? Math.round(((total - prevTotal) / prevTotal) * 1000) / 10
      : null;

  const monthLabel = new Intl.DateTimeFormat(getIntlLocale(), {
    month: "short",
    year: "2-digit",
  }).format(now);

  const markerDays = [1, 8, 15, 22, daysInMonth];
  const xLabels = markerDays.map((d) =>
    new Intl.DateTimeFormat(getIntlLocale(), {
      day: "numeric",
      month: "short",
    }).format(new Date(year, month, d))
  );

  return { total, monthLabel, changePct, points, xLabels };
}

interface NotificationItem {
  id: string;
  title: string;
  desc: string;
  icon: typeof Bell;
  iconClass: string;
}

function buildNotifications(
  t: TranslateFn,
  data: {
    dueSoonCount: number;
    overdueCount: number;
    overdueAmount: number;
    openPeriodsCount: number;
  }
): NotificationItem[] {
  const list: NotificationItem[] = [];

  if (data.dueSoonCount > 0) {
    list.push({
      id: "due-soon",
      title: t("notif-due-soon-title"),
      desc: t("notif-due-soon-desc", {
        count: data.dueSoonCount,
        days: DUE_SOON_DAYS,
      }),
      icon: CalendarClock,
      iconClass: "bg-amber-50 text-amber-600",
    });
  }

  if (data.overdueCount > 0) {
    list.push({
      id: "overdue",
      title: t("notif-overdue-title"),
      desc: t("notif-overdue-desc", {
        count: data.overdueCount,
        amount: formatNumber(data.overdueAmount),
      }),
      icon: AlertTriangle,
      iconClass: "bg-red-50 text-red-600",
    });
  }

  if (data.openPeriodsCount > 0) {
    list.push({
      id: "open-period",
      title: t("notif-billing-open-title"),
      desc: t("notif-billing-open-desc", { count: data.openPeriodsCount }),
      icon: Clock,
      iconClass: "bg-blue-50 text-blue-600",
    });
  }

  return list;
}
