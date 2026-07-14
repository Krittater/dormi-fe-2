"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useApartmentIdFromPath } from "@/hooks/use-apartment-id";
import { apartmentNav } from "@/lib/nav";
import { useT } from "@/i18n";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

interface CommandPaletteProps {
  onAddRoom?: () => void;
  onAddTenant?: () => void;
  onRecordTransaction?: () => void;
}

export function CommandPalette(_props: CommandPaletteProps) {
  const t = useT();
  const router = useRouter();
  const apartmentId = useApartmentIdFromPath();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const navItems = useMemo(() => {
    if (!apartmentId) return [];
    const base = `/apartments/${apartmentId}`;
    return apartmentNav.flatMap((section) =>
      section.items.map((item) => ({
        label: t(item.label),
        href: item.segment ? `${base}/${item.segment}` : base,
        icon: item.icon,
      }))
    );
  }, [apartmentId, t]);

  const run = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router]
  );

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder={t("command-palette-placeholder")} />
      <CommandList>
        <CommandEmpty>{t("no-data")}</CommandEmpty>
        {navItems.length > 0 && (
          <CommandGroup heading={t("command-navigate")}>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <CommandItem
                  key={item.href}
                  value={item.label}
                  onSelect={() => run(item.href)}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}
        {apartmentId && (
          <>
            <CommandSeparator />
            <CommandGroup heading={t("command-create")}>
              <CommandItem
                value={t("command-add-room")}
                onSelect={() =>
                  run(`/apartments/${apartmentId}/rooms`)
                }
              >
                {t("command-add-room")}
              </CommandItem>
              <CommandItem
                value={t("command-add-tenant")}
                onSelect={() =>
                  run(`/apartments/${apartmentId}/tenants`)
                }
              >
                {t("command-add-tenant")}
              </CommandItem>
              <CommandItem
                value={t("command-record-transaction")}
                onSelect={() =>
                  run(`/apartments/${apartmentId}/finance`)
                }
              >
                {t("command-record-transaction")}
              </CommandItem>
            </CommandGroup>
          </>
        )}
        <CommandSeparator />
        <CommandGroup heading={t("breadcrumb-home")}>
          <CommandItem value={t("my-apartments")} onSelect={() => run("/dashboard")}>
            {t("my-apartments")}
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
