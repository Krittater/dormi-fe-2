import type {
  AccountingPeriodStatus,
  AuditAction,
  BillingPeriodStatus,
  BillingPeriodType,
  ChargeTypeCategory,
  InvoiceStatus,
  InvoiceType,
  MeterReadingStatus,
  MoneyEntryStatus,
  PaymentAccountType,
  RoomStatus,
  TenantDepositStatus,
  TransactionCategoryType,
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

/** การผูก role ที่ผู้ใช้ถืออยู่ (apartmentId=null = ระดับระบบ) */
export interface RoleAssignment {
  code: string;
  apartmentId: string | null;
}

/** ผลลัพธ์ GET /auth/me — สิทธิ์ปัจจุบันของผู้ใช้ */
export interface Me {
  user: {
    userId: string;
    email: string;
    firstNameTH: string | null;
    lastNameTH: string | null;
  };
  isSuperuser: boolean;
  roles: RoleAssignment[];
  /** permission ระดับระบบ (มีผลทุกหอ) */
  permissions: string[];
  /** permission เฉพาะหอ: apartmentId → permission codes */
  apartmentPermissions: Record<string, string[]>;
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

export interface BulkCreateRoomLinePayload {
  clientIndex: number;
  roomTypeId: string;
  name: string;
  floor?: string;
  description?: string;
  status?: RoomStatus;
  isActive?: boolean;
  currentWaterMeterReading: number;
  currentElectricMeterReading: number;
}

export interface BulkCreateRoomsPayload {
  rooms: BulkCreateRoomLinePayload[];
}

export interface BulkCreateRoomFailedItem {
  clientIndex: number;
  name: string;
  reason: string;
  code: string;
}

export interface BulkCreateRoomsResult {
  summary: {
    total: number;
    succeeded: number;
    failed: number;
  };
  created: Room[];
  failed: BulkCreateRoomFailedItem[];
}

export interface BulkDeleteRoomLinePayload {
  clientIndex: number;
  roomId: string;
}

export interface BulkDeleteRoomsPayload {
  rooms: BulkDeleteRoomLinePayload[];
}

export interface BulkDeleteRoomFailedItem {
  clientIndex: number;
  roomId: string;
  reason: string;
  code: string;
}

export interface BulkDeleteRoomSucceededItem {
  clientIndex: number;
  roomId: string;
}

export interface BulkDeleteRoomsResult {
  summary: {
    total: number;
    succeeded: number;
    failed: number;
  };
  deleted: BulkDeleteRoomSucceededItem[];
  failed: BulkDeleteRoomFailedItem[];
}

export interface RoomOverviewSummary {
  totalRooms: number;
  availableRooms: number;
  overdueRooms: number;
  rentedRooms: number;
  bookedRooms: number;
}

export interface RoomOverviewTenant {
  tenantId: string;
  userId: string;
  fullName: string;
  phone?: string | null;
}

export interface RoomOverviewRoom {
  id: string;
  roomNumber: string;
  status: RoomStatus | string;
  building?: string | null;
  floor?: number | string | null;
  tenant?: string | null;
  phone?: string | null;
  activeTenants: RoomOverviewTenant[];
}

export interface RoomOverviewAlert {
  [key: string]: unknown;
}

export interface RoomOverview {
  summary: RoomOverviewSummary;
  alerts: RoomOverviewAlert[];
  rooms: RoomOverviewRoom[];
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
  room: Room | null;
}

export interface ChargeType {
  id: string;
  apartmentId: string;
  name: string;
  description?: string | null;
  category: ChargeTypeCategory;
  defaultAmount?: number | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
  deletedBy?: string | null;
  deletedAt?: string | null;
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

/** Shape returned by GET .../billing-periods: periods grouped by year/month. */
export interface BillingPeriodGroup {
  periodYear: number;
  periodMonth: number;
  periods: BillingPeriod[];
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
  /** ยอดที่รับชำระแล้ว (decimal มาเป็น string) */
  paidAmount?: number | string;
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

// ─── Financial (รายรับ-รายจ่าย) ───
// หมายเหตุ: จำนวนเงิน (decimal) จาก API มาเป็น string

export interface PaymentAccount {
  id: string;
  apartmentId: string;
  name: string;
  type: PaymentAccountType;
  isActive: boolean;
}

export interface TransactionCategory {
  id: string;
  apartmentId: string | null; // null = หมวดกลาง (แก้/ลบไม่ได้ผ่าน UI)
  name: string;
  type: TransactionCategoryType;
  isLiability: boolean;
  isActive: boolean;
}

export interface Income {
  id: string;
  apartmentId: string;
  invoiceId?: string | null;
  tenantId?: string | null;
  roomId?: string | null;
  categoryId: string;
  accountId: string;
  amount: string;
  paidDate: string;
  postingPeriod: string;
  method?: string | null;
  reference?: string | null;
  note?: string | null;
  status: MoneyEntryStatus;
  category?: TransactionCategory | null;
  account?: PaymentAccount | null;
  createdBy?: string | null;
  createdAt?: string;
}

export interface Expense {
  id: string;
  apartmentId: string;
  roomId?: string | null;
  categoryId: string;
  accountId: string;
  amount: string;
  expenseDate: string;
  postingPeriod: string;
  payee?: string | null;
  reference?: string | null;
  attachmentUrl?: string | null;
  note?: string | null;
  status: MoneyEntryStatus;
  category?: TransactionCategory | null;
  account?: PaymentAccount | null;
  room?: Room | null;
  createdBy?: string | null;
  createdAt?: string;
}

export interface TenantDeposit {
  id: string;
  apartmentId: string;
  tenantId: string;
  roomId?: string | null;
  amount: string;
  receivedDate: string;
  status: TenantDepositStatus;
  refundedAmount?: string | null;
  settledDate?: string | null;
  settlementIncomeId?: string | null;
  settlementExpenseId?: string | null;
  note?: string | null;
}

export interface AccountingPeriod {
  id: string;
  apartmentId: string;
  period: string; // YYYY-MM
  status: AccountingPeriodStatus;
  closedAt?: string | null;
  reason?: string | null;
}

export interface AuditLog {
  id: string;
  apartmentId: string | null;
  entityType: string;
  entityId: string;
  action: AuditAction;
  changes?: Record<string, { from: unknown; to: unknown }> | null;
  reason?: string | null;
  userId?: string | null;
  createdAt: string;
}
