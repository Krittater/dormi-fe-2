"use client";

import { useQuery } from "@tanstack/react-query";

import { financeQueries } from "@/queries/finance.query";

export function useFinanceSummary(
  apartmentId: string,
  params?: { period?: string }
) {
  return useQuery(financeQueries.summary(apartmentId, params));
}
