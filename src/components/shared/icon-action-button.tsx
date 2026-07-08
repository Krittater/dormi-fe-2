"use client";

import type { ReactNode } from "react";

import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface IconActionButtonProps extends Omit<ButtonProps, "aria-label"> {
  label: string;
  children: ReactNode;
  destructive?: boolean;
}

export function IconActionButton({
  label,
  children,
  destructive,
  className,
  variant = "ghost",
  size = "icon",
  ...props
}: IconActionButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      aria-label={label}
      className={cn(destructive && "text-destructive", className)}
      {...props}
    >
      {children}
    </Button>
  );
}
