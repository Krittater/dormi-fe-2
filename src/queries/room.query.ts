import { queryOptions } from "@tanstack/react-query";

import { qk } from "@/queries/keys";
import { chargeTypeService } from "@/services/charge-type.service";
import { invoiceSetupService } from "@/services/invoice-setup.service";
import { meterService } from "@/services/meter.service";
import { roomChargeService } from "@/services/room-charge.service";
import {
  roomService,
  type RoomListParams,
} from "@/services/room.service";
import { roomTypeService, type RoomTypeListParams } from "@/services/room-type.service";
import { tenantService, type TenantListParams } from "@/services/tenant.service";

export const roomQueries = {
  list: (apartmentId: string, params?: RoomListParams) =>
    queryOptions({
      queryKey: qk.rooms.list(apartmentId, params),
      queryFn: () => roomService.list(apartmentId, params),
      enabled: Boolean(apartmentId),
    }),

  dropdown: (apartmentId: string) =>
    queryOptions({
      queryKey: qk.rooms.dropdown(apartmentId),
      queryFn: () => roomService.dropdown(apartmentId),
      enabled: Boolean(apartmentId),
    }),

  detail: (apartmentId: string, roomId: string) =>
    queryOptions({
      queryKey: qk.rooms.detail(apartmentId, roomId),
      queryFn: () => roomService.getDetail(apartmentId, roomId),
      enabled: Boolean(apartmentId) && Boolean(roomId),
    }),

  byId: (apartmentId: string, roomId: string) =>
    queryOptions({
      queryKey: qk.rooms.byId(apartmentId, roomId),
      queryFn: () => roomService.getById(apartmentId, roomId),
      enabled: Boolean(apartmentId) && Boolean(roomId),
    }),
};

export const roomTypeQueries = {
  list: (apartmentId: string, params?: RoomTypeListParams) =>
    queryOptions({
      queryKey: qk.roomTypes.list(apartmentId, params),
      queryFn: () => roomTypeService.list(apartmentId, params),
      enabled: Boolean(apartmentId),
    }),
};

export const roomChargeQueries = {
  setup: (apartmentId: string) =>
    queryOptions({
      queryKey: qk.roomCharges.setup(apartmentId),
      queryFn: () => roomChargeService.getSetup(apartmentId),
      enabled: Boolean(apartmentId),
    }),

  dropdowns: (apartmentId: string) =>
    queryOptions({
      queryKey: [...qk.roomCharges.all(apartmentId), "dropdowns"] as const,
      queryFn: () => roomChargeService.getDropdownData(apartmentId),
      enabled: Boolean(apartmentId),
    }),
};

export const chargeTypeQueries = {
  list: (apartmentId: string) =>
    queryOptions({
      queryKey: qk.chargeTypes.list(apartmentId),
      queryFn: () => chargeTypeService.list(apartmentId),
      enabled: Boolean(apartmentId),
    }),
};

export const tenantQueries = {
  list: (apartmentId: string, params?: TenantListParams) =>
    queryOptions({
      queryKey: qk.tenants.list(apartmentId, params),
      queryFn: () => tenantService.list(apartmentId, params),
      enabled: Boolean(apartmentId),
    }),

  roomDropdown: (apartmentId: string) =>
    queryOptions({
      queryKey: [...qk.tenants.all(apartmentId), "roomDropdown"] as const,
      queryFn: () => tenantService.getRoomDropdown(apartmentId),
      enabled: Boolean(apartmentId),
    }),
};

export const meterQueries = {
  list: (apartmentId: string) =>
    queryOptions({
      queryKey: qk.meters.list(apartmentId),
      queryFn: () => meterService.list(apartmentId),
      enabled: Boolean(apartmentId),
    }),

  byBillingPeriod: (apartmentId: string, billingPeriodId: string) =>
    queryOptions({
      queryKey: qk.meters.byBillingPeriod(apartmentId, billingPeriodId),
      queryFn: () =>
        meterService.getByBillingPeriod(apartmentId, billingPeriodId),
      enabled: Boolean(apartmentId) && Boolean(billingPeriodId),
    }),

  readings: (apartmentId: string, meterId: string) =>
    queryOptions({
      queryKey: qk.meters.readings(apartmentId, meterId),
      queryFn: () => meterService.getReadings(apartmentId, meterId),
      enabled: Boolean(apartmentId) && Boolean(meterId),
    }),
};

export const invoiceSetupQueries = {
  list: (apartmentId: string) =>
    queryOptions({
      queryKey: qk.invoiceSetups.list(apartmentId),
      queryFn: () => invoiceSetupService.list(apartmentId),
      enabled: Boolean(apartmentId),
    }),
};
