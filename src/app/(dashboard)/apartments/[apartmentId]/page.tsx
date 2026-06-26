"use client";

import { useParams, useRouter } from "next/navigation";
import {
  ArrowRight,
  DoorOpen,
  FileText,
  Gauge,
  Receipt,
  Users,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { useFetch } from "@/hooks/use-fetch";
import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { useApartmentStore } from "@/stores/apartment.store";
import type { RoomOverview } from "@/types";

const numberOr = (v: unknown) => (typeof v === "number" ? v : 0);

export default function ApartmentOverviewPage() {
  const params = useParams<{ apartmentId: string }>();
  const apartmentId = params.apartmentId;
  const router = useRouter();
  const apartments = useApartmentStore((s) => s.apartments);
  const apartment = apartments.find((a) => a.id === apartmentId);

  const { data, loading } = useFetch<RoomOverview>(
    () => api.get<RoomOverview>(endpoints.rooms.overview(apartmentId)),
    [apartmentId]
  );

  const kpis = [
    { label: "ห้องทั้งหมด", value: numberOr(data?.total), tone: "text-gray-900" },
    { label: "ห้องว่าง", value: numberOr(data?.available), tone: "text-gray-700" },
    { label: "มีผู้เช่า", value: numberOr(data?.rented), tone: "text-success" },
    { label: "ค้างชำระ", value: numberOr(data?.overdue), tone: "text-danger" },
  ];

  const links = [
    { label: "ห้องพัก", desc: "จัดการห้องและสถานะ", icon: DoorOpen, seg: "rooms" },
    { label: "ผู้เช่า", desc: "ทะเบียนผู้เช่า", icon: Users, seg: "tenants" },
    { label: "มิเตอร์", desc: "จดมิเตอร์น้ำ-ไฟ", icon: Gauge, seg: "meters" },
    { label: "รอบบิล", desc: "สร้างและปิดรอบบิล", icon: FileText, seg: "billing-periods" },
    { label: "ใบแจ้งหนี้", desc: "ออกและติดตามการชำระ", icon: Receipt, seg: "invoices" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={apartment?.name ?? "ภาพรวมหอพัก"}
        description={
          apartment
            ? `${apartment.subDistrict}, ${apartment.district}, ${apartment.province}`
            : "สรุปภาพรวมห้องพักและทางลัดการจัดการ"
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-5">
              <p className="text-sm text-gray-500">{kpi.label}</p>
              {loading ? (
                <Skeleton className="mt-2 h-8 w-16" />
              ) : (
                <p className={`mt-1 text-3xl font-bold ${kpi.tone}`}>
                  {kpi.value}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-gray-900">ทางลัด</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <button
                key={link.seg}
                onClick={() =>
                  router.push(`/apartments/${apartmentId}/${link.seg}`)
                }
                className="group flex items-center justify-between rounded-xl border border-gray-200 bg-white p-5 text-left transition-shadow hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-light text-primary-hover">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{link.label}</p>
                    <p className="text-xs text-gray-500">{link.desc}</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400 transition-transform group-hover:translate-x-1" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
