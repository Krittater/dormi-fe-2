import { http } from "@/api";
import { endpoints } from "@/lib/endpoints";
import { toList } from "@/lib/list";
import type { InvoiceSetup } from "@/types";

export const invoiceSetupService = {
  async list(apartmentId: string): Promise<InvoiceSetup[]> {
    const res = await http.get(endpoints.invoiceSetups.list(apartmentId));
    return toList<InvoiceSetup>(res).items;
  },

  async create(apartmentId: string, payload: unknown): Promise<InvoiceSetup> {
    return http.post<InvoiceSetup>(
      endpoints.invoiceSetups.create(apartmentId),
      payload
    );
  },

  async update(setupId: string, payload: unknown): Promise<InvoiceSetup> {
    return http.patch<InvoiceSetup>(
      endpoints.invoiceSetups.update(setupId),
      payload
    );
  },

  async remove(apartmentId: string, setupId: string): Promise<void> {
    await http.delete(
      endpoints.invoiceSetups.remove(apartmentId, setupId)
    );
  },
};
