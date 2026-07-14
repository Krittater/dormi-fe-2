/**
 * Mirror ของ permission codes จาก backend auth-service
 * (permission-catalog.ts) — ใช้แทน magic string ใน UI
 */

export const P = {
  apartment: {
    read: "apartment.read",
    create: "apartment.create",
    update: "apartment.update",
    delete: "apartment.delete",
  },
  room: {
    read: "room.read",
    create: "room.create",
    update: "room.update",
    delete: "room.delete",
  },
  roomType: {
    read: "room-type.read",
    create: "room-type.create",
    update: "room-type.update",
    delete: "room-type.delete",
  },
  tenant: {
    read: "tenant.read",
    create: "tenant.create",
    update: "tenant.update",
    delete: "tenant.delete",
  },
  meter: {
    read: "meter.read",
    create: "meter.create",
    update: "meter.update",
    delete: "meter.delete",
  },
  invoice: {
    read: "invoice.read",
    create: "invoice.create",
    update: "invoice.update",
    delete: "invoice.delete",
  },
  finance: {
    read: "finance.read",
  },
  income: {
    create: "income.create",
    update: "income.update",
  },
  expense: {
    create: "expense.create",
    update: "expense.update",
  },
  staff: {
    read: "staff.read",
    create: "staff.create",
    update: "staff.update",
    delete: "staff.delete",
  },
  role: {
    read: "role.read",
    create: "role.create",
    update: "role.update",
    delete: "role.delete",
  },
  user: {
    read: "user.read",
    create: "user.create",
    update: "user.update",
    delete: "user.delete",
  },
  billingPeriod: {
    read: "billing-period.read",
    update: "billing-period.update",
    delete: "billing-period.delete",
  },
} as const;

export type PermissionCode = string;
