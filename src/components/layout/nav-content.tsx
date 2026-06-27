"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { apartmentNav } from "@/lib/nav";
import { useT } from "@/i18n";

interface NavContentProps {
  apartmentId: string | null;
  onNavigate?: () => void;
}

export function NavContent({ apartmentId, onNavigate }: NavContentProps) {
  const pathname = usePathname();
  const t = useT();

  const isActive = (segment: string) => {
    if (!apartmentId) return false;
    const base = `/apartments/${apartmentId}`;
    const href = segment ? `${base}/${segment}` : base;
    if (segment === "") return pathname === base;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <nav className="flex flex-col gap-6 px-3 py-4">
      {apartmentNav.map((section) => (
        <div key={section.title}>
          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            {t(section.title)}
          </p>
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
                    <span className="truncate">{t(item.label)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
