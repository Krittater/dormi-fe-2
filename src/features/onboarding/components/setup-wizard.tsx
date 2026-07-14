"use client";

import Link from "next/link";
import { Check, ChevronRight } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n";

const STEPS = [
  { code: "setup-step-room-types", segment: "room-types" },
  { code: "setup-step-rooms", segment: "rooms" },
  { code: "setup-step-charges", segment: "charge-types" },
  { code: "setup-step-invoice-setups", segment: "invoice-setups" },
] as const;

interface SetupWizardProps {
  apartmentId: string;
  /** 0-based index of the first incomplete step */
  activeStep: number;
}

export function SetupWizard({ apartmentId, activeStep }: SetupWizardProps) {
  const t = useT();
  const base = `/apartments/${apartmentId}`;

  return (
    <Card>
      <CardContent className="p-5">
        <h2 className="text-base font-semibold text-gray-900">
          {t("setup-wizard-title")}
        </h2>
        <p className="mt-1 text-sm text-gray-600">{t("setup-wizard-desc")}</p>
        <ol className="mt-4 space-y-2">
          {STEPS.map((step, index) => {
            const done = index < activeStep;
            const current = index === activeStep;
            return (
              <li
                key={step.segment}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-lg border px-4 py-3",
                  current
                    ? "border-primary bg-primary-tint"
                    : "border-gray-200 bg-white"
                )}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold",
                      done
                        ? "bg-primary text-primary-foreground"
                        : current
                          ? "bg-primary text-primary-foreground"
                          : "bg-gray-100 text-gray-600"
                    )}
                  >
                    {done ? <Check className="h-4 w-4" /> : index + 1}
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {t(step.code)}
                  </span>
                </div>
                {(current || done) && (
                  <Button variant={current ? "default" : "outline"} size="sm" asChild>
                    <Link href={`${base}/${step.segment}`}>
                      {current ? t("manage") : t("view-details")}
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                )}
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}

/** Derive wizard progress from coarse counts (best-effort). */
export function deriveSetupStep(counts: {
  roomTypes: number;
  rooms: number;
  chargeTypes: number;
  invoiceSetups: number;
}): number {
  if (counts.roomTypes === 0) return 0;
  if (counts.rooms === 0) return 1;
  if (counts.chargeTypes === 0) return 2;
  if (counts.invoiceSetups === 0) return 3;
  return STEPS.length;
}

export function isSetupIncomplete(counts: {
  roomTypes: number;
  rooms: number;
  chargeTypes: number;
  invoiceSetups: number;
}): boolean {
  return deriveSetupStep(counts) < STEPS.length;
}
