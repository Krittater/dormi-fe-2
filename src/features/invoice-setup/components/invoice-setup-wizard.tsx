"use client";

import { useCallback, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useInvoiceSetupActions } from "@/hooks/useInvoices";
import { useT } from "@/i18n";
import {
  invoiceSetupDefaultValues,
  RATE_INVOICE_TYPES,
  type InvoiceSetupFormValues,
} from "@/schemas/invoice-setup.schema";
import { INVOICE_TYPE_CODES, InvoiceType } from "@/types";

const WIZARD_STEPS = ["type", "schedule", "rate", "preview"] as const;
type WizardStep = (typeof WIZARD_STEPS)[number];

interface InvoiceSetupWizardProps {
  apartmentId: string;
  /** เปิดฟอร์มกรอกเองสำหรับคนที่ไม่ต้องการ wizard */
  onManual?: () => void;
}

export function InvoiceSetupWizard({
  apartmentId,
  onManual,
}: InvoiceSetupWizardProps) {
  const t = useT();
  const { create } = useInvoiceSetupActions(apartmentId);
  const [stepIndex, setStepIndex] = useState(0);
  const [values, setValues] = useState<InvoiceSetupFormValues>(() => ({
    ...invoiceSetupDefaultValues,
    effectiveFrom: new Date().toISOString().slice(0, 10),
  }));

  const step = WIZARD_STEPS[stepIndex]!;
  const needsRate = RATE_INVOICE_TYPES.includes(
    values.type as (typeof RATE_INVOICE_TYPES)[number]
  );

  const stepLabels: Record<WizardStep, string> = {
    type: t("invoice-setup-wizard-step-type"),
    schedule: t("invoice-setup-wizard-step-schedule"),
    rate: t("invoice-setup-wizard-step-rate"),
    preview: t("invoice-setup-wizard-step-preview"),
  };

  const canNext = useMemo(() => {
    if (step === "type") return Boolean(values.type);
    if (step === "schedule") {
      return (
        values.cutOffDate >= 1 &&
        values.issueDate >= 1 &&
        values.dueDate >= 1 &&
        Boolean(values.effectiveFrom)
      );
    }
    if (step === "rate") {
      if (!needsRate) return true;
      return Boolean(values.ratePerUnit?.trim());
    }
    return true;
  }, [needsRate, step, values]);

  const goNext = useCallback(() => {
    if (step === "schedule" && !needsRate) {
      setStepIndex(WIZARD_STEPS.indexOf("preview"));
      return;
    }
    setStepIndex((i) => Math.min(i + 1, WIZARD_STEPS.length - 1));
  }, [needsRate, step]);

  const goBack = useCallback(() => {
    if (step === "preview" && !needsRate) {
      setStepIndex(WIZARD_STEPS.indexOf("schedule"));
      return;
    }
    setStepIndex((i) => Math.max(i - 1, 0));
  }, [needsRate, step]);

  const handleSubmit = useCallback(() => {
    const ratePayload =
      needsRate && values.ratePerUnit
        ? Number(values.ratePerUnit)
        : undefined;
    create.mutate({
      type: values.type,
      cutOffDate: values.cutOffDate,
      issueDate: values.issueDate,
      dueDate: values.dueDate,
      effectiveFrom: values.effectiveFrom,
      effectiveTo: values.effectiveTo || undefined,
      isActive: values.isActive,
      ratePerUnit: ratePayload,
    });
  }, [create, needsRate, values]);

  return (
    <Card>
      <CardContent className="space-y-6 p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              {t("invoice-setup-wizard-title")}
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              {t("invoice-setup-wizard-desc")}
            </p>
          </div>
          {onManual && (
            <Button type="button" variant="ghost" size="sm" onClick={onManual}>
              {t("fill-manually")}
            </Button>
          )}
        </div>

        <ol className="flex flex-wrap gap-2">
          {WIZARD_STEPS.filter((s) => s !== "rate" || needsRate).map(
            (s, index) => (
              <li
                key={s}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium",
                  s === step
                    ? "bg-primary text-primary-foreground"
                    : "bg-gray-100 text-gray-600"
                )}
              >
                {index + 1}. {stepLabels[s]}
              </li>
            )
          )}
        </ol>

        {step === "type" && (
          <div className="grid gap-3 sm:grid-cols-3">
            {[InvoiceType.RENT, InvoiceType.ELECTRICITY, InvoiceType.WATER].map(
              (type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setValues((v) => ({ ...v, type }))}
                  className={cn(
                    "rounded-lg border p-4 text-left transition-colors",
                    values.type === type
                      ? "border-primary bg-primary-tint"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <p className="text-sm font-semibold text-gray-900">
                    {t(INVOICE_TYPE_CODES[type])}
                  </p>
                  <p className="mt-1 text-xs text-gray-600">
                    {t(
                      type === InvoiceType.RENT
                        ? "invoice-setup-type-hint-rent"
                        : type === InvoiceType.ELECTRICITY
                          ? "invoice-setup-type-hint-electricity"
                          : "invoice-setup-type-hint-water"
                    )}
                  </p>
                </button>
              )
            )}
          </div>
        )}

        {step === "schedule" && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              {t("invoice-setup-wizard-schedule-hint")}
            </p>
            <div className="grid grid-cols-3 gap-3">
              <label className="space-y-1 text-sm">
                <span className="font-medium text-gray-700">
                  {t("cutoff-date")}
                </span>
                <Input
                  type="number"
                  min={1}
                  max={31}
                  value={values.cutOffDate}
                  onChange={(e) =>
                    setValues((v) => ({
                      ...v,
                      cutOffDate: Number(e.target.value),
                    }))
                  }
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium text-gray-700">
                  {t("issue-date")}
                </span>
                <Input
                  type="number"
                  min={1}
                  max={31}
                  value={values.issueDate}
                  onChange={(e) =>
                    setValues((v) => ({
                      ...v,
                      issueDate: Number(e.target.value),
                    }))
                  }
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium text-gray-700">
                  {t("due-date")}
                </span>
                <Input
                  type="number"
                  min={1}
                  max={31}
                  value={values.dueDate}
                  onChange={(e) =>
                    setValues((v) => ({
                      ...v,
                      dueDate: Number(e.target.value),
                    }))
                  }
                />
              </label>
            </div>
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-gray-700">
                {t("effective-from")}
              </span>
              <Input
                type="date"
                value={values.effectiveFrom}
                onChange={(e) =>
                  setValues((v) => ({ ...v, effectiveFrom: e.target.value }))
                }
              />
            </label>
          </div>
        )}

        {step === "rate" && needsRate && (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              {t("invoice-setup-wizard-rate-hint")}
            </p>
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-gray-700">
                {t("rate-per-unit-baht")}
              </span>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={values.ratePerUnit ?? ""}
                onChange={(e) =>
                  setValues((v) => ({ ...v, ratePerUnit: e.target.value }))
                }
              />
            </label>
          </div>
        )}

        {step === "preview" && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm font-medium text-gray-900">
              {t("invoice-setup-wizard-preview-title")}
            </p>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li>
                {t("type")}: {t(INVOICE_TYPE_CODES[values.type])}
              </li>
              <li>
                {t("invoice-setup-wizard-preview-timeline", {
                  cutoff: String(values.cutOffDate),
                  issue: String(values.issueDate),
                  due: String(values.dueDate),
                })}
              </li>
              {needsRate && values.ratePerUnit && (
                <li>
                  {t("rate-per-unit")}: {values.ratePerUnit} {t("baht")}
                </li>
              )}
              <li>
                {t("effective-from")}: {values.effectiveFrom}
              </li>
            </ul>
          </div>
        )}

        <div className="flex justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={goBack}
            disabled={stepIndex === 0 || create.isPending}
          >
            {t("back-step")}
          </Button>
          {step === "preview" ? (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={create.isPending}
            >
              {create.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {t("create-setup")}
            </Button>
          ) : (
            <Button type="button" onClick={goNext} disabled={!canNext}>
              {t("next")}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
