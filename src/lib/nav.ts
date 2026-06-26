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
    title: "ภาพรวม",
    items: [{ label: "แดชบอร์ดหอพัก", segment: "", icon: LayoutGrid }],
  },
  {
    title: "จัดการห้องพัก",
    items: [
      { label: "ห้องพัก", segment: "rooms", icon: DoorOpen },
      { label: "ประเภทห้อง", segment: "room-types", icon: ListTree },
      { label: "ผู้เช่า", segment: "tenants", icon: Users },
      { label: "มิเตอร์", segment: "meters", icon: Gauge },
    ],
  },
  {
    title: "ตั้งค่าค่าใช้จ่าย",
    items: [
      { label: "ประเภทค่าใช้จ่าย", segment: "charge-types", icon: Tags },
      { label: "ค่าใช้จ่ายประจำห้อง", segment: "room-charges", icon: Wallet },
      { label: "รูปแบบใบแจ้งหนี้", segment: "invoice-setups", icon: Settings2 },
    ],
  },
  {
    title: "การเรียกเก็บเงิน",
    items: [
      { label: "รอบบิล", segment: "billing-periods", icon: FileText },
      { label: "ใบแจ้งหนี้", segment: "invoices", icon: Receipt },
    ],
  },
];

export const dashboardNavIcon = Building2;
