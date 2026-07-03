"use client";

import { useMemo, useState } from "react";
import { History, Lock, LockOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  useAccountingPeriodActions,
  useAccountingPeriods,
} from "@/hooks/useAccountingPeriods";
import { useAuditLogs } from "@/hooks/useAuditLogs";
import { useT } from "@/i18n";
import { formatDate } from "@/lib/format";
import { AUDIT_ACTION_CODES, AccountingPeriodStatus, AuditAction } from "@/types";

export function FinanceControls({ apartmentId }: { apartmentId: string }) {
  const t = useT();
  const currentMonth = useMemo(
    () => new Date().toISOString().slice(0, 10).slice(0, 7),
    []
  );

  const { data: periods = [] } = useAccountingPeriods(apartmentId);
  const { close, reopen } = useAccountingPeriodActions(apartmentId);
  const { data: audit } = useAuditLogs(apartmentId, { limit: 8 });

  const [confirmClose, setConfirmClose] = useState(false);
  const [reopenOpen, setReopenOpen] = useState(false);
  const [reason, setReason] = useState("");

  const closed = periods.some(
    (p) => p.period === currentMonth && p.status === AccountingPeriodStatus.CLOSED
  );

  const doClose = () =>
    close.mutate(currentMonth, { onSuccess: () => setConfirmClose(false) });
  const doReopen = () =>
    reopen.mutate(
      { period: currentMonth, reason },
      {
        onSuccess: () => {
          setReopenOpen(false);
          setReason("");
        },
      }
    );

  const auditItems = audit?.items ?? [];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Period lock */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="mb-3 flex items-center gap-2">
          {closed ? (
            <Lock className="h-4 w-4 text-red-500" />
          ) : (
            <LockOpen className="h-4 w-4 text-emerald-500" />
          )}
          <h3 className="text-sm font-semibold text-gray-700">
            {t("period-lock")}
          </h3>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-bold text-gray-900">{currentMonth}</p>
            <Badge variant={closed ? "danger" : "success"}>
              {closed ? t("period-status-closed") : t("period-status-open")}
            </Badge>
          </div>
          {closed ? (
            <Button
              variant="outline"
              onClick={() => setReopenOpen(true)}
              disabled={reopen.isPending}
            >
              <LockOpen className="h-4 w-4" />
              {t("reopen-period")}
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => setConfirmClose(true)}
              disabled={close.isPending}
            >
              <Lock className="h-4 w-4" />
              {t("close-period")}
            </Button>
          )}
        </div>
        <p className="mt-3 text-xs text-gray-400">{t("period-lock-hint")}</p>
      </div>

      {/* Recent audit */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="mb-3 flex items-center gap-2">
          <History className="h-4 w-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-700">
            {t("recent-activity")}
          </h3>
        </div>
        {auditItems.length === 0 ? (
          <p className="text-sm text-gray-400">{t("no-activity")}</p>
        ) : (
          <ul className="space-y-2">
            {auditItems.map((a) => (
              <li
                key={a.id}
                className="flex items-center gap-2 border-b border-gray-50 pb-2 text-sm last:border-none"
              >
                <Badge
                  variant={
                    a.action === AuditAction.VOID ? "danger" : "secondary"
                  }
                  className="shrink-0"
                >
                  {t(AUDIT_ACTION_CODES[a.action] ?? "audit-update")}
                </Badge>
                <span className="text-gray-600">{a.entityType}</span>
                <span className="ml-auto text-xs text-gray-400">
                  {formatDate(a.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={confirmClose}
        onOpenChange={setConfirmClose}
        title={t("close-period")}
        description={t("close-period-description", { period: currentMonth })}
        confirmLabel={t("close-period")}
        onConfirm={doClose}
      />

      <Dialog open={reopenOpen} onOpenChange={setReopenOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("reopen-period")}</DialogTitle>
            <DialogDescription>
              {t("reopen-period-description", { period: currentMonth })}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t("reopen-reason-placeholder")}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setReopenOpen(false)}>
              {t("cancel")}
            </Button>
            <Button
              onClick={doReopen}
              disabled={!reason.trim() || reopen.isPending}
            >
              {t("reopen-period")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
