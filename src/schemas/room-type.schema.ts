import { z } from "zod";

import type { TranslateFn } from "@/i18n";

export const makeRoomTypeSchema = (t: TranslateFn) =>
  z.object({
    name: z.string().min(1, t("enter-room-type-name")),
    price: z.coerce
      .number({ message: t("enter-a-number") })
      .positive(t("price-must-be-positive")),
    description: z.string().optional(),
  });

export type RoomTypeFormValues = z.infer<ReturnType<typeof makeRoomTypeSchema>>;
