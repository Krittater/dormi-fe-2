export enum MeterType {
  ELECTRICITY = "electricity",
  WATER = "water",
}

export const METER_TYPE_CODES: Record<MeterType, string> = {
  [MeterType.ELECTRICITY]: "meter-type-electricity",
  [MeterType.WATER]: "meter-type-water",
};

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
  PARTIAL = "PARTIAL",
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

export const INVOICE_ITEM_TYPE_CODES: Record<InvoiceItemType, string> = {
  [InvoiceItemType.RENT]: "item-type-rent",
  [InvoiceItemType.ELECTRICITY]: "item-type-electricity",
  [InvoiceItemType.WATER]: "item-type-water",
  [InvoiceItemType.UTILITY]: "item-type-utility",
  [InvoiceItemType.SERVICE]: "item-type-service",
  [InvoiceItemType.OTHER]: "item-type-other",
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

export const ROOM_STATUS_CODES: Record<RoomStatus, string> = {
  [RoomStatus.AVAILABLE]: "room-status-available",
  [RoomStatus.RENTED]: "room-status-rented",
  [RoomStatus.BOOKED]: "room-status-booked",
  [RoomStatus.OVERDUE]: "room-status-overdue",
};

export const BILLING_PERIOD_STATUS_CODES: Record<BillingPeriodStatus, string> =
  {
    [BillingPeriodStatus.OPEN]: "billing-period-status-open",
    [BillingPeriodStatus.GENERATED]: "billing-period-status-generated",
    [BillingPeriodStatus.CLOSED]: "billing-period-status-closed",
    [BillingPeriodStatus.CANCELLED]: "billing-period-status-cancelled",
  };

export const INVOICE_STATUS_CODES: Record<InvoiceStatus, string> = {
  [InvoiceStatus.DRAFT]: "invoice-status-draft",
  [InvoiceStatus.UNPAID]: "invoice-status-unpaid",
  [InvoiceStatus.PAID]: "invoice-status-paid",
  [InvoiceStatus.PARTIAL]: "invoice-status-partial",
  [InvoiceStatus.OVERDUE]: "invoice-status-overdue",
  [InvoiceStatus.CANCELLED]: "invoice-status-cancelled",
};

export const INVOICE_TYPE_CODES: Record<InvoiceType, string> = {
  [InvoiceType.RENT]: "item-type-rent",
  [InvoiceType.ELECTRICITY]: "item-type-electricity",
  [InvoiceType.WATER]: "item-type-water",
  [InvoiceType.UTILITY]: "item-type-utility",
  [InvoiceType.SERVICE]: "item-type-service",
  [InvoiceType.OTHER]: "item-type-other",
};

export const BILLING_PERIOD_TYPE_CODES: Record<BillingPeriodType, string> = {
  [BillingPeriodType.RENT]: "item-type-rent",
  [BillingPeriodType.ELECTRICITY]: "item-type-electricity",
  [BillingPeriodType.WATER]: "item-type-water",
  [BillingPeriodType.UTILITY]: "item-type-utility",
  [BillingPeriodType.SERVICE]: "item-type-service",
  [BillingPeriodType.OTHER]: "item-type-other",
};

export const CHARGE_TYPE_CATEGORY_CODES: Record<ChargeTypeCategory, string> = {
  [ChargeTypeCategory.RENT]: "item-type-rent",
  [ChargeTypeCategory.UTILITY]: "item-type-utility",
  [ChargeTypeCategory.SERVICE]: "item-type-service",
  [ChargeTypeCategory.OTHER]: "item-type-other",
};

export const METER_READING_STATUS_CODES: Record<MeterReadingStatus, string> = {
  [MeterReadingStatus.NOT_RECORDED]: "meter-status-not-recorded",
  [MeterReadingStatus.RECORDED]: "meter-status-recorded",
  [MeterReadingStatus.BILLED]: "meter-status-billed",
};

// ─── Financial (รายรับ-รายจ่าย) ───

export enum PaymentAccountType {
  CASH = "CASH",
  BANK = "BANK",
  EWALLET = "EWALLET",
}

export const PAYMENT_ACCOUNT_TYPE_CODES: Record<PaymentAccountType, string> = {
  [PaymentAccountType.CASH]: "account-type-cash",
  [PaymentAccountType.BANK]: "account-type-bank",
  [PaymentAccountType.EWALLET]: "account-type-ewallet",
};

export enum TransactionCategoryType {
  INCOME = "INCOME",
  EXPENSE = "EXPENSE",
}

export const TRANSACTION_CATEGORY_TYPE_CODES: Record<
  TransactionCategoryType,
  string
> = {
  [TransactionCategoryType.INCOME]: "category-type-income",
  [TransactionCategoryType.EXPENSE]: "category-type-expense",
};

/** สถานะรายการเงิน (incomes/expenses) — VOID = ยกเลิก (แทนการลบ) */
export enum MoneyEntryStatus {
  POSTED = "POSTED",
  VOID = "VOID",
}

export const MONEY_ENTRY_STATUS_CODES: Record<MoneyEntryStatus, string> = {
  [MoneyEntryStatus.POSTED]: "money-status-posted",
  [MoneyEntryStatus.VOID]: "money-status-void",
};

export enum TenantDepositStatus {
  HELD = "HELD",
  REFUNDED = "REFUNDED",
  FORFEITED = "FORFEITED",
  SETTLED = "SETTLED",
}

export const TENANT_DEPOSIT_STATUS_CODES: Record<TenantDepositStatus, string> =
  {
    [TenantDepositStatus.HELD]: "deposit-status-held",
    [TenantDepositStatus.REFUNDED]: "deposit-status-refunded",
    [TenantDepositStatus.FORFEITED]: "deposit-status-forfeited",
    [TenantDepositStatus.SETTLED]: "deposit-status-settled",
  };

export enum AccountingPeriodStatus {
  OPEN = "OPEN",
  CLOSED = "CLOSED",
}

export enum AuditAction {
  CREATE = "CREATE",
  UPDATE = "UPDATE",
  VOID = "VOID",
  SETTLE = "SETTLE",
  CLOSE_PERIOD = "CLOSE_PERIOD",
  REOPEN_PERIOD = "REOPEN_PERIOD",
}

export const AUDIT_ACTION_CODES: Record<AuditAction, string> = {
  [AuditAction.CREATE]: "audit-create",
  [AuditAction.UPDATE]: "audit-update",
  [AuditAction.VOID]: "audit-void",
  [AuditAction.SETTLE]: "audit-settle",
  [AuditAction.CLOSE_PERIOD]: "audit-close-period",
  [AuditAction.REOPEN_PERIOD]: "audit-reopen-period",
};
