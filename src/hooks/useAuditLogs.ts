"use client";

import { useQuery } from "@tanstack/react-query";

import { auditLogQueries } from "@/queries/finance.query";
import type { AuditListParams } from "@/services/audit-log.service";

export function useAuditLogs(apartmentId: string, params?: AuditListParams) {
  return useQuery(auditLogQueries.list(apartmentId, params));
}
