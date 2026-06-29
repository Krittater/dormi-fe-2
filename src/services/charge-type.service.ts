import { http } from "@/api";
import { endpoints } from "@/lib/endpoints";
import { toList } from "@/lib/list";
import type { ChargeType } from "@/types";

export const chargeTypeService = {
  async list(apartmentId: string): Promise<ChargeType[]> {
    const res = await http.get(endpoints.chargeTypes.list(apartmentId));
    return toList<ChargeType>(res).items;
  },

  async create(apartmentId: string, payload: unknown): Promise<ChargeType> {
    return http.post<ChargeType>(
      endpoints.chargeTypes.create(apartmentId),
      payload
    );
  },

  async update(
    apartmentId: string,
    chargeTypeId: string,
    payload: unknown
  ): Promise<ChargeType> {
    return http.patch<ChargeType>(
      endpoints.chargeTypes.update(apartmentId, chargeTypeId),
      payload
    );
  },

  async remove(apartmentId: string, chargeTypeId: string): Promise<void> {
    await http.delete(
      endpoints.chargeTypes.remove(apartmentId, chargeTypeId)
    );
  },
};
