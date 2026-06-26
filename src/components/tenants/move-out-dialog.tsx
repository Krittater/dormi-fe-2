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
import { getApiErrorMessage } from "@/lib/format";
import type { Tenant } from "@/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apartmentId: string;
  tenant: Tenant | null;
  onDone: () => void;
}

export function MoveOutDialog({
  open,
  onOpenChange,
  apartmentId,
  tenant,
  onDone,
}: Props) {
  const [date, setDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) setDate(new Date().toISOString().slice(0, 10));
  }, [open]);

  const handleConfirm = async () => {
    if (!tenant) return;
    setSubmitting(true);
    try {
      await api.patch(endpoints.tenants.moveOut(tenant.id, apartmentId), {
        moveOutDate: date || undefined,
      });
      toast.success("บันทึกการย้ายออกสำเร็จ");
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
          <DialogTitle>ย้ายผู้เช่าออก</DialogTitle>
          <DialogDescription>
            {tenant
              ? `บันทึกการย้ายออกของ ${tenant.firstNameTH} ${tenant.lastNameTH}`
              : ""}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="moveOutDate">วันที่ย้ายออก</Label>
          <Input
            id="moveOutDate"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            ยกเลิก
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={submitting}
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            ยืนยันย้ายออก
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
