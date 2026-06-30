import { http } from "@/api";
import { endpoints } from "@/lib/endpoints";
import { toList } from "@/lib/list";
import type { ChargeType } from "@/types";
import {
  normalizeChargeType,
  normalizeChargeTypes,
  type RawChargeType,
} from "@/utils/charge-type";

export const chargeTypeService = {
  async list(apartmentId: string): Promise<ChargeType[]> {
    const res = await http.get(endpoints.chargeTypes.list(apartmentId));
    return normalizeChargeTypes(toList<RawChargeType>(res).items);
  },

  async create(apartmentId: string, payload: unknown): Promise<ChargeType> {
    const res = await http.post<RawChargeType>(
      endpoints.chargeTypes.create(apartmentId),
      payload
    );
    return normalizeChargeType(res);
  },

  async update(
    apartmentId: string,
    chargeTypeId: string,
    payload: unknown
  ): Promise<ChargeType> {
    const res = await http.patch<RawChargeType>(
      endpoints.chargeTypes.update(apartmentId, chargeTypeId),
      payload
    );
    return normalizeChargeType(res);
  },

  async remove(apartmentId: string, chargeTypeId: string): Promise<void> {
    await http.delete(
      endpoints.chargeTypes.remove(apartmentId, chargeTypeId)
    );
  },
};
