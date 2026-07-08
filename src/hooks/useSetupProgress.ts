"use client";

import { useBillingPeriods } from "@/hooks/useBillingPeriods";
import { useChargeTypes } from "@/hooks/useChargeTypes";
import { useInvoiceSetups } from "@/hooks/useInvoices";
import { useRoomTypesDropdown, useRooms } from "@/hooks/useRooms";
import { ROOMS_FETCH_ALL_LIMIT } from "@/constants/config";

export function useSetupProgress(apartmentId: string) {
  const { data: roomTypesData } = useRoomTypesDropdown(apartmentId, 1);
  const { data: roomsData } = useRooms(apartmentId, {
    limit: ROOMS_FETCH_ALL_LIMIT,
  });
  const { data: chargeTypes = [] } = useChargeTypes(apartmentId);
  const { data: invoiceSetups = [] } = useInvoiceSetups(apartmentId);
  const { data: billingPeriods = [] } = useBillingPeriods(apartmentId);

  return {
    roomTypes: roomTypesData?.items?.length ?? 0,
    rooms: roomsData?.meta?.total ?? roomsData?.items?.length ?? 0,
    chargeTypes: chargeTypes.length,
    invoiceSetups: invoiceSetups.length,
    billingPeriods: billingPeriods.length,
  };
}
