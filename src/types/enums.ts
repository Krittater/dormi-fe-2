export enum UserRole {
  USER = "USER",
  ADMIN = "ADMIN",
  STAFF = "STAFF",
}

export enum RoomStatus {
  AVAILABLE = "available",
  OVERDUE = "overdue",
  RENTED = "rented",
  BOOKED = "booked",
}

export enum BillingPeriodStatus {
  OPEN = "OPEN",
  GENERATED = "GENERATED",
  CLOSED = "CLOSED",
  CANCELLED = "CANCELLED",
}

export const BILLING_PERIOD_STATUS_TRANSITIONS: Record<
  BillingPeriodStatus,
  BillingPeriodStatus[]
> = {
  [BillingPeriodStatus.OPEN]: [
    BillingPeriodStatus.GENERATED,
    BillingPeriodStatus.CANCELLED,
  ],
  [BillingPeriodStatus.GENERATED]: [BillingPeriodStatus.CLOSED],
  [BillingPeriodStatus.CLOSED]: [],
  [BillingPeriodStatus.CANCELLED]: [],
};

export enum BillingPeriodType {
  RENT = "RENT",
  ELECTRICITY = "ELECTRICITY",
  WATER = "WATER",
  UTILITY = "UTILITY",
  SERVICE = "SERVICE",
  OTHER = "OTHER",
}

export enum InvoiceStatus {
  DRAFT = "DRAFT",
  PAID = "PAID",
  UNPAID = "UNPAID",
  OVERDUE = "OVERDUE",
  CANCELLED = "CANCELLED",
}

export enum InvoiceType {
  RENT = "RENT",
  ELECTRICITY = "ELECTRICITY",
  WATER = "WATER",
  UTILITY = "UTILITY",
  SERVICE = "SERVICE",
  OTHER = "OTHER",
}

export enum InvoiceItemType {
  RENT = "RENT",
  ELECTRICITY = "ELECTRICITY",
  WATER = "WATER",
  UTILITY = "UTILITY",
  SERVICE = "SERVICE",
  OTHER = "OTHER",
}

export const INVOICE_ITEM_TYPE_LABELS: Record<InvoiceItemType, string> = {
  [InvoiceItemType.RENT]: "ค่าเช่า",
  [InvoiceItemType.ELECTRICITY]: "ค่าไฟฟ้า",
  [InvoiceItemType.WATER]: "ค่าน้ำ",
  [InvoiceItemType.UTILITY]: "ค่าสาธารณูปโภค",
  [InvoiceItemType.SERVICE]: "ค่าบริการ",
  [InvoiceItemType.OTHER]: "อื่นๆ",
};

export enum MeterReadingStatus {
  NOT_RECORDED = "NOT_RECORDED",
  RECORDED = "RECORDED",
  BILLED = "BILLED",
}

export enum ChargeTypeCategory {
  RENT = "RENT",
  UTILITY = "UTILITY",
  SERVICE = "SERVICE",
  OTHER = "OTHER",
}

export const ROOM_STATUS_LABELS: Record<RoomStatus, string> = {
  [RoomStatus.AVAILABLE]: "ว่าง",
  [RoomStatus.RENTED]: "มีผู้เช่า",
  [RoomStatus.BOOKED]: "จองแล้ว",
  [RoomStatus.OVERDUE]: "ค้างชำระ",
};

export const BILLING_PERIOD_STATUS_LABELS: Record<BillingPeriodStatus, string> =
  {
    [BillingPeriodStatus.OPEN]: "เปิดรอบ",
    [BillingPeriodStatus.GENERATED]: "สร้างบิลแล้ว",
    [BillingPeriodStatus.CLOSED]: "ปิดรอบ",
    [BillingPeriodStatus.CANCELLED]: "ยกเลิก",
  };

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  [InvoiceStatus.DRAFT]: "ฉบับร่าง",
  [InvoiceStatus.UNPAID]: "ยังไม่ชำระ",
  [InvoiceStatus.PAID]: "ชำระแล้ว",
  [InvoiceStatus.OVERDUE]: "เกินกำหนด",
  [InvoiceStatus.CANCELLED]: "ยกเลิก",
};

export const INVOICE_TYPE_LABELS: Record<InvoiceType, string> = {
  [InvoiceType.RENT]: "ค่าเช่า",
  [InvoiceType.ELECTRICITY]: "ค่าไฟฟ้า",
  [InvoiceType.WATER]: "ค่าน้ำ",
  [InvoiceType.UTILITY]: "ค่าสาธารณูปโภค",
  [InvoiceType.SERVICE]: "ค่าบริการ",
  [InvoiceType.OTHER]: "อื่นๆ",
};

export const BILLING_PERIOD_TYPE_LABELS: Record<BillingPeriodType, string> = {
  [BillingPeriodType.RENT]: "ค่าเช่า",
  [BillingPeriodType.ELECTRICITY]: "ค่าไฟฟ้า",
  [BillingPeriodType.WATER]: "ค่าน้ำ",
  [BillingPeriodType.UTILITY]: "ค่าสาธารณูปโภค",
  [BillingPeriodType.SERVICE]: "ค่าบริการ",
  [BillingPeriodType.OTHER]: "อื่นๆ",
};

export const CHARGE_TYPE_CATEGORY_LABELS: Record<ChargeTypeCategory, string> = {
  [ChargeTypeCategory.RENT]: "ค่าเช่า",
  [ChargeTypeCategory.UTILITY]: "ค่าสาธารณูปโภค",
  [ChargeTypeCategory.SERVICE]: "ค่าบริการ",
  [ChargeTypeCategory.OTHER]: "อื่นๆ",
};

export const METER_READING_STATUS_LABELS: Record<MeterReadingStatus, string> = {
  [MeterReadingStatus.NOT_RECORDED]: "ยังไม่จด",
  [MeterReadingStatus.RECORDED]: "จดแล้ว",
  [MeterReadingStatus.BILLED]: "ออกบิลแล้ว",
};
