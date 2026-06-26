"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Droplet,
  MapPin,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ApartmentFormDialog } from "@/components/apartments/apartment-form-dialog";
import { useApartmentStore } from "@/stores/apartment.store";
import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { formatCurrency, getApiErrorMessage } from "@/lib/format";
import type { Apartment } from "@/types";

export default function DashboardPage() {
  const router = useRouter();
  const apartments = useApartmentStore((s) => s.apartments);
  const isLoading = useApartmentStore((s) => s.isLoading);
  const hasLoaded = useApartmentStore((s) => s.hasLoaded);
  const fetchApartments = useApartmentStore((s) => s.fetchApartments);
  const setCurrent = useApartmentStore((s) => s.setCurrent);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Apartment | null>(null);
  const [deleting, setDeleting] = useState<Apartment | null>(null);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (apt: Apartment) => {
    setEditing(apt);
    setFormOpen(true);
  };

  const handleSaved = async () => {
    await fetchApartments().catch(() => undefined);
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await api.delete(endpoints.apartments.remove(deleting.id));
      toast.success("ลบหอพักสำเร็จ");
      await fetchApartments().catch(() => undefined);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setDeleting(null);
    }
  };

  const enterApartment = (apt: Apartment) => {
    setCurrent(apt.id);
    router.push(`/apartments/${apt.id}`);
  };

  const showLoading = isLoading && !hasLoaded;

  return (
    <div className="space-y-6">
      <PageHeader
        title="หอพักของฉัน"
        description="เลือกหอพักเพื่อเข้าจัดการ หรือเพิ่มหอพักใหม่"
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            เพิ่มหอพัก
          </Button>
        }
      />

      {showLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full rounded-xl" />
          ))}
        </div>
      ) : apartments.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="ยังไม่มีหอพัก"
          description="เริ่มต้นด้วยการเพิ่มหอพักแห่งแรกของคุณ"
          action={
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              เพิ่มหอพัก
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {apartments.map((apt) => (
            <Card
              key={apt.id}
              className="group transition-shadow hover:shadow-md"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-light text-primary-hover">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-gray-900">
                        {apt.name}
                      </h3>
                      <p className="flex items-center gap-1 text-xs text-gray-500">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">
                          {apt.district}, {apt.province}
                        </span>
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(apt)}>
                        <Pencil className="h-4 w-4" />
                        แก้ไข
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDeleting(apt)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                        ลบ
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
                    <Zap className="h-4 w-4 text-warning" />
                    <div>
                      <p className="text-xs text-gray-500">ค่าไฟ/หน่วย</p>
                      <p className="font-medium text-gray-900">
                        {formatCurrency(apt.electricityRatePerUnit)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
                    <Droplet className="h-4 w-4 text-info" />
                    <div>
                      <p className="text-xs text-gray-500">ค่าน้ำ/หน่วย</p>
                      <p className="font-medium text-gray-900">
                        {formatCurrency(apt.waterRatePerUnit)}
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  className="mt-4 w-full"
                  variant="outline"
                  onClick={() => enterApartment(apt)}
                >
                  เข้าจัดการ
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ApartmentFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        apartment={editing}
        onSaved={handleSaved}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="ลบหอพัก"
        description={`ต้องการลบ "${deleting?.name}" ใช่หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้`}
        confirmLabel="ลบ"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}
