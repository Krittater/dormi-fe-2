const a = (apartmentId: string) => `/apartments/${apartmentId}`;

export const endpoints = {
  auth: {
    register: () => `/auth/register`,
    login: () => `/auth/login`,
    logout: () => `/auth/logout`,
    myPlan: () => `/auth/me/plan`,
  },
  apartments: {
    list: () => `/apartments`,
    detail: (id: string) => `/apartments/${id}`,
    create: () => `/apartments`,
    update: (id: string) => `/apartments/${id}`,
    remove: (id: string) => `/apartments/${id}`,
  },
  roomTypes: {
    list: (apartmentId: string) => `${a(apartmentId)}/roomTypes`,
    create: (apartmentId: string) => `${a(apartmentId)}/roomTypes`,
    detail: (apartmentId: string, roomTypeId: string) =>
      `${a(apartmentId)}/roomTypes/${roomTypeId}`,
    update: (apartmentId: string, roomTypeId: string) =>
      `${a(apartmentId)}/roomTypes/${roomTypeId}`,
    remove: (apartmentId: string, roomTypeId: string) =>
      `${a(apartmentId)}/roomTypes/${roomTypeId}`,
  },
  rooms: {
    list: (apartmentId: string) => `${a(apartmentId)}/rooms`,
    create: (apartmentId: string) => `${a(apartmentId)}/rooms`,
    bulkCreate: (apartmentId: string) => `${a(apartmentId)}/rooms/bulk`,
    bulkDelete: (apartmentId: string) =>
      `${a(apartmentId)}/rooms/bulk-delete`,
    overview: (apartmentId: string) => `${a(apartmentId)}/rooms/overview`,
    dropdown: (apartmentId: string) => `${a(apartmentId)}/rooms/dropdown`,
    detail: (apartmentId: string, roomId: string) =>
      `${a(apartmentId)}/rooms/${roomId}/detail`,
    byId: (apartmentId: string, roomId: string) =>
      `${a(apartmentId)}/rooms/${roomId}`,
    remove: (apartmentId: string, roomId: string) =>
      `${a(apartmentId)}/rooms/${roomId}`,
    update: (roomId: string) => `/rooms/${roomId}`,
  },
  meters: {
    list: (apartmentId: string) => `${a(apartmentId)}/meters`,
    create: (apartmentId: string) => `${a(apartmentId)}/meters`,
    byBillingPeriod: (apartmentId: string) =>
      `${a(apartmentId)}/meters/readings/by-billing-period`,
    byId: (apartmentId: string, meterId: string) =>
      `${a(apartmentId)}/meters/${meterId}`,
    readings: (apartmentId: string, meterId: string) =>
      `${a(apartmentId)}/meters/${meterId}/readings`,
    updateReading: (
      apartmentId: string,
      meterId: string,
      meterReadingId: string
    ) =>
      `${a(apartmentId)}/meters/${meterId}/readings/${meterReadingId}`,
    remove: (apartmentId: string, meterId: string) =>
      `${a(apartmentId)}/meters/${meterId}`,
    restore: (apartmentId: string, meterId: string) =>
      `${a(apartmentId)}/meters/${meterId}/restore`,
    record: (meterReadingId: string) =>
      `/meter-readings/${meterReadingId}/record`,
  },
  tenants: {
    create: () => `/tenants`,
    list: (apartmentId: string) => `/tenants/apartments/${apartmentId}`,
    detail: (tenantId: string, apartmentId: string) =>
      `/tenants/${tenantId}/apartments/${apartmentId}`,
    moveOut: (tenantId: string, apartmentId: string) =>
      `/tenants/${tenantId}/apartments/${apartmentId}/move-out`,
    update: (tenantId: string, apartmentId: string) =>
      `/tenants/${tenantId}/apartments/${apartmentId}`,
    updateById: (tenantId: string) => `/tenants/${tenantId}`,
  },
  chargeTypes: {
    list: (apartmentId: string) => `${a(apartmentId)}/charge-types`,
    create: (apartmentId: string) => `${a(apartmentId)}/charge-types`,
    detail: (apartmentId: string, chargeTypeId: string) =>
      `${a(apartmentId)}/charge-types/${chargeTypeId}`,
    update: (apartmentId: string, chargeTypeId: string) =>
      `${a(apartmentId)}/charge-types/${chargeTypeId}`,
    remove: (apartmentId: string, chargeTypeId: string) =>
      `${a(apartmentId)}/charge-types/${chargeTypeId}`,
  },
  roomCharges: {
    list: (apartmentId: string) => `${a(apartmentId)}/room-charges`,
    create: (apartmentId: string) => `${a(apartmentId)}/room-charges`,
    setup: (apartmentId: string) => `${a(apartmentId)}/room-charges/setup`,
    detail: (apartmentId: string, chargeId: string) =>
      `${a(apartmentId)}/room-charges/${chargeId}`,
    update: (apartmentId: string, chargeId: string) =>
      `${a(apartmentId)}/room-charges/${chargeId}`,
    remove: (apartmentId: string, chargeId: string) =>
      `${a(apartmentId)}/room-charges/${chargeId}`,
  },
  invoiceSetups: {
    list: (apartmentId: string) => `${a(apartmentId)}/invoice-setups`,
    create: (apartmentId: string) => `${a(apartmentId)}/invoice-setups`,
    detail: (apartmentId: string, setupId: string) =>
      `${a(apartmentId)}/invoice-setups/${setupId}`,
    remove: (apartmentId: string, setupId: string) =>
      `${a(apartmentId)}/invoice-setups/${setupId}`,
    update: (setupId: string) => `/invoice-setups/${setupId}`,
  },
  billingPeriods: {
    generate: (apartmentId: string) =>
      `${a(apartmentId)}/billing-periods/generate`,
    list: (apartmentId: string) => `${a(apartmentId)}/billing-periods`,
    dropdown: (apartmentId: string) =>
      `${a(apartmentId)}/billing-periods/dropdown`,
    byId: (apartmentId: string, billingPeriodId: string) =>
      `${a(apartmentId)}/billing-periods/${billingPeriodId}`,
    status: (apartmentId: string, billingPeriodId: string) =>
      `${a(apartmentId)}/billing-periods/${billingPeriodId}/status`,
    remove: (apartmentId: string, billingPeriodId: string) =>
      `${a(apartmentId)}/billing-periods/${billingPeriodId}`,
    generateInvoices: (apartmentId: string, billingPeriodId: string) =>
      `${a(apartmentId)}/billing-periods/${billingPeriodId}/generate-invoices`,
    regenerateInvoices: (apartmentId: string, billingPeriodId: string) =>
      `${a(apartmentId)}/billing-periods/${billingPeriodId}/regenerate-invoices`,
    publishInvoices: (apartmentId: string, billingPeriodId: string) =>
      `${a(apartmentId)}/billing-periods/${billingPeriodId}/publish-invoices`,
  },
  invoices: {
    list: (apartmentId: string) => `${a(apartmentId)}/invoices`,
    create: (apartmentId: string) => `${a(apartmentId)}/invoices`,
    billTypeDropdown: (apartmentId: string) =>
      `${a(apartmentId)}/invoices/bill-types/dropdown`,
    byId: (apartmentId: string, invoiceId: string) =>
      `${a(apartmentId)}/invoices/${invoiceId}`,
    detail: (apartmentId: string, invoiceId: string) =>
      `${a(apartmentId)}/invoices/${invoiceId}/details`,
    updateItems: (apartmentId: string, invoiceId: string) =>
      `${a(apartmentId)}/invoices/${invoiceId}/items`,
    cancel: (apartmentId: string, invoiceId: string) =>
      `${a(apartmentId)}/invoices/${invoiceId}`,
  },
  paymentAccounts: {
    list: (apartmentId: string) => `${a(apartmentId)}/payment-accounts`,
    create: (apartmentId: string) => `${a(apartmentId)}/payment-accounts`,
    detail: (apartmentId: string, accountId: string) =>
      `${a(apartmentId)}/payment-accounts/${accountId}`,
    update: (apartmentId: string, accountId: string) =>
      `${a(apartmentId)}/payment-accounts/${accountId}`,
    remove: (apartmentId: string, accountId: string) =>
      `${a(apartmentId)}/payment-accounts/${accountId}`,
  },
  finance: {
    summary: (apartmentId: string) => `${a(apartmentId)}/finance/summary`,
    accountBalances: (apartmentId: string) =>
      `${a(apartmentId)}/finance/account-balances`,
    revenueTrend: (apartmentId: string) =>
      `${a(apartmentId)}/finance/revenue-trend`,
  },
  accountingPeriods: {
    list: (apartmentId: string) => `${a(apartmentId)}/accounting-periods`,
    close: (apartmentId: string, period: string) =>
      `${a(apartmentId)}/accounting-periods/${period}/close`,
    reopen: (apartmentId: string, period: string) =>
      `${a(apartmentId)}/accounting-periods/${period}/reopen`,
  },
  auditLogs: {
    list: (apartmentId: string) => `${a(apartmentId)}/audit-logs`,
  },
  transactionCategories: {
    list: (apartmentId: string) => `${a(apartmentId)}/transaction-categories`,
    create: (apartmentId: string) => `${a(apartmentId)}/transaction-categories`,
    detail: (apartmentId: string, categoryId: string) =>
      `${a(apartmentId)}/transaction-categories/${categoryId}`,
    update: (apartmentId: string, categoryId: string) =>
      `${a(apartmentId)}/transaction-categories/${categoryId}`,
    remove: (apartmentId: string, categoryId: string) =>
      `${a(apartmentId)}/transaction-categories/${categoryId}`,
  },
  incomes: {
    list: (apartmentId: string) => `${a(apartmentId)}/incomes`,
    create: (apartmentId: string) => `${a(apartmentId)}/incomes`,
    detail: (apartmentId: string, incomeId: string) =>
      `${a(apartmentId)}/incomes/${incomeId}`,
    update: (apartmentId: string, incomeId: string) =>
      `${a(apartmentId)}/incomes/${incomeId}`,
    void: (apartmentId: string, incomeId: string) =>
      `${a(apartmentId)}/incomes/${incomeId}/void`,
  },
  expenses: {
    list: (apartmentId: string) => `${a(apartmentId)}/expenses`,
    create: (apartmentId: string) => `${a(apartmentId)}/expenses`,
    detail: (apartmentId: string, expenseId: string) =>
      `${a(apartmentId)}/expenses/${expenseId}`,
    update: (apartmentId: string, expenseId: string) =>
      `${a(apartmentId)}/expenses/${expenseId}`,
    void: (apartmentId: string, expenseId: string) =>
      `${a(apartmentId)}/expenses/${expenseId}/void`,
  },
  tenantDeposits: {
    list: (apartmentId: string) => `${a(apartmentId)}/tenant-deposits`,
    create: (apartmentId: string) => `${a(apartmentId)}/tenant-deposits`,
    detail: (apartmentId: string, depositId: string) =>
      `${a(apartmentId)}/tenant-deposits/${depositId}`,
    update: (apartmentId: string, depositId: string) =>
      `${a(apartmentId)}/tenant-deposits/${depositId}`,
    remove: (apartmentId: string, depositId: string) =>
      `${a(apartmentId)}/tenant-deposits/${depositId}`,
    settle: (apartmentId: string, depositId: string) =>
      `${a(apartmentId)}/tenant-deposits/${depositId}/settle`,
    reverse: (apartmentId: string, depositId: string) =>
      `${a(apartmentId)}/tenant-deposits/${depositId}/reverse`,
  },
};