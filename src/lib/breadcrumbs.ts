import { apartmentNav } from "@/lib/nav";

export interface BreadcrumbSegment {
  labelCode: string;
  href?: string;
  /** When set, shown instead of t(labelCode) */
  labelText?: string;
}

const SEGMENT_LABEL: Record<string, string> = {};
for (const section of apartmentNav) {
  for (const item of section.items) {
    SEGMENT_LABEL[item.segment || "__overview__"] = item.label;
  }
}

function segmentLabel(segment: string): string {
  if (segment === "" || segment === "__overview__") {
    return SEGMENT_LABEL["__overview__"] ?? "nav-apartment-dashboard";
  }
  return SEGMENT_LABEL[segment] ?? segment;
}

/**
 * Build breadcrumb segments from a dashboard pathname.
 * Optional tailLabel overrides the last crumb (detail pages).
 */
export function buildBreadcrumbSegments(
  pathname: string,
  options?: {
    apartmentName?: string;
    tailLabel?: string;
  }
): BreadcrumbSegment[] {
  const crumbs: BreadcrumbSegment[] = [
    { labelCode: "breadcrumb-home", href: "/dashboard" },
  ];

  if (pathname === "/dashboard") {
    crumbs.push({ labelCode: "my-apartments" });
    return crumbs;
  }

  const aptMatch = pathname.match(/^\/apartments\/([^/]+)(?:\/(.*))?$/);
  if (!aptMatch) {
    return crumbs;
  }

  const apartmentId = aptMatch[1];
  const rest = aptMatch[2] ?? "";
  const base = `/apartments/${apartmentId}`;

  if (!rest) {
    crumbs.push({
      labelCode: "nav-apartment-dashboard",
      labelText: options?.apartmentName,
    });
    return crumbs;
  }

  crumbs.push({
    labelCode: "nav-apartment-dashboard",
    labelText: options?.apartmentName,
    href: base,
  });

  const parts = rest.split("/").filter(Boolean);
  const section = parts[0];
  const detailId = parts[1];
  const sectionLabel = segmentLabel(section);

  if (parts.length === 1) {
    crumbs.push({ labelCode: sectionLabel });
    return crumbs;
  }

  crumbs.push({
    labelCode: sectionLabel,
    href: `${base}/${section}`,
  });

  if (detailId) {
    crumbs.push({
      labelCode: "breadcrumb-detail",
      labelText: options?.tailLabel,
    });
  }

  return crumbs;
}
