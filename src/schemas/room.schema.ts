import { z } from "zod";

import type { TranslateFn } from "@/i18n";
import { RoomStatus } from "@/types";

export const makeRoomSchema = (t: TranslateFn) =>
  z.object({
    roomTypeId: z.string().min(1, t("please-select-room-type")),
    name: z.string().min(1, t("enter-room-name-number")).max(100, t("too-long")),
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

export type RoomFormValues = z.infer<ReturnType<typeof makeRoomSchema>>;
