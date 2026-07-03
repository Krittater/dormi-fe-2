import { buildQuery, http } from "@/api";
import { endpoints } from "@/lib/endpoints";
import { toList } from "@/lib/list";
import type { AuditLog, PaginationMeta } from "@/types";

export interface AuditListParams {
  entityType?: string;
  entityId?: string;
  action?: string;
  page?: number;
  limit?: number;
}

export const auditLogService = {
  async list(
    apartmentId: string,
    params?: AuditListParams
  ): Promise<{ items: AuditLog[]; meta?: PaginationMeta }> {
    const res = await http.get(
      endpoints.auditLogs.list(apartmentId) + buildQuery(params)
    );
    return toList<AuditLog>(res);
  },
};
