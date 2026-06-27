import {
  Building2,
  DoorOpen,
  FileText,
  Gauge,
  LayoutGrid,
  ListTree,
  Receipt,
  Settings2,
  Tags,
  Users,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  label: string;
  segment: string;
  icon: LucideIcon;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const apartmentNav: NavSection[] = [
  {
    title: "nav-section-overview",
    items: [{ label: "nav-apartment-dashboard", segment: "", icon: LayoutGrid }],
  },
  {
    title: "nav-section-room-management",
    items: [
      { label: "nav-rooms", segment: "rooms", icon: DoorOpen },
      { label: "nav-room-types", segment: "room-types", icon: ListTree },
      { label: "nav-tenants", segment: "tenants", icon: Users },
      { label: "nav-meters", segment: "meters", icon: Gauge },
    ],
  },
  {
    title: "nav-section-charge-settings",
    items: [
      { label: "nav-charge-types", segment: "charge-types", icon: Tags },
      { label: "nav-room-charges", segment: "room-charges", icon: Wallet },
      { label: "nav-invoice-setups", segment: "invoice-setups", icon: Settings2 },
    ],
  },
  {
    title: "nav-section-billing",
    items: [
      { label: "nav-billing-periods", segment: "billing-periods", icon: FileText },
      { label: "nav-invoices", segment: "invoices", icon: Receipt },
    ],
  },
];

export const dashboardNavIcon = Building2;
