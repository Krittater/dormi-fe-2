import { z } from "zod";

import type { TranslateFn } from "@/i18n";
import { RoomStatus } from "@/types";

export const MAX_BULK_ROOMS = 50;

export const makeBulkRoomRowSchema = (t: TranslateFn) =>
  z.object({
    clientIndex: z.number().int().min(0),
    roomTypeId: z.string().min(1, t("please-select-room-type")),
    name: z
      .string()
      .min(1, t("enter-room-name-number"))
      .max(100, t("too-long")),
    floor: z.string().max(50, t("too-long")).optional(),
    description: z.string().max(500, t("too-long")).optional(),
    status: z.nativeEnum(RoomStatus),
    isActive: z.boolean(),
    currentWaterMeterReading: z.coerce
      .number({ message: t("enter-a-number") })
      .min(0, t("must-not-be-negative")),
    currentElectricMeterReading: z.coerce
      .number({ message: t("enter-a-number") })
      .min(0, t("must-not-be-negative")),
  });

export const makeBulkCreateRoomsSchema = (t: TranslateFn) => {
  const rowSchema = makeBulkRoomRowSchema(t);

  return z
    .object({
      rooms: z
        .array(rowSchema)
        .min(1, t("at-least-one-room"))
        .max(MAX_BULK_ROOMS, t("max-rooms-per-batch")),
    })
    .superRefine((data, ctx) => {
      const seen = new Map<string, number[]>();
      data.rooms.forEach((room, index) => {
        const key = room.name.trim().toLowerCase();
        if (!key) return;
        const indices = seen.get(key) ?? [];
        indices.push(index);
        seen.set(key, indices);
      });

      for (const indices of seen.values()) {
        if (indices.length <= 1) continue;
        for (const index of indices) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t("duplicate-room-name-in-table"),
            path: ["rooms", index, "name"],
          });
        }
      }
    });
};

export const makeRoomGeneratorSchema = (t: TranslateFn) =>
  z
    .object({
      prefix: z.string().max(20, t("too-long")),
      floor: z.string().max(50, t("too-long")),
      roomTypeId: z.string().min(1, t("please-select-room-type")),
      start: z.coerce
        .number({ message: t("enter-a-number") })
        .int()
        .min(0, t("must-not-be-negative")),
      end: z.coerce
        .number({ message: t("enter-a-number") })
        .int()
        .min(0, t("must-not-be-negative")),
      currentWaterMeterReading: z.coerce
        .number({ message: t("enter-a-number") })
        .min(0, t("must-not-be-negative")),
      currentElectricMeterReading: z.coerce
        .number({ message: t("enter-a-number") })
        .min(0, t("must-not-be-negative")),
      mode: z.enum(["replace", "append"]),
    })
    .superRefine((data, ctx) => {
      if (data.start > data.end) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t("room-range-start-must-be-lte-end"),
          path: ["end"],
        });
      }

      const count = data.end - data.start + 1;
      if (count > MAX_BULK_ROOMS) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t("max-rooms-per-batch"),
          path: ["end"],
        });
      }
    });

export type BulkRoomRowValues = z.infer<
  ReturnType<typeof makeBulkRoomRowSchema>
>;
export type BulkCreateRoomsFormValues = z.infer<
  ReturnType<typeof makeBulkCreateRoomsSchema>
>;
export type RoomGeneratorValues = z.infer<
  ReturnType<typeof makeRoomGeneratorSchema>
>;

export function createEmptyBulkRoomRow(
  clientIndex: number,
  roomTypeId = ""
): BulkRoomRowValues {
  return {
    clientIndex,
    roomTypeId,
    name: "",
    floor: "",
    description: "",
    status: RoomStatus.AVAILABLE,
    isActive: true,
    currentWaterMeterReading: 0,
    currentElectricMeterReading: 0,
  };
}

export function generateRoomRows(
  generator: RoomGeneratorValues,
  existingRows: BulkRoomRowValues[],
  nextClientIndex: number
): { rows: BulkRoomRowValues[]; nextClientIndex: number } {
  const generated: BulkRoomRowValues[] = [];
  let clientIndex = nextClientIndex;

  for (let n = generator.start; n <= generator.end; n++) {
    generated.push({
      clientIndex,
      roomTypeId: generator.roomTypeId,
      name: `${generator.prefix}${n}`,
      floor: generator.floor || undefined,
      description: "",
      status: RoomStatus.AVAILABLE,
      isActive: true,
      currentWaterMeterReading: generator.currentWaterMeterReading,
      currentElectricMeterReading: generator.currentElectricMeterReading,
    });
    clientIndex += 1;
  }

  if (generator.mode === "replace") {
    return { rows: generated, nextClientIndex: clientIndex };
  }

  return {
    rows: [...existingRows, ...generated],
    nextClientIndex: clientIndex,
  };
}
