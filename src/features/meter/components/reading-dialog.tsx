"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
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
import { useMeterActions } from "@/hooks/useMeters";
import { formatNumber, getApiErrorMessage } from "@/lib/format";
import { useT } from "@/i18n";
import type { MeterReading } from "@/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apartmentId: string;
  reading: MeterReading | null;
  mode: "record" | "edit";
  onSuccess?: () => void;
}

export function ReadingDialog({
  open,
  onOpenChange,
  apartmentId,
  reading,
  mode,
  onSuccess,
}: Props) {
  const t = useT();
  const { recordReading, updateReading } = useMeterActions(apartmentId);
  const [previousValue, setPreviousValue] = useState("");
  const [currentValue, setCurrentValue] = useState("");

  useEffect(() => {
    if (open && reading) {
      setPreviousValue(
        reading.previousValue != null ? String(reading.previousValue) : ""
      );
      setCurrentValue(
        reading.currentValue != null ? String(reading.currentValue) : ""
      );
    }
  }, [open, reading]);

  const prev = Number(previousValue);
  const curr = Number(currentValue);
  const units =
    previousValue !== "" && currentValue !== "" && curr >= prev
      ? curr - prev
      : null;

  const submitting = recordReading.isPending || updateReading.isPending;

  const handleSubmit = async () => {
    if (!reading) return;
    if (previousValue === "" || currentValue === "") {
      toast.error(t("enter-meter-values"));
      return;
    }
    if (curr < prev) {
      toast.error(t("current-not-less-than-previous"));
      return;
    }
    try {
      const body = { previousValue: prev, currentValue: curr };
      if (mode === "record") {
        await recordReading.mutateAsync({ meterReadingId: reading.id, body });
      } else {
        await updateReading.mutateAsync({
          meterId: reading.meterId,
          meterReadingId: reading.id,
          body,
        });
      }
      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !submitting && onOpenChange(o)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "record"
              ? t("record-meter-reading")
              : t("edit-meter-reading")}
          </DialogTitle>
          <DialogDescription>
            {reading?.roomName
              ? `${t("room-with-name", { name: reading.roomName })} · `
              : ""}
            {reading?.meterType ?? ""}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prev">{t("previous-meter-value")}</Label>
            <Input
              id="prev"
              type="number"
              min={0}
              step="0.01"
              value={previousValue}
              onChange={(e) => setPreviousValue(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="curr">{t("current-meter-value")}</Label>
            <Input
              id="curr"
              type="number"
              min={0}
              step="0.01"
              value={currentValue}
              onChange={(e) => setCurrentValue(e.target.value)}
            />
          </div>
          <div className="rounded-lg bg-gray-50 px-3 py-2 text-sm">
            <span className="text-gray-500">{t("units-used")}: </span>
            <span className="font-medium text-gray-900">
              {units != null ? formatNumber(units) : "-"}
            </span>
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
