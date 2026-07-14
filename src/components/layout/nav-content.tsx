"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { apartmentNav } from "@/lib/nav";
import { useOverdueInvoiceCount } from "@/hooks/useOverdueInvoiceCount";
import { useT } from "@/i18n";

const NAV_COLLAPSE_KEY = "dormi-nav-collapsed";

interface NavContentProps {
  apartmentId: string | null;
  onNavigate?: () => void;
}

export function NavContent({ apartmentId, onNavigate }: NavContentProps) {
  const pathname = usePathname();
  const t = useT();
  const overdueCount = useOverdueInvoiceCount();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const hydratedFromStorage = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(NAV_COLLAPSE_KEY);
      if (raw) setCollapsed(JSON.parse(raw) as Record<string, boolean>);
    } catch {
      /* ignore */
    }
    hydratedFromStorage.current = true;
  }, []);

  const toggleSection = useCallback((title: string) => {
    setCollapsed((prev) => ({ ...prev, [title]: !prev[title] }));
  }, []);

  // persist นอก setState updater — updater ต้อง pure (อาจถูก replay ตอน render)
  // ข้ามรอบแรกก่อน hydrate ไม่งั้น {} จะทับค่าที่เคยบันทึกไว้
  useEffect(() => {
    if (!hydratedFromStorage.current) return;
    try {
      localStorage.setItem(NAV_COLLAPSE_KEY, JSON.stringify(collapsed));
    } catch {
      /* ignore */
    }
  }, [collapsed]);

  const isActive = (segment: string) => {
    if (!apartmentId) return false;
    const base = `/apartments/${apartmentId}`;
    const href = segment ? `${base}/${segment}` : base;
    if (segment === "") return pathname === base;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <nav className="flex flex-col gap-4 px-3 py-4">
      {apartmentNav.map((section) => {
        const isCollapsed = collapsed[section.title] ?? false;
        return (
          <div key={section.title}>
            <button
              type="button"
              onClick={() => toggleSection(section.title)}
              className="flex w-full items-center justify-between px-3 pb-2 text-left text-xs font-medium text-gray-600"
            >
              <span>{t(section.title)}</span>
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 transition-transform",
                  isCollapsed && "-rotate-90"
                )}
              />
            </button>
            {!isCollapsed && (
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const base = apartmentId ? `/apartments/${apartmentId}` : "#";
                  const href =
                    apartmentId && item.segment
                      ? `${base}/${item.segment}`
                      : base;
                  const active = isActive(item.segment);
                  const disabled = !apartmentId;
                  const showOverdue =
                    item.segment === "invoices" && overdueCount > 0;
                  return (
                    <li key={item.segment}>
                      <Link
                        href={disabled ? "#" : href}
                        onClick={(e) => {
                          if (disabled) e.preventDefault();
                          else onNavigate?.();
                        }}
                        aria-disabled={disabled}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                          active
                            ? "bg-primary-light text-primary-hover"
                            : "text-gray-700 hover:bg-gray-100",
                          disabled && "cursor-not-allowed opacity-50"
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="truncate flex-1">{t(item.label)}</span>
                        {showOverdue && (
                          <Badge variant="danger" className="ml-auto shrink-0">
                            {overdueCount}
                          </Badge>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </nav>
  );
}
