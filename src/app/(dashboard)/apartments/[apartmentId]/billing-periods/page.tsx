"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ChevronRight, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

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
import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { toList } from "@/lib/list";
import { zodFormResolver } from "@/lib/zod-resolver";
import { getApiErrorMessage } from "@/lib/format";
import {
  BILLING_PERIOD_TYPE_LABELS,
  BillingPeriodStatus,
  BillingPeriodType,
} from "@/types";
import type { BillingPeriod, InvoiceSetup } from "@/types";

const MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];

const ANY = "any";

const schema = z.object({
  periodYear: z.coerce.number().int().min(2000).max(2100),
  periodMonth: z.coerce.number().int().min(1).max(12),
  type: z.string().optional(),
  setupId: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export default function BillingPeriodsPage() {
  const { apartmentId } = useParams<{ apartmentId: string }>();
  const router = useRouter();

  const [items, setItems] = useState<BillingPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [setups, setSetups] = useState<InvoiceSetup[]>([]);

  const now = new Date();
  const form = useForm<FormValues>({
    resolver: zodFormResolver<FormValues>(schema),
    defaultValues: {
      periodYear: now.getFullYear(),
      periodMonth: now.getMonth() + 1,
      type: ANY,
      setupId: ANY,
    },
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(endpoints.billingPeriods.list(apartmentId));
      setItems(toList<BillingPeriod>(res).items);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [apartmentId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    api
      .get(endpoints.invoiceSetups.list(apartmentId))
      .then((res) => setSetups(toList<InvoiceSetup>(res).items))
      .catch(() => undefined);
  }, [apartmentId]);

  const filtered = useMemo(
    () =>
      tab === "all" ? items : items.filter((b) => b.status === tab),
    [items, tab]
  );

  const onGenerate = async (values: FormValues) => {
    setSubmitting(true);
    try {
      await api.post(endpoints.billingPeriods.generate(apartmentId), {
        periodYear: values.periodYear,
        periodMonth: values.periodMonth,
        type: values.type === ANY ? undefined : values.type,
        setupId: values.setupId === ANY ? undefined : values.setupId,
      });
      toast.success("สร้างรอบบิลสำเร็จ");
      setFormOpen(false);
      load();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const columns: Column<BillingPeriod>[] = [
    {
      key: "period",
      header: "รอบบิล",
      cell: (b) => (
        <span className="font-medium text-gray-900">
          {b.name ?? `${MONTHS[(b.periodMonth ?? 1) - 1]} ${b.periodYear}`}
        </span>
      ),
    },
    {
      key: "type",
      header: "ประเภท",
      cell: (b) => BILLING_PERIOD_TYPE_LABELS[b.type] ?? b.type,
    },
    {
      key: "invoices",
      header: "จำนวนบิล",
      cell: (b) => b.invoiceCount ?? 0,
    },
    {
      key: "status",
      header: "สถานะ",
      cell: (b) => <StatusBadge kind="billing" value={b.status} />,
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      hideOnMobile: true,
      cell: () => <ChevronRight className="ml-auto h-4 w-4 text-gray-400" />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="รอบบิล"
        description="สร้างรอบบิลรายเดือน จดมิเตอร์ ออกและเผยแพร่ใบแจ้งหนี้"
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" />
            สร้างรอบบิล
          </Button>
        }
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="all">ทั้งหมด</TabsTrigger>
          <TabsTrigger value={BillingPeriodStatus.OPEN}>เปิดรอบ</TabsTrigger>
          <TabsTrigger value={BillingPeriodStatus.GENERATED}>
            สร้างบิลแล้ว
          </TabsTrigger>
          <TabsTrigger value={BillingPeriodStatus.CLOSED}>ปิดรอบ</TabsTrigger>
          <TabsTrigger value={BillingPeriodStatus.CANCELLED}>ยกเลิก</TabsTrigger>
        </TabsList>
      </Tabs>

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        getRowId={(b) => b.id}
        onRowClick={(b) =>
          router.push(`/apartments/${apartmentId}/billing-periods/${b.id}`)
        }
        emptyTitle="ยังไม่มีรอบบิล"
        emptyDescription="สร้างรอบบิลแรกเพื่อเริ่มเรียกเก็บเงิน"
      />

      <Dialog open={formOpen} onOpenChange={(o) => !submitting && setFormOpen(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>สร้างรอบบิล</DialogTitle>
            <DialogDescription>
              เลือกเดือนและปีของรอบบิลที่ต้องการสร้าง
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
                      <FormLabel>เดือน</FormLabel>
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
                          {MONTHS.map((m, i) => (
                            <SelectItem key={m} value={String(i + 1)}>
                              {m}
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
                      <FormLabel>ปี (ค.ศ.)</FormLabel>
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
                    <FormLabel>ประเภท (ไม่บังคับ)</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="ทุกประเภท" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={ANY}>ทุกประเภท</SelectItem>
                        {Object.values(BillingPeriodType).map((t) => (
                          <SelectItem key={t} value={t}>
                            {BILLING_PERIOD_TYPE_LABELS[t]}
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
                      <FormLabel>รูปแบบใบแจ้งหนี้ (ไม่บังคับ)</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="ทุกรูปแบบ" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={ANY}>ทุกรูปแบบ</SelectItem>
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
                  disabled={submitting}
                >
                  ยกเลิก
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  สร้างรอบบิล
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
