"use client";

import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n";

export interface FilterBarFilter {
  id: string;
  node: ReactNode;
}

interface FilterBarProps {
  search?: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
  };
  filters?: FilterBarFilter[];
  actions?: ReactNode;
  onClear?: () => void;
  showClear?: boolean;
  className?: string;
}

export function FilterBar({
  search,
  filters = [],
  actions,
  onClear,
  showClear,
  className,
}: FilterBarProps) {
  const t = useT();
  const canClear = showClear ?? Boolean(onClear);

  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center",
        className
      )}
    >
      {search && (
        <Input
          placeholder={search.placeholder}
          value={search.value}
          onChange={(e) => search.onChange(e.target.value)}
          className={cn("sm:max-w-xs", search.className)}
        />
      )}
      {filters.map((f) => (
        <div key={f.id}>{f.node}</div>
      ))}
      <div className="flex flex-1 flex-wrap items-center gap-2 sm:justify-end">
        {canClear && onClear && (
          <Button type="button" variant="ghost" size="sm" onClick={onClear}>
            {t("clear-filters")}
          </Button>
        )}
        {actions}
      </div>
    </div>
  );
}
