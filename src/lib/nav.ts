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
  Tags,
  TrendingUp,
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
  /**
   * feature code ของแผนที่ต้องมีถึงจะโชว์ section นี้ (ตรงกับ plan_features ฝั่ง backend)
   * ไม่ระบุ = โชว์เสมอ · การซ่อนเป็นแค่ UX — backend บังคับสิทธิ์จริง
   */
  feature?: string;
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
    feature: "billing",
    items: [
      { label: "nav-charge-types", segment: "charge-types", icon: Tags },
      { label: "nav-room-charges", segment: "room-charges", icon: Wallet },
      { label: "nav-invoice-setups", segment: "invoice-setups", icon: Settings2 },
    ],
  },
  {
    title: "nav-section-billing",
    feature: "billing",
    items: [
      { label: "nav-billing-periods", segment: "billing-periods", icon: FileText },
      { label: "nav-invoices", segment: "invoices", icon: Receipt },
    ],
  },
  {
    title: "nav-section-finance",
    feature: "finance",
    items: [
      { label: "nav-finance", segment: "finance", icon: TrendingUp },
      {
        label: "nav-payment-accounts",
        segment: "payment-accounts",
        icon: Landmark,
      },
      {
        label: "nav-transaction-categories",
        segment: "transaction-categories",
        icon: Tags,
      },
      {
        label: "nav-tenant-deposits",
        segment: "tenant-deposits",
        icon: PiggyBank,
      },
    ],
  },
];

export const dashboardNavIcon = Building2;
