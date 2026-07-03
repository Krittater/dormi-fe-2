"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Droplet, Pencil, Plus, Trash2, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { RoomChargeFormDialog } from "@/features/room-charge/components/RoomChargeFormDialog";
import { SKELETON_ROWS_CARDS } from "@/constants/config";
import {
  useRoomChargeActions,
  useRoomChargeDropdowns,
  useRoomChargeSetup,
} from "@/hooks/useChargeTypes";
import { useT } from "@/i18n";
import { formatCurrency } from "@/lib/format";
import type { SetupRow } from "@/utils/room-charge";
import type { RoomCharge } from "@/types";

export function RoomChargesPage() {
  const t = useT();
  const { apartmentId } = useParams<{ apartmentId: string }>();

  const { data: setupRows = [], isLoading } = useRoomChargeSetup(apartmentId);
  const { data: dropdowns } = useRoomChargeDropdowns(apartmentId);
  const { saveSetup, remove } = useRoomChargeActions(apartmentId);

  const [rows, setRows] = useState<SetupRow[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RoomCharge | null>(null);
  const [addRoomId, setAddRoomId] = useState<string | undefined>();
  const [deleting, setDeleting] = useState<{ id: string; name: string } | null>(
    null
  );

  const rooms = dropdowns?.rooms ?? [];
  const chargeTypes = dropdowns?.chargeTypes ?? [];

  useEffect(() => {
    setRows(setupRows);
  }, [setupRows]);

  const persistFlags = useCallback(
    (nextRows: SetupRow[]) => {
      const charges = nextRows.flatMap((row) =>
        row.room.charges.map((c) => ({
          id: c.id,
          amount: c.amount,
          unit: c.unit,
          isCalWater: row.room.isCalWater,
          isCalElectric: row.room.isCalElectric,
        }))
      );
      if (charges.length === 0) return;
      saveSetup.mutate(charges);
    },
    [saveSetup]
  );

  const toggleRoomFlag = useCallback(
    (roomId: string, key: "isCalWater" | "isCalElectric", value: boolean) => {
      const next = rows.map((row) =>
        row.room.id !== roomId
          ? row
          : { room: { ...row.room, [key]: value } }
      );
      setRows(next);
      persistFlags(next);
    },
    [rows, persistFlags]
  );

  const handleDelete = useCallback(async () => {
    if (!deleting) return;
    await remove.mutateAsync(deleting.id);
    setDeleting(null);
  }, [deleting, remove]);

  const openCreate = useCallback((roomId: string) => {
    setEditing(null);
    setAddRoomId(roomId);
    setFormOpen(true);
  }, []);

  const openEdit = useCallback(
    (
      charge: SetupRow["room"]["charges"][number],
      roomId: string
    ) => {
      setAddRoomId(undefined);
      setEditing({
        id: charge.id,
        apartmentId,
        roomId,
        chargeTypeId: charge.chargeTypeId,
        amount: charge.amount,
        unit: charge.unit,
        description: charge.description,
      });
      setFormOpen(true);
    },
    [apartmentId]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("nav-room-charges")}
        description={t("room-charges-page-description")}
      />

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: SKELETON_ROWS_CARDS }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          title={t("no-rooms-to-setup")}
          description={t("add-rooms-first-description")}
        />
      ) : (
        <div className="space-y-4">
          {rows.map(({ room }) => (
            <Card key={room.id}>
              <CardContent className="p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="font-semibold text-gray-900">
                    {t("room-name", { name: room.name })}
                  </h3>
                  <div className="flex flex-wrap items-center gap-4">
                    <label className="flex items-center gap-2 text-sm">
                      <Droplet className="h-4 w-4 text-info" />
                      <span className="text-gray-700">
                        {t("charge-water-rate", {
                          rate: formatCurrency(room.waterRatePerUnit),
                        })}
                      </span>
                      <Switch
                        checked={room.isCalWater}
                        onCheckedChange={(v) =>
                          toggleRoomFlag(room.id, "isCalWater", v)
                        }
                        disabled={
                          room.charges.length === 0 || saveSetup.isPending
                        }
                      />
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <Zap className="h-4 w-4 text-warning" />
                      <span className="text-gray-700">
                        {t("charge-electricity-rate", {
                          rate: formatCurrency(room.electricityRatePerUnit),
                        })}
                      </span>
                      <Switch
                        checked={room.isCalElectric}
                        onCheckedChange={(v) =>
                          toggleRoomFlag(room.id, "isCalElectric", v)
                        }
                        disabled={
                          room.charges.length === 0 || saveSetup.isPending
                        }
                      />
                    </label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openCreate(room.id)}
                      disabled={chargeTypes.length === 0}
                    >
                      <Plus className="h-4 w-4" />
                      {t("add-charge")}
                    </Button>
                  </div>
                </div>

                {room.charges.length === 0 ? (
                  <p className="mt-4 text-sm text-gray-500">
                    {t("no-recurring-charges")}
                  </p>
                ) : (
                  <div className="mt-4 space-y-2">
                    {room.charges.map((c) => (
                      <div
                        key={c.id}
                        className="grid grid-cols-1 items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3 sm:grid-cols-12"
                      >
                        <div className="sm:col-span-5">
                          <p className="text-sm font-medium text-gray-900">
                            {c.chargeTypeName ?? t("charge")}
                          </p>
                          {c.description ? (
                            <p className="mt-0.5 text-xs text-gray-500">
                              {c.description}
                            </p>
                          ) : null}
                        </div>
                        <div className="sm:col-span-3">
                          <p className="text-xs text-gray-500">
                            {t("charge-amount")}
                          </p>
                          <p className="text-sm font-medium text-gray-900">
                            {formatCurrency(c.amount)}
                          </p>
                        </div>
                        <div className="sm:col-span-2">
                          <p className="text-xs text-gray-500">{t("unit")}</p>
                          <p className="text-sm font-medium text-gray-900">
                            {c.unit != null ? c.unit : "—"}
                          </p>
                        </div>
                        <div className="flex gap-1 sm:col-span-2 sm:justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            aria-label={t("edit")}
                            onClick={() => openEdit(c, room.id)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            aria-label={t("delete")}
                            onClick={() =>
                              setDeleting({
                                id: c.id,
                                name: c.chargeTypeName ?? t("charge"),
                              })
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <RoomChargeFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        apartmentId={apartmentId}
        charge={editing}
        rooms={rooms}
        chargeTypes={chargeTypes}
        defaultRoomId={addRoomId}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={t("delete-charge")}
        description={t("delete-charge-from-room-description", {
          name: deleting?.name ?? "",
        })}
        confirmLabel={t("delete")}
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}
