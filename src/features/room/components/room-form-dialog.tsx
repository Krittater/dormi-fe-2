"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRoomActions } from "@/hooks/useRooms";
import { getApiErrorMessage } from "@/lib/format";
import { zodFormResolver } from "@/lib/zod-resolver";
import {
  makeRoomSchema,
  type RoomFormValues,
} from "@/schemas/room.schema";
import { ROOM_STATUS_CODES, RoomStatus } from "@/types";
import type { Room, RoomType } from "@/types";
import { useT } from "@/i18n";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apartmentId: string;
  room?: Room | null;
  roomTypes: RoomType[];
  onSuccess?: () => void;
}

export function RoomFormDialog({
  open,
  onOpenChange,
  apartmentId,
  room,
  roomTypes,
  onSuccess,
}: Props) {
  const t = useT();
  const isEdit = Boolean(room);
  const { create, update } = useRoomActions(apartmentId);
  const submitting = create.isPending || update.isPending;

  const form = useForm<RoomFormValues>({
    resolver: zodFormResolver<RoomFormValues>(makeRoomSchema(t)),
    defaultValues: {
      roomTypeId: "",
      name: "",
      floor: "",
      description: "",
      status: RoomStatus.AVAILABLE,
      isActive: true,
      currentWaterMeterReading: 0,
      currentElectricMeterReading: 0,
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      roomTypeId: room?.roomTypeId ?? "",
      name: room?.name ?? "",
      floor: room?.floor ?? "",
      description: room?.description ?? "",
      status: (room?.status as RoomStatus) ?? RoomStatus.AVAILABLE,
      isActive: room?.isActive ?? true,
      currentWaterMeterReading: 0,
      currentElectricMeterReading: 0,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, room]);

  const onSubmit = (values: RoomFormValues) => {
    const mutationOptions = {
      onSuccess: () => {
        onSuccess?.();
        onOpenChange(false);
      },
      onError: (err: unknown) => toast.error(getApiErrorMessage(err)),
    };

    if (isEdit && room) {
      update.mutate(
        {
          roomId: room.id,
          payload: {
            roomTypeId: values.roomTypeId,
            name: values.name,
            floor: values.floor || undefined,
            description: values.description || undefined,
            status: values.status,
            isActive: values.isActive,
          },
        },
        mutationOptions
      );
    } else {
      create.mutate(
        {
          roomTypeId: values.roomTypeId,
          name: values.name,
          floor: values.floor || undefined,
          description: values.description || undefined,
          status: values.status,
          isActive: values.isActive,
          currentWaterMeterReading: values.currentWaterMeterReading,
          currentElectricMeterReading: values.currentElectricMeterReading,
        },
        mutationOptions
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !submitting && onOpenChange(o)}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("edit-room") : t("add-room")}</DialogTitle>
          <DialogDescription>
            {isEdit ? t("update-room-info") : t("create-room-description")}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="roomTypeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("nav-room-types")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("select-room-type")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {roomTypes.map((rt) => (
                        <SelectItem key={rt.id} value={rt.id}>
                          {rt.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("room-name-number")}</FormLabel>
                    <FormControl>
                      <Input placeholder="A-101" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="floor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("floor-optional")}</FormLabel>
                    <FormControl>
                      <Input placeholder="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("status")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(RoomStatus).map((s) => (
                        <SelectItem key={s} value={s}>
                          {t(ROOM_STATUS_CODES[s])}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("description-optional")}</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!isEdit && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="currentWaterMeterReading"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("initial-water-meter")}</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="currentElectricMeterReading"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("initial-electric-meter")}</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
                  <div>
                    <FormLabel>{t("enable-room")}</FormLabel>
                    <p className="text-xs text-gray-500">
                      {t("disabled-room-not-billed")}
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {t("save")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
