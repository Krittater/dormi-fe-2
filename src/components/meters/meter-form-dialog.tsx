"use client";

import { useEffect, useState } from "react";
import { Droplets, Loader2, Zap } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { toList } from "@/lib/list";
import { getApiErrorMessage } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n";

interface RoomOption {
  id: string;
  name: string;
}

interface RawRoomOption {
  id?: string;
  roomId?: string;
  name?: string;
  label?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apartmentId: string;
  onSaved: () => void;
}

const TYPES = [
  { value: "electricity", labelKey: "meter-type-electricity", Icon: Zap },
  { value: "water", labelKey: "meter-type-water", Icon: Droplets },
] as const;

export function MeterFormDialog({
  open,
  onOpenChange,
  apartmentId,
  onSaved,
}: Props) {
  const t = useT();
  const [rooms, setRooms] = useState<RoomOption[]>([]);
  const [roomId, setRoomId] = useState("");
  const [type, setType] = useState<"electricity" | "water">("electricity");
  const [meterNumber, setMeterNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setRoomId("");
    setType("electricity");
    setMeterNumber("");
    api
      .get(endpoints.rooms.dropdown(apartmentId))
      .then((res) =>
        setRooms(
          toList<RawRoomOption>(res).items.map((r) => ({
            id: r.id ?? r.roomId ?? "",
            name: r.name ?? r.label ?? "",
          }))
        )
      )
      .catch(() => setRooms([]));
  }, [open, apartmentId]);

  const handleSubmit = async () => {
    if (!roomId) {
      toast.error(t("please-select-room"));
      return;
    }
    if (!meterNumber.trim()) {
      toast.error(t("enter-meter-number"));
      return;
    }
    setSubmitting(true);
    try {
      await api.post(endpoints.meters.create(apartmentId), {
        apartmentId,
        roomId,
        type,
        meterNumber: meterNumber.trim(),
      });
      toast.success(t("meter-created"));
      onSaved();
      onOpenChange(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !submitting && onOpenChange(o)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("add-meter")}</DialogTitle>
          <DialogDescription>{t("add-meter-description")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t("meter-type")}</Label>
            <div className="grid grid-cols-2 gap-2">
              {TYPES.map(({ value, labelKey, Icon }) => {
                const selected = type === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setType(value)}
                    aria-pressed={selected}
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors",
                      selected
                        ? value === "electricity"
                          ? "border-primary bg-primary-tint text-primary"
                          : "border-info bg-[#EFF6FF] text-[#1D4ED8]"
                        : "border-gray-200 text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {t(labelKey)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="meter-room">{t("room")}</Label>
            <Select value={roomId} onValueChange={setRoomId}>
              <SelectTrigger id="meter-room">
                <SelectValue placeholder={t("select-room")} />
              </SelectTrigger>
              <SelectContent>
                {rooms.length === 0 ? (
                  <div className="px-2 py-1.5 text-sm text-gray-500">
                    {t("no-rooms-for-meter")}
                  </div>
                ) : (
                  rooms.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="meter-number">{t("meter-number")}</Label>
            <Input
              id="meter-number"
              value={meterNumber}
              onChange={(e) => setMeterNumber(e.target.value)}
              placeholder={t("meter-number-placeholder")}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            {t("cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
