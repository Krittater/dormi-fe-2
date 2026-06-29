import { http } from "@/api";
import { endpoints } from "@/lib/endpoints";
import { toList } from "@/lib/list";
import type { ChargeType } from "@/types";
import { normalizeRoomOptions } from "@/utils/room";

export interface SetupRow {
  room: {
    id: string;
    name: string;
    isCalWater: boolean;
    isCalElectric: boolean;
    waterRatePerUnit: number;
    electricityRatePerUnit: number;
    charges: Array<{
      id: string;
      chargeTypeId: string;
      chargeTypeName?: string;
      amount: number;
      unit?: number | null;
      description?: string | null;
    }>;
  };
}

function normalizeSetupRows(res: unknown): SetupRow[] {
  const arr = Array.isArray(res)
    ? res
    : ((res as { data?: unknown[] })?.data ?? []);
  return arr as SetupRow[];
}

export const roomChargeService = {
  async getSetup(apartmentId: string): Promise<SetupRow[]> {
    const res = await http.get<unknown>(endpoints.roomCharges.setup(apartmentId));
    return normalizeSetupRows(res);
  },

  async saveSetup(
    apartmentId: string,
    charges: unknown[]
  ): Promise<void> {
    await http.patch(endpoints.roomCharges.setup(apartmentId), { charges });
  },

  async create(apartmentId: string, payload: unknown) {
    return http.post(endpoints.roomCharges.create(apartmentId), payload);
  },

  async update(apartmentId: string, chargeId: string, payload: unknown) {
    return http.patch(
      endpoints.roomCharges.update(apartmentId, chargeId),
      payload
    );
  },

  async remove(apartmentId: string, chargeId: string): Promise<void> {
    await http.delete(endpoints.roomCharges.remove(apartmentId, chargeId));
  },

  async getDropdownData(apartmentId: string) {
    const [rooms, chargeTypes] = await Promise.all([
      http.get(endpoints.rooms.dropdown(apartmentId)),
      http.get(endpoints.chargeTypes.list(apartmentId)),
    ]);
    return {
      rooms: normalizeRoomOptions(
        toList<{ roomId?: string; id?: string; name: string }>(rooms).items
      ),
      chargeTypes: toList<ChargeType>(chargeTypes).items,
    };
  },
};
