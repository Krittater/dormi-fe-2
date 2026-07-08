"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useApartmentId } from "@/hooks/use-apartment-id";
import { Check, Droplet, Loader2, Pencil, X, Zap } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { FilterBar } from "@/components/shared/filter-bar";
import { EmptyState } from "@/components/shared/empty-state";
import { SKELETON_ROWS_CARDS } from "@/constants/config";
import {
  useRoomChargeActions,
  useRoomChargeDropdowns,
  useRoomChargeSetup,
} from "@/hooks/useChargeTypes";
import { useT } from "@/i18n";
import { formatCurrency, getApiErrorMessage } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { SetupCharge } from "@/utils/room-charge";
import type { ChargeType } from "@/types";

export function RoomChargesPage() {
  const t = useT();
  const apartmentId = useApartmentId();

  const { data: setupRows, isLoading } = useRoomChargeSetup(apartmentId);
  const { data: dropdowns } = useRoomChargeDropdowns(apartmentId);
  const { saveSetup, create, remove } = useRoomChargeActions(apartmentId);

  const [search, setSearch] = useState("");
  const [editingChargeId, setEditingChargeId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState({ amount: "", unit: "" });
  const [togglingKey, setTogglingKey] = useState<string | null>(null);

  // อ่านจาก React Query cache ตรง ๆ — optimistic update จัดการใน useRoomChargeActions
  const rows = setupRows ?? [];

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(({ room }) => room.name.toLowerCase().includes(q));
  }, [rows, search]);

  const chargeTypes = useMemo(
    () => (dropdowns?.chargeTypes ?? []).filter((c) => c.isActive),
    [dropdowns],
  );

  useEffect(() => {
    if (!editingChargeId) return;
    const stillExists = (setupRows ?? []).some((row) =>
      row.room.charges.some((c) => c.id === editingChargeId),
    );
    if (!stillExists) setEditingChargeId(null);
  }, [setupRows, editingChargeId]);

  const toggleRoomFlag = useCallback(
    (roomId: string, key: "isCalWater" | "isCalElectric", value: boolean) => {
      const row = (setupRows ?? []).find((r) => r.room.id === roomId);
      if (!row || row.room.charges.length === 0) return;
      const nextWater = key === "isCalWater" ? value : row.room.isCalWater;
      const nextElectric =
        key === "isCalElectric" ? value : row.room.isCalElectric;
      // ส่งเฉพาะ charges ของห้องที่เปลี่ยน (delta) — ไม่ส่งทั้งหน้าเหมือนเดิม
      saveSetup.mutate(
        row.room.charges.map((c) => ({
          id: c.id,
          amount: c.amount,
          unit: c.unit ?? null,
          isCalWater: nextWater,
          isCalElectric: nextElectric,
        })),
      );
    },
    [setupRows, saveSetup],
  );

  const toggleChargeType = useCallback(
    async (roomId: string, chargeType: ChargeType, checked: boolean) => {
      const key = `${roomId}:${chargeType.id}`;
      setTogglingKey(key);
      try {
        const roomRow = (setupRows ?? []).find((r) => r.room.id === roomId);
        const existing = roomRow?.room.charges.find(
          (c) => c.chargeTypeId === chargeType.id,
        );

        if (checked) {
          if (existing) return;
          await create.mutateAsync({
            roomId,
            chargeTypeId: chargeType.id,
            amount: chargeType.defaultAmount ?? 0,
            unit: 1,
          });
        } else if (existing) {
          if (editingChargeId === existing.id) setEditingChargeId(null);
          await remove.mutateAsync(existing.id);
        }
      } catch (err) {
        toast.error(getApiErrorMessage(err));
      } finally {
        setTogglingKey(null);
      }
    },
    [setupRows, create, remove, editingChargeId],
  );

  const startEdit = useCallback((charge: SetupCharge) => {
    setEditingChargeId(charge.id);
    setEditDraft({
      amount: String(charge.amount),
      unit: charge.unit != null ? String(charge.unit) : "",
    });
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingChargeId(null);
  }, []);

  const saveEdit = useCallback(
    async (chargeId: string) => {
      const amount = Number(editDraft.amount);
      if (!Number.isFinite(amount) || amount < 0) {
        toast.error(t("enter-a-number"));
        return;
      }

      const unit = editDraft.unit.trim() === "" ? null : Number(editDraft.unit);
      if (unit != null && (!Number.isFinite(unit) || unit < 0)) {
        toast.error(t("enter-a-number"));
        return;
      }

      try {
        await saveSetup.mutateAsync([{ id: chargeId, amount, unit }]);
        setEditingChargeId(null);
      } catch (err) {
        toast.error(getApiErrorMessage(err));
      }
    },
    [editDraft, saveSetup, t],
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
      ) : chargeTypes.length === 0 ? (
        <EmptyState
          title={t("no-charge-types")}
          description={t("no-charge-types-description")}
        />
      ) : (
        <div className="space-y-4">
          <FilterBar
            search={{
              value: search,
              onChange: setSearch,
              placeholder: t("search"),
            }}
            onClear={() => setSearch("")}
            showClear={search !== ""}
          />

          {filteredRows.map(({ room }) => (
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
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {chargeTypes.map((chargeType) => {
                    const charge = room.charges.find(
                      (c) => c.chargeTypeId === chargeType.id,
                    );
                    const isChecked = Boolean(charge);
                    const isEditing =
                      charge != null && editingChargeId === charge.id;
                    const toggleKey = `${room.id}:${chargeType.id}`;
                    const isToggling = togglingKey === toggleKey;

                    return (
                      <div
                        key={chargeType.id}
                        className={cn(
                          "flex items-center gap-3 rounded-lg border p-3 transition-colors",
                          isChecked
                            ? "border-primary bg-primary-tint ring-1 ring-primary/10"
                            : "border-gray-100 bg-gray-50",
                        )}
                      >
                        <Checkbox
                          id={`${room.id}-${chargeType.id}`}
                          checked={isChecked}
                          disabled={
                            isToggling || create.isPending || remove.isPending
                          }
                          onCheckedChange={(v) =>
                            void toggleChargeType(
                              room.id,
                              chargeType,
                              v === true,
                            )
                          }
                          // className="mt-0.5"
                        />
                        <div className="min-w-0 flex-1">
                          <label
                            htmlFor={`${room.id}-${chargeType.id}`}
                            className={cn(
                              "cursor-pointer text-sm font-medium",
                              isChecked ? "text-primary" : "text-gray-500",
                            )}
                          >
                            {chargeType.name}
                          </label>
                          {!isChecked && chargeType.defaultAmount != null && (
                            <p className="mt-0.5 text-xs text-gray-500">
                              {formatCurrency(chargeType.defaultAmount)}
                            </p>
                          )}
                        </div>

                        {isChecked && charge ? (
                          isEditing ? (
                            <div className="flex flex-wrap items-center justify-end gap-2">
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  min={0}
                                  step="0.01"
                                  value={editDraft.amount}
                                  onChange={(e) =>
                                    setEditDraft((d) => ({
                                      ...d,
                                      amount: e.target.value,
                                    }))
                                  }
                                  className="h-8 w-28"
                                  aria-label={t("charge-amount")}
                                />
                                <span className="text-sm text-gray-400">×</span>
                                <Input
                                  type="number"
                                  min={0}
                                  step="0.01"
                                  value={editDraft.unit}
                                  onChange={(e) =>
                                    setEditDraft((d) => ({
                                      ...d,
                                      unit: e.target.value,
                                    }))
                                  }
                                  className="h-8 w-20"
                                  placeholder="—"
                                  aria-label={t("unit")}
                                />
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-success"
                                  aria-label={t("save")}
                                  disabled={saveSetup.isPending}
                                  onClick={() => void saveEdit(charge.id)}
                                >
                                  {saveSetup.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Check className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  aria-label={t("cancel")}
                                  disabled={saveSetup.isPending}
                                  onClick={cancelEdit}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-900">
                                {formatCurrency(charge.amount)}
                              </span>
                              {charge.unit != null ? (
                                <span className="text-sm text-gray-500">
                                  × {charge.unit}
                                </span>
                              ) : null}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                aria-label={t("edit")}
                                onClick={() => startEdit(charge)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </div>
                          )
                        ) : isToggling ? (
                          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-gray-400" />
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
