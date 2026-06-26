"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { TooltipProvider } from "@/components/ui/tooltip";
import { NavContent } from "@/components/layout/nav-content";
import { ApartmentSwitcher } from "@/components/layout/apartment-switcher";
import { UserMenu } from "@/components/layout/user-menu";
import { useApartmentStore } from "@/stores/apartment.store";
import { useApartmentIdFromPath } from "@/hooks/use-apartment-id";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const fetchApartments = useApartmentStore((s) => s.fetchApartments);
  const setCurrent = useApartmentStore((s) => s.setCurrent);
  const currentApartmentId = useApartmentStore((s) => s.currentApartmentId);
  const pathApartmentId = useApartmentIdFromPath();

  useEffect(() => {
    fetchApartments().catch(() => undefined);
  }, [fetchApartments]);

  useEffect(() => {
    if (pathApartmentId && pathApartmentId !== currentApartmentId) {
      setCurrent(pathApartmentId);
    }
  }, [pathApartmentId, currentApartmentId, setCurrent]);

  const activeApartmentId = pathApartmentId ?? currentApartmentId;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex min-h-screen bg-gray-50">
        {/* Desktop sidebar */}
        <aside className="hidden w-64 shrink-0 border-r border-gray-200 bg-white lg:block">
          <div className="sticky top-0 flex h-screen flex-col">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 border-b border-gray-200 px-5 py-4"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Building2 className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold text-gray-900">Dormi</span>
            </Link>
            <div className="flex-1 overflow-y-auto scrollbar-thin">
              <NavContent apartmentId={activeApartmentId} />
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top bar */}
          <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-gray-200 bg-white/90 px-4 backdrop-blur sm:px-6">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  aria-label="เปิดเมนู"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <SheetHeader className="border-b border-gray-200">
                  <SheetTitle className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      <Building2 className="h-4 w-4" />
                    </div>
                    Dormi
                  </SheetTitle>
                </SheetHeader>
                <NavContent
                  apartmentId={activeApartmentId}
                  onNavigate={() => setMobileOpen(false)}
                />
              </SheetContent>
            </Sheet>

            <div className="flex-1">
              <ApartmentSwitcher />
            </div>
            <UserMenu />
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-7xl">{children}</div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
