"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Building2, Loader2, Menu } from "lucide-react";

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
import { CommandPalette } from "@/components/layout/command-palette";
import { BreadcrumbBar } from "@/components/shared/breadcrumb-bar";
import { BreadcrumbProvider } from "@/contexts/breadcrumb.context";
import { ApartmentSwitcher } from "@/components/layout/apartment-switcher";
import { UserMenu } from "@/components/layout/user-menu";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { ApiError } from "@/api";
import { useApartmentStore } from "@/stores/apartment.store";
import { useAuthStore } from "@/stores/auth.store";
import { useApartmentIdFromPath } from "@/hooks/use-apartment-id";
import { useT } from "@/i18n";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const t = useT();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const fetchApartments = useApartmentStore((s) => s.fetchApartments);
  const setCurrent = useApartmentStore((s) => s.setCurrent);
  const currentApartmentId = useApartmentStore((s) => s.currentApartmentId);
  const pathApartmentId = useApartmentIdFromPath();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isBootstrapping = useAuthStore((s) => s.isBootstrapping);
  const markAuthenticated = useAuthStore((s) => s.markAuthenticated);
  const markUnauthenticated = useAuthStore((s) => s.markUnauthenticated);

  // โหลดโปรไฟล์ที่ persist ไว้ (ชื่อผู้ใช้) หลัง mount — skipHydration กัน SSR mismatch
  useEffect(() => {
    void useAuthStore.persist.rehydrate();
  }, []);

  useEffect(() => {
    fetchApartments()
      .then(() => markAuthenticated())
      .catch((err) => {
        if (err instanceof ApiError && (err.code === 401 || err.code === 403)) {
          markUnauthenticated();
        } else {
          // Non-auth failure (network/server error) — session may still be
          // valid, don't force a logout; let the page's own error state show.
          markAuthenticated();
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchApartments]);

  useEffect(() => {
    if (!isBootstrapping && !isAuthenticated) {
      const redirect = pathname || "/dashboard";
      router.replace(`/login?redirect=${encodeURIComponent(redirect)}`);
    }
  }, [isBootstrapping, isAuthenticated, pathname, router]);

  useEffect(() => {
    if (pathApartmentId && pathApartmentId !== currentApartmentId) {
      setCurrent(pathApartmentId);
    }
  }, [pathApartmentId, currentApartmentId, setCurrent]);

  const activeApartmentId = pathApartmentId ?? currentApartmentId;

  if (isBootstrapping) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <TooltipProvider delayDuration={200}>
      <BreadcrumbProvider>
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
                  aria-label={t("open-menu")}
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
            <LanguageSwitcher />
            <UserMenu />
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-7xl space-y-4">
              <BreadcrumbBar />
              {children}
            </div>
          </main>
        </div>
      </div>
      </BreadcrumbProvider>
      <CommandPalette />
    </TooltipProvider>
  );
}
