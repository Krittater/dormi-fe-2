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
import { useT } from "@/i18n";
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
  const t = useT();
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
      toast.success(t("move-out-success"));
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
          <DialogTitle>{t("move-out-tenant")}</DialogTitle>
          <DialogDescription>
            {tenant
              ? t("move-out-description", {
                  name: `${tenant.firstNameTH} ${tenant.lastNameTH}`,
                })
              : ""}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="moveOutDate">{t("move-out-date")}</Label>
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
            {t("cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={submitting}
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("confirm-move-out")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
