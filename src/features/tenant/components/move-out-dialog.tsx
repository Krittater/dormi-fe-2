"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

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
import { useTenantActions } from "@/hooks/useTenants";
import { useT } from "@/i18n";
import type { Tenant } from "@/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apartmentId: string;
  tenant: Tenant | null;
  onSuccess?: () => void;
}

export function MoveOutDialog({
  open,
  onOpenChange,
  apartmentId,
  tenant,
  onSuccess,
}: Props) {
  const t = useT();
  const { moveOut } = useTenantActions(apartmentId);
  const [date, setDate] = useState("");

  useEffect(() => {
    if (open) setDate(new Date().toISOString().slice(0, 10));
  }, [open]);

  const handleConfirm = () => {
    if (!tenant) return;
    moveOut.mutate(
      { tenantId: tenant.tenantId, moveOutDate: date || undefined },
      {
        onSuccess: () => {
          onSuccess?.();
          onOpenChange(false);
        },
      }
    );
  };

  const tenantName = tenant
    ? `${tenant.user.firstNameTH ?? ""} ${tenant.user.lastNameTH ?? ""}`.trim()
    : "";

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !moveOut.isPending && onOpenChange(o)}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("move-out-tenant")}</DialogTitle>
          <DialogDescription>
            {tenant
              ? t("move-out-description", { name: tenantName })
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
            disabled={moveOut.isPending}
          >
            {t("cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={moveOut.isPending}
          >
            {moveOut.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("confirm-move-out")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
