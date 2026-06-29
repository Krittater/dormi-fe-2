"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  DoorOpen,
  MapPin,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

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
import { ApartmentFormDialog } from "@/features/apartment/components/apartment-form-dialog";
import { SKELETON_ROWS_DASHBOARD } from "@/constants/config";
import { useApartmentActions, useApartments } from "@/hooks/useApartments";
import { useApartmentStore } from "@/stores/apartment.store";
import { useT } from "@/i18n";
import type { ApartmentOverview } from "@/types";

export function DashboardPage() {
  const router = useRouter();
  const t = useT();
  const setCurrent = useApartmentStore((s) => s.setCurrent);

  const { data: apartments = [], isLoading } = useApartments();
  const { remove } = useApartmentActions();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ApartmentOverview | null>(null);
  const [deleting, setDeleting] = useState<ApartmentOverview | null>(null);

  const openCreate = useCallback(() => {
    setEditing(null);
    setFormOpen(true);
  }, []);

  const openEdit = useCallback((apt: ApartmentOverview) => {
    setEditing(apt);
    setFormOpen(true);
  }, []);

  const handleDelete = useCallback(() => {
    if (!deleting) return;
    remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) });
  }, [deleting, remove]);

  const enterApartment = useCallback(
    (apt: ApartmentOverview) => {
      setCurrent(apt.id);
      router.push(`/apartments/${apt.id}`);
    },
    [router, setCurrent]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("my-apartments")}
        description={t("dashboard-subtitle")}
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            {t("add-apartment")}
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: SKELETON_ROWS_DASHBOARD }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full rounded-xl" />
          ))}
        </div>
      ) : apartments.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={t("no-apartments-yet")}
          description={t("add-first-apartment")}
          action={
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              {t("add-apartment")}
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
                          {apt.address ?? ""}
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
                        {t("edit")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDeleting(apt)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                        {t("delete")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="mt-4 flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm">
                  <DoorOpen className="h-4 w-4 text-primary-hover" />
                  <div>
                    <p className="text-xs text-gray-500">{t("rooms-total")}</p>
                    <p className="font-medium text-gray-900">
                      {apt.totalRooms}
                    </p>
                  </div>
                </div>

                <div className="mt-2 grid grid-cols-3 gap-2 text-center text-sm">
                  <div className="rounded-lg bg-gray-50 px-2 py-2">
                    <p className="text-xs text-gray-500">
                      {t("rooms-available")}
                    </p>
                    <p className="font-medium text-gray-900">
                      {apt.availableRooms}
                    </p>
                  </div>
                  <div className="rounded-lg bg-gray-50 px-2 py-2">
                    <p className="text-xs text-gray-500">{t("rooms-rented")}</p>
                    <p className="font-medium text-success">
                      {apt.rentedRooms}
                    </p>
                  </div>
                  <div className="rounded-lg bg-gray-50 px-2 py-2">
                    <p className="text-xs text-gray-500">{t("rooms-overdue")}</p>
                    <p className="font-medium text-danger">
                      {apt.overdueRooms}
                    </p>
                  </div>
                </div>

                <Button
                  className="mt-4 w-full"
                  variant="outline"
                  onClick={() => enterApartment(apt)}
                >
                  {t("manage")}
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
        onSuccess={() => setFormOpen(false)}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={t("delete-apartment")}
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
