import { http } from "@/api";
import { endpoints } from "@/lib/endpoints";
import { toList } from "@/lib/list";
import { normalizeChargeTypes, type RawChargeType } from "@/utils/charge-type";
import {
  normalizeSetupRows,
  type SetupRow,
} from "@/utils/room-charge";
import { normalizeRoomOptions } from "@/utils/room";

export type { SetupRow, SetupCharge } from "@/utils/room-charge";

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
      chargeTypes: normalizeChargeTypes(toList<RawChargeType>(chargeTypes).items),
    };
  },
};
