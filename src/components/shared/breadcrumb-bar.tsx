"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useBreadcrumbContext } from "@/contexts/breadcrumb.context";
import { useT } from "@/i18n";
import { buildBreadcrumbSegments } from "@/lib/breadcrumbs";
import { useApartmentStore } from "@/stores/apartment.store";

export function BreadcrumbBar() {
  const pathname = usePathname();
  const t = useT();
  const tailFromContext = useBreadcrumbContext()?.tailLabel;
  const apartments = useApartmentStore((s) => s.apartments);

  const apartmentId = pathname.match(/^\/apartments\/([^/]+)/)?.[1];
  const apartmentName = apartmentId
    ? apartments.find((a) => a.id === apartmentId)?.name
    : undefined;

  const segments = buildBreadcrumbSegments(pathname, {
    apartmentName,
    tailLabel: tailFromContext,
  });

  if (segments.length <= 1 && pathname === "/dashboard") {
    // Still show home > my apartments on dashboard
  }

  return (
    <Breadcrumb className="min-w-0">
      <BreadcrumbList>
        {segments.map((seg, i) => {
          const isLast = i === segments.length - 1;
          const label = seg.labelText ?? t(seg.labelCode);

          return (
            <Fragment key={`${seg.labelCode}-${i}`}>
              {i > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {isLast || !seg.href ? (
                  <BreadcrumbPage className="max-w-[200px] truncate sm:max-w-xs">
                    {label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={seg.href}>{label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
