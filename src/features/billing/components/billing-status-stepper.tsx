"use client";

import { cn } from "@/lib/utils";
import { useT } from "@/i18n";
import { BillingPeriodStatus } from "@/types";

const STEPS: BillingPeriodStatus[] = [
  BillingPeriodStatus.OPEN,
  BillingPeriodStatus.GENERATED,
  BillingPeriodStatus.CLOSED,
];

const STEP_LABEL: Record<BillingPeriodStatus, string> = {
  [BillingPeriodStatus.OPEN]: "billing-step-open",
  [BillingPeriodStatus.GENERATED]: "billing-step-generated",
  [BillingPeriodStatus.CLOSED]: "billing-step-closed",
  [BillingPeriodStatus.CANCELLED]: "billing-step-closed",
};

interface BillingStatusStepperProps {
  status: BillingPeriodStatus;
}

export function BillingStatusStepper({ status }: BillingStatusStepperProps) {
  const t = useT();
  const activeIndex = Math.max(
    0,
    STEPS.indexOf(status as (typeof STEPS)[number])
  );

  return (
    <ol className="flex flex-wrap items-center gap-2">
      {STEPS.map((step, index) => {
        const reached = index <= activeIndex;
        return (
          <li key={step} className="flex items-center gap-2">
            <span
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium",
                reached
                  ? "bg-primary text-primary-foreground"
                  : "bg-gray-100 text-gray-600"
              )}
            >
              {t(STEP_LABEL[step])}
            </span>
            {index < STEPS.length - 1 && (
              <span className="text-gray-300" aria-hidden>
                →
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
