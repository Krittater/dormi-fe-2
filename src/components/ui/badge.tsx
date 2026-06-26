import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-gray-100 text-gray-700",
        success: "border-transparent bg-[#D1FAE5] text-[#047857]",
        warning: "border-transparent bg-[#FEF3C7] text-[#B45309]",
        danger: "border-transparent bg-[#FEE2E2] text-[#B91C1C]",
        info: "border-transparent bg-[#DBEAFE] text-[#1D4ED8]",
        outline: "border-gray-200 text-gray-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
