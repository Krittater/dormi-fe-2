import {
  Building2,
  DoorOpen,
  FileText,
  Gauge,
  Landmark,
  LayoutGrid,
  ListTree,
  PiggyBank,
  Receipt,
  Settings2,
  Shield,
  Tags,
  TrendingUp,
  UserCog,
  Users,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { P } from "@/lib/permissions";

export interface NavItem {
  label: string;
  segment: string;
  icon: LucideIcon;
  /** permission code ที่ต้องมีเพื่อเห็นเมนูนี้ (เว้นว่าง = ทุกคนที่ login เห็น) */
  permission?: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const apartmentNav: NavSection[] = [
  {
    title: "nav-section-overview",
    items: [
      {
        label: "nav-apartment-dashboard",
        segment: "",
        icon: LayoutGrid,
        permission: P.apartment.read,
      },
    ],
  },
  {
    title: "nav-section-room-management",
    items: [
      { label: "nav-rooms", segment: "rooms", icon: DoorOpen, permission: P.room.read },
      {
        label: "nav-room-types",
        segment: "room-types",
        icon: ListTree,
        permission: P.roomType.read,
      },
      { label: "nav-tenants", segment: "tenants", icon: Users, permission: P.tenant.read },
      { label: "nav-meters", segment: "meters", icon: Gauge, permission: P.meter.read },
    ],
  },
  {
    title: "nav-section-charge-settings",
    items: [
      {
        label: "nav-charge-types",
        segment: "charge-types",
        icon: Tags,
        permission: "charge-type.read",
      },
      {
        label: "nav-room-charges",
        segment: "room-charges",
        icon: Wallet,
        permission: "room-charge.read",
      },
      {
        label: "nav-invoice-setups",
        segment: "invoice-setups",
        icon: Settings2,
        permission: "invoice-setup.read",
      },
    ],
  },
  {
    title: "nav-section-billing",
    items: [
      {
        label: "nav-billing-periods",
        segment: "billing-periods",
        icon: FileText,
        permission: P.billingPeriod.read,
      },
      { label: "nav-invoices", segment: "invoices", icon: Receipt, permission: P.invoice.read },
    ],
  },
  {
    title: "nav-section-finance",
    items: [
      { label: "nav-finance", segment: "finance", icon: TrendingUp, permission: P.finance.read },
      {
        label: "nav-payment-accounts",
        segment: "payment-accounts",
        icon: Landmark,
        permission: "payment-account.read",
      },
      {
        label: "nav-transaction-categories",
        segment: "transaction-categories",
        icon: Tags,
        permission: "transaction-category.read",
      },
      {
        label: "nav-tenant-deposits",
        segment: "tenant-deposits",
        icon: PiggyBank,
        permission: "tenant-deposit.read",
      },
    ],
  },
  {
    title: "nav-section-staff",
    items: [
      {
        label: "nav-staff",
        segment: "staff",
        icon: UserCog,
        permission: P.staff.read,
      },
    ],
  },
];

/** เมนูระดับแพลตฟอร์ม (นอกหอ) — แสดงเมื่อมี role.read / user.read */
export const platformNav: NavSection[] = [
  {
    title: "nav-section-platform",
    items: [
      {
        label: "nav-admin-users",
        segment: "admin/users",
        icon: Users,
        permission: P.user.read,
      },
      {
        label: "nav-admin-roles",
        segment: "admin/roles",
        icon: Shield,
        permission: P.role.read,
      },
    ],
  },
];

export const dashboardNavIcon = Building2;

/** กรองเมนูตามสิทธิ์ (ตัด item ที่ไม่มีสิทธิ์ + section ที่ว่าง) */
export function filterNavByPermission(
  sections: NavSection[],
  can: (permission: string) => boolean
): NavSection[] {
  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) => !item.permission || can(item.permission)
      ),
    }))
    .filter((section) => section.items.length > 0);
}

/** หา permission ของหน้าจาก segment ใน path (ใช้ทำ route guard) */
export function permissionForSegment(segment: string): string | undefined {
  for (const section of apartmentNav) {
    const item = section.items.find((i) => i.segment === segment);
    if (item) return item.permission;
  }
  return undefined;
}
