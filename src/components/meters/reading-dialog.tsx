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
import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { formatNumber, getApiErrorMessage } from "@/lib/format";
import type { MeterReading } from "@/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apartmentId: string;
  reading: MeterReading | null;
  mode: "record" | "edit";
  onDone: () => void;
}

export function ReadingDialog({
  open,
  onOpenChange,
  apartmentId,
  reading,
  mode,
  onDone,
}: Props) {
  const [previousValue, setPreviousValue] = useState("");
  const [currentValue, setCurrentValue] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

  const handleSubmit = async () => {
    if (!reading) return;
    if (previousValue === "" || currentValue === "") {
      toast.error("กรุณากรอกเลขมิเตอร์ก่อนและหลัง");
      return;
    }
    if (curr < prev) {
      toast.error("เลขมิเตอร์ปัจจุบันต้องไม่น้อยกว่าเลขก่อนหน้า");
      return;
    }
    setSubmitting(true);
    try {
      const body = { previousValue: prev, currentValue: curr };
      if (mode === "record") {
        await api.post(endpoints.meters.record(reading.id), body);
      } else {
        await api.patch(
          endpoints.meters.updateReading(
            apartmentId,
            reading.meterId,
            reading.id
          ),
          body
        );
      }
      toast.success("บันทึกค่ามิเตอร์สำเร็จ");
      onDone();
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
          <DialogTitle>
            {mode === "record" ? "บันทึกค่ามิเตอร์" : "แก้ไขค่ามิเตอร์"}
          </DialogTitle>
          <DialogDescription>
            {reading?.roomName ? `ห้อง ${reading.roomName} · ` : ""}
            {reading?.meterType ?? ""}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prev">เลขมิเตอร์ก่อนหน้า</Label>
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
            <Label htmlFor="curr">เลขมิเตอร์ปัจจุบัน</Label>
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
            <span className="text-gray-500">หน่วยที่ใช้: </span>
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
            ยกเลิก
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            บันทึก
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
