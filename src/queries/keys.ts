export const qk = {
  plan: {
    me: ["plan", "me"] as const,
  },
  apartments: {
    all: ["apartments"] as const,
    list: () => [...qk.apartments.all, "list"] as const,
    detail: (id: string) => [...qk.apartments.all, "detail", id] as const,
  },
  rooms: {
    all: (apartmentId: string) => ["rooms", apartmentId] as const,
    list: (apartmentId: string, params?: unknown) =>
      [...qk.rooms.all(apartmentId), "list", params] as const,
    overview: (apartmentId: string) =>
      [...qk.rooms.all(apartmentId), "overview"] as const,
    dropdown: (apartmentId: string) =>
      [...qk.rooms.all(apartmentId), "dropdown"] as const,
    detail: (apartmentId: string, roomId: string) =>
      [...qk.rooms.all(apartmentId), "detail", roomId] as const,
  },
  roomTypes: {
    all: (apartmentId: string) => ["roomTypes", apartmentId] as const,
    list: (apartmentId: string, params?: unknown) =>
      [...qk.roomTypes.all(apartmentId), "list", params] as const,
  },
  roomCharges: {
    all: (apartmentId: string) => ["roomCharges", apartmentId] as const,
    setup: (apartmentId: string) =>
      [...qk.roomCharges.all(apartmentId), "setup"] as const,
  },
  chargeTypes: {
    all: (apartmentId: string) => ["chargeTypes", apartmentId] as const,
    list: (apartmentId: string) =>
      [...qk.chargeTypes.all(apartmentId), "list"] as const,
  },
  tenants: {
    all: (apartmentId: string) => ["tenants", apartmentId] as const,
    list: (apartmentId: string, params?: unknown) =>
      [...qk.tenants.all(apartmentId), "list", params] as const,
  },
  meters: {
    all: (apartmentId: string) => ["meters", apartmentId] as const,
    list: (apartmentId: string) => [...qk.meters.all(apartmentId), "list"] as const,
    readings: (apartmentId: string, meterId: string) =>
      [...qk.meters.all(apartmentId), "readings", meterId] as const,
    byBillingPeriod: (apartmentId: string, billingPeriodId: string) =>
      [...qk.meters.all(apartmentId), "byBillingPeriod", billingPeriodId] as const,
  },
  billingPeriods: {
    all: (apartmentId: string) => ["billingPeriods", apartmentId] as const,
    list: (apartmentId: string) =>
      [...qk.billingPeriods.all(apartmentId), "list"] as const,
    dropdown: (apartmentId: string) =>
      [...qk.billingPeriods.all(apartmentId), "dropdown"] as const,
    meterDropdown: (apartmentId: string) =>
      [...qk.billingPeriods.all(apartmentId), "meterDropdown"] as const,
    detail: (apartmentId: string, billingPeriodId: string) =>
      [...qk.billingPeriods.all(apartmentId), "detail", billingPeriodId] as const,
  },
  invoices: {
    all: (apartmentId: string) => ["invoices", apartmentId] as const,
    list: (apartmentId: string, params?: unknown) =>
      [...qk.invoices.all(apartmentId), "list", params] as const,
    detail: (apartmentId: string, invoiceId: string) =>
      [...qk.invoices.all(apartmentId), "detail", invoiceId] as const,
    billTypes: (apartmentId: string) =>
      [...qk.invoices.all(apartmentId), "billTypes"] as const,
    formDropdowns: (apartmentId: string) =>
      [...qk.invoices.all(apartmentId), "formDropdowns"] as const,
  },
  invoiceSetups: {
    all: (apartmentId: string) => ["invoiceSetups", apartmentId] as const,
    list: (apartmentId: string) =>
      [...qk.invoiceSetups.all(apartmentId), "list"] as const,
  },
  paymentAccounts: {
    all: (apartmentId: string) => ["paymentAccounts", apartmentId] as const,
    list: (apartmentId: string) =>
      [...qk.paymentAccounts.all(apartmentId), "list"] as const,
  },
  transactionCategories: {
    all: (apartmentId: string) =>
      ["transactionCategories", apartmentId] as const,
    list: (apartmentId: string) =>
      [...qk.transactionCategories.all(apartmentId), "list"] as const,
  },
  finance: {
    all: (apartmentId: string) => ["finance", apartmentId] as const,
    summary: (apartmentId: string, params?: unknown) =>
      [...qk.finance.all(apartmentId), "summary", params] as const,
  },
  accountingPeriods: {
    all: (apartmentId: string) => ["accountingPeriods", apartmentId] as const,
    list: (apartmentId: string) =>
      [...qk.accountingPeriods.all(apartmentId), "list"] as const,
  },
  auditLogs: {
    all: (apartmentId: string) => ["auditLogs", apartmentId] as const,
    list: (apartmentId: string, params?: unknown) =>
      [...qk.auditLogs.all(apartmentId), "list", params] as const,
  },
  incomes: {
    all: (apartmentId: string) => ["incomes", apartmentId] as const,
    list: (apartmentId: string, params?: unknown) =>
      [...qk.incomes.all(apartmentId), "list", params] as const,
  },
  expenses: {
    all: (apartmentId: string) => ["expenses", apartmentId] as const,
    list: (apartmentId: string, params?: unknown) =>
      [...qk.expenses.all(apartmentId), "list", params] as const,
  },
  tenantDeposits: {
    all: (apartmentId: string) => ["tenantDeposits", apartmentId] as const,
    list: (apartmentId: string) =>
      [...qk.tenantDeposits.all(apartmentId), "list"] as const,
  },
} as const;
