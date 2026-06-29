import type {
  BillingPeriodStatus,
  BillingPeriodType,
  ChargeTypeCategory,
  InvoiceStatus,
  InvoiceType,
  MeterReadingStatus,
  RoomStatus,
} from "./enums";

export interface PaginationMeta {
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

export interface Paginated<T> {
  data: T[];
  meta?: PaginationMeta;
}

export interface User {
  id: string;
  email: string;
  phone?: string;
  firstNameTH?: string | null;
  lastNameTH?: string | null;
  firstNameEn?: string | null;
  lastNameEn?: string | null;
}

export interface Apartment {
  id: string;
  name: string;
  province: string;
  district: string;
  subDistrict: string;
  postalCode: string;
  phone?: string | null;
  description?: string | null;
  invoiceCutOffDate: number;
  invoiceDueDate: number;
  electricityCutOffDate: number;
  electricityRatePerUnit: number;
  waterCutOffDate: number;
  waterRatePerUnit: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApartmentOverview {
  id: string;
  name: string;
  address: string;
  totalRooms: number;
  availableRooms: number;
  overdueRooms: number;
  rentedRooms: number;
  bookedRooms: number;
  availableRate: number;
  overdueRate: number;
  rentedRate: number;
  bookedRate: number;
}

export interface RoomType {
  id: string;
  roomTypeId?: string;
  apartmentId: string;
  name: string;
  price: number;
  description?: string | null;
  createdAt?: string;
}

export interface RoomTenantSummary {
  tenantId: string;
  userId?: string;
  fullName: string;
  phone?: string | null;
}

export interface Room {
  id: string;
  roomId?: string;
  apartmentId: string;
  roomTypeId: string;
  roomType?: RoomType | null;
  name: string;
  floor?: string | null;
  description?: string | null;
  status: RoomStatus;
  isActive: boolean;
  isCalWater?: boolean;
  isCalElectric?: boolean;
  price?: number;
  currentTenant?: RoomTenantSummary | null;
  createdAt?: string;
}

export interface RoomOverview {
  total: number;
  available: number;
  rented: number;
  booked: number;
  overdue: number;
  [key: string]: number;
}

export interface DropdownItem {
  id: string;
  name: string;
  [key: string]: unknown;
}

export interface Meter {
  id: string;
  apartmentId: string;
  roomId?: string | null;
  roomName?: string | null;
  type: string;
  meterNumber?: string | null;
  status?: string;
  isActive?: boolean;
  deletedAt?: string | null;
  createdAt?: string;
}

export interface MeterReading {
  id: string;
  meterId: string;
  billingPeriodId?: string | null;
  billingPeriodName?: string | null;
  billingPeriodType?: string | null;
  previousValue: number | null;
  currentValue: number | null;
  unitsUsed: number | null;
  readingStatus: MeterReadingStatus;
  recordedAt?: string | null;
  roomName?: string | null;
  meterType?: string | null;
}

export interface Tenant {
  tenantId: string;
  apartmentId: string;
  roomId: string;
  userId: string;
  moveInDate: string;
  moveOutDate: string | null;
  monthlyRentOverride: number | null;
  depositAmount: number | null;
  contractStartDate: string;
  contractEndDate: string | null;
  isActive: boolean;
  notes: string | null;
  user: User;
  room: Room;
}

export interface ChargeType {
  id: string;
  apartmentId: string;
  name: string;
  description?: string | null;
  category?: ChargeTypeCategory;
  defaultAmount?: number | null;
  isActive: boolean;
}

export interface RoomCharge {
  id: string;
  apartmentId: string;
  roomId: string;
  roomName?: string;
  chargeTypeId: string;
  chargeTypeName?: string;
  amount: number;
  unit?: number | null;
  description?: string | null;
  isCalWater?: boolean;
  isCalElectric?: boolean;
  startDate?: string | null;
  endDate?: string | null;
}

export interface RoomChargeSetupRow {
  room: Room & {
    isCalWater: boolean;
    isCalElectric: boolean;
    waterRatePerUnit: number;
    electricityRatePerUnit: number;
    charges: RoomCharge[];
  };
}

export interface InvoiceSetup {
  id: string;
  apartmentId: string;
  type: InvoiceType;
  cutOffDate: number;
  issueDate: number;
  dueDate: number;
  isActive: boolean;
  effectiveFrom: string;
  effectiveTo?: string | null;
  ratePerUnit?: number | null;
}

export interface BillingPeriod {
  id: string;
  apartmentId: string;
  name?: string;
  type: BillingPeriodType;
  status: BillingPeriodStatus;
  periodYear: number;
  periodMonth: number;
  periodStart?: string | null;
  periodEnd?: string | null;
  dueDate?: string | null;
  invoiceCount?: number;
  createdAt?: string;
}

export interface InvoiceItem {
  id?: string;
  invoiceId?: string;
  chargeTypeId?: string | null;
  name: string;
  description?: string | null;
  itemType?: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Invoice {
  id: string;
  apartmentId: string;
  billingPeriodId?: string | null;
  roomId?: string | null;
  roomName?: string | null;
  tenantName?: string | null;
  invoiceNumber?: string;
  billType?: string;
  type?: InvoiceType;
  status: InvoiceStatus;
  issueDate?: string | null;
  dueDate?: string | null;
  subtotal?: number;
  /** ค่าจริงจาก API (decimal มาเป็น string) — ใช้ normalize เป็น total */
  totalAmount?: number | string;
  total: number;
  paidAt?: string | null;
  items?: InvoiceItem[];
  createdAt?: string;
  updatedAt?: string;
  /** ชื่อผู้สร้าง/แก้ไข (backend แปลงจาก userId มาให้ใน findOne) */
  createdByName?: string | null;
  updatedByName?: string | null;
}

export interface BillTypeDropdownItem {
  code: string;
  name: string;
  description?: string;
}
