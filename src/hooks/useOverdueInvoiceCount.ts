"use client";

import { useApartmentIdFromPath } from "@/hooks/use-apartment-id";
import { useInvoices } from "@/hooks/useInvoices";
import { InvoiceStatus } from "@/types";

export function useOverdueInvoiceCount(): number {
  const apartmentId = useApartmentIdFromPath() ?? "";
  const { data } = useInvoices(apartmentId, {
    page: 1,
    limit: 1,
    status: InvoiceStatus.OVERDUE,
  });
  return data?.meta?.total ?? 0;
}
