"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Droplet, Loader2, Pencil, Plus, Save, Trash2, Zap } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { RoomChargeFormDialog } from "@/components/room-charges/room-charge-form-dialog";
import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { toList } from "@/lib/list";
import { formatCurrency, getApiErrorMessage } from "@/lib/format";
import type { ChargeType, RoomCharge } from "@/types";

interface SetupCharge {
  id: string;
  chargeTypeName?: string;
  amount: number;
  unit: number | null;
}
interface SetupRoom {
  id: string;
  name: string;
  isCalWater: boolean;
  isCalElectric: boolean;
  waterRatePerUnit: number;
  electricityRatePerUnit: number;
  charges: SetupCharge[];
}
interface SetupRow {
  room: SetupRoom;
}

interface RoomOption {
  id: string;
  name: string;
}

export default function RoomChargesSetupPage() {
  const { apartmentId } = useParams<{ apartmentId: string }>();

  const [rows, setRows] = useState<SetupRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [rooms, setRooms] = useState<RoomOption[]>([]);
  const [chargeTypes, setChargeTypes] = useState<ChargeType[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RoomCharge | null>(null);
  const [deleting, setDeleting] = useState<{ id: string; name: string } | null>(
    null
  );

  const normalizeRow = (raw: unknown): SetupRow => {
    const r = (raw as { room?: Record<string, unknown> }).room ?? {};
    const charges = Array.isArray(r.charges)
      ? (r.charges as Record<string, unknown>[]).map((c) => ({
          id: String(c.id),
          chargeTypeName:
            (c.chargeTypeName as string) ?? (c.chargeType as { name?: string })?.name,
          amount: Number(c.amount ?? 0),
          unit: c.unit == null ? null : Number(c.unit),
        }))
      : [];
    return {
      room: {
        id: String(r.id),
        name: String(r.name ?? ""),
        isCalWater: Boolean(r.isCalWater),
        isCalElectric: Boolean(r.isCalElectric),
        waterRatePerUnit: Number(r.waterRatePerUnit ?? 0),
        electricityRatePerUnit: Number(r.electricityRatePerUnit ?? 0),
        charges,
      },
    };
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<unknown>(endpoints.roomCharges.setup(apartmentId));
      const arr = Array.isArray(res)
        ? res
        : ((res as { data?: unknown[] })?.data ?? []);
      setRows((arr as unknown[]).map(normalizeRow));
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
      .get<Array<{ roomId?: string; id?: string; name: string }>>(
        endpoints.rooms.dropdown(apartmentId)
      )
      .then((res) => {
        const list = toList<{ roomId?: string; id?: string; name: string }>(
          res
        ).items;
        setRooms(list.map((r) => ({ id: r.roomId ?? r.id ?? "", name: r.name })));
      })
      .catch(() => undefined);
    api
      .get(endpoints.chargeTypes.list(apartmentId))
      .then((res) => setChargeTypes(toList<ChargeType>(res).items))
      .catch(() => undefined);
  }, [apartmentId]);

  const updateCharge = (
    roomId: string,
    chargeId: string,
    patch: Partial<SetupCharge>
  ) => {
    setRows((prev) =>
      prev.map((row) =>
        row.room.id !== roomId
          ? row
          : {
              room: {
                ...row.room,
                charges: row.room.charges.map((c) =>
                  c.id === chargeId ? { ...c, ...patch } : c
                ),
              },
            }
      )
    );
  };

  const updateRoomFlag = (
    roomId: string,
    key: "isCalWater" | "isCalElectric",
    value: boolean
  ) => {
    setRows((prev) =>
      prev.map((row) =>
        row.room.id !== roomId
          ? row
          : { room: { ...row.room, [key]: value } }
      )
    );
  };

  const handleSave = async () => {
    const charges = rows.flatMap((row) =>
      row.room.charges.map((c) => ({
        id: c.id,
        amount: c.amount,
        unit: c.unit,
        isCalWater: row.room.isCalWater,
        isCalElectric: row.room.isCalElectric,
      }))
    );
    if (charges.length === 0) {
      toast.error("ยังไม่มีค่าใช้จ่ายให้บันทึก");
      return;
    }
    setSaving(true);
    try {
      await api.patch(endpoints.roomCharges.setup(apartmentId), { charges });
      toast.success("บันทึกการตั้งค่าสำเร็จ");
      load();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await api.delete(endpoints.roomCharges.remove(apartmentId, deleting.id));
      toast.success("ลบค่าใช้จ่ายสำเร็จ");
      load();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="ค่าใช้จ่ายประจำห้อง"
        description="ตั้งค่ายอดเรียกเก็บประจำ และเลือกว่าจะคิดค่าน้ำ-ค่าไฟตามมิเตอร์หรือไม่"
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
              disabled={rooms.length === 0 || chargeTypes.length === 0}
            >
              <Plus className="h-4 w-4" />
              เพิ่มค่าใช้จ่าย
            </Button>
            <Button onClick={handleSave} disabled={saving || loading}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              บันทึกทั้งหมด
            </Button>
          </div>
        }
      />

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          title="ยังไม่มีห้องสำหรับตั้งค่า"
          description="เพิ่มห้องพักก่อน จึงจะตั้งค่าค่าใช้จ่ายประจำได้"
        />
      ) : (
        <div className="space-y-4">
          {rows.map(({ room }) => (
            <Card key={room.id}>
              <CardContent className="p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="font-semibold text-gray-900">
                    ห้อง {room.name}
                  </h3>
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 text-sm">
                      <Droplet className="h-4 w-4 text-info" />
                      <span className="text-gray-700">
                        คิดค่าน้ำ ({formatCurrency(room.waterRatePerUnit)}/หน่วย)
                      </span>
                      <Switch
                        checked={room.isCalWater}
                        onCheckedChange={(v) =>
                          updateRoomFlag(room.id, "isCalWater", v)
                        }
                        disabled={room.charges.length === 0}
                      />
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <Zap className="h-4 w-4 text-warning" />
                      <span className="text-gray-700">
                        คิดค่าไฟ (
                        {formatCurrency(room.electricityRatePerUnit)}/หน่วย)
                      </span>
                      <Switch
                        checked={room.isCalElectric}
                        onCheckedChange={(v) =>
                          updateRoomFlag(room.id, "isCalElectric", v)
                        }
                        disabled={room.charges.length === 0}
                      />
                    </label>
                  </div>
                </div>

                {room.charges.length === 0 ? (
                  <p className="mt-4 text-sm text-gray-500">
                    ยังไม่มีค่าใช้จ่ายประจำสำหรับห้องนี้
                  </p>
                ) : (
                  <div className="mt-4 space-y-2">
                    {room.charges.map((c) => (
                      <div
                        key={c.id}
                        className="grid grid-cols-1 items-end gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3 sm:grid-cols-12"
                      >
                        <div className="sm:col-span-5">
                          <p className="text-sm font-medium text-gray-900">
                            {c.chargeTypeName ?? "ค่าใช้จ่าย"}
                          </p>
                        </div>
                        <div className="sm:col-span-3">
                          <label className="text-xs text-gray-500">
                            ยอดเรียกเก็บ
                          </label>
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            value={c.amount}
                            onChange={(e) =>
                              updateCharge(room.id, c.id, {
                                amount: Number(e.target.value),
                              })
                            }
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-xs text-gray-500">หน่วย</label>
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            value={c.unit ?? ""}
                            onChange={(e) =>
                              updateCharge(room.id, c.id, {
                                unit:
                                  e.target.value === ""
                                    ? null
                                    : Number(e.target.value),
                              })
                            }
                          />
                        </div>
                        <div className="flex gap-1 sm:col-span-2 sm:justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setEditing({
                                id: c.id,
                                apartmentId,
                                roomId: room.id,
                                chargeTypeId: "",
                                amount: c.amount,
                                unit: c.unit,
                              });
                              setFormOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() =>
                              setDeleting({
                                id: c.id,
                                name: c.chargeTypeName ?? "ค่าใช้จ่าย",
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
        onSaved={load}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="ลบค่าใช้จ่าย"
        description={`ต้องการลบ "${deleting?.name}" ออกจากห้องนี้ใช่หรือไม่?`}
        confirmLabel="ลบ"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}
