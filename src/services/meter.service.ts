import { buildQuery, http } from "@/api";
import { endpoints } from "@/lib/endpoints";
import { toList } from "@/lib/list";
import type { Meter, MeterReading } from "@/types";
import { normalizeMeters, type RawMeter } from "@/utils/meter";

export const meterService = {
  async list(apartmentId: string): Promise<Meter[]> {
    const res = await http.get(endpoints.meters.list(apartmentId));
    return normalizeMeters(toList<RawMeter>(res).items);
  },

  async getByBillingPeriod(
    apartmentId: string,
    billingPeriodId: string
  ): Promise<MeterReading[]> {
    const res = await http.get(
      endpoints.meters.byBillingPeriod(apartmentId) +
        buildQuery({ billingPeriodId })
    );
    return toList<MeterReading>(res).items;
  },

  async getReadings(apartmentId: string, meterId: string): Promise<MeterReading[]> {
    const res = await http.get(
      endpoints.meters.readings(apartmentId, meterId)
    );
    return toList<MeterReading>(res).items;
  },

  async create(apartmentId: string, payload: unknown): Promise<Meter> {
    return http.post<Meter>(endpoints.meters.create(apartmentId), payload);
  },

  async remove(apartmentId: string, meterId: string): Promise<void> {
    await http.delete(endpoints.meters.remove(apartmentId, meterId));
  },

  async restore(apartmentId: string, meterId: string): Promise<Meter> {
    return http.patch<Meter>(
      endpoints.meters.restore(apartmentId, meterId)
    );
  },

  async recordReading(
    meterReadingId: string,
    body: { previousValue: number; currentValue: number }
  ) {
    return http.post(endpoints.meters.record(meterReadingId), body);
  },

  async updateReading(
    apartmentId: string,
    meterId: string,
    meterReadingId: string,
    body: { previousValue: number; currentValue: number }
  ) {
    return http.patch(
      endpoints.meters.updateReading(apartmentId, meterId, meterReadingId),
      body
    );
  },
};
