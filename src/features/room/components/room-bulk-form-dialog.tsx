"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { Loader2, Plus, Trash2, Wand2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useRoomActions } from "@/hooks/useRooms";
import { getApiErrorMessage } from "@/lib/format";
import { zodFormResolver } from "@/lib/zod-resolver";
import {
  createEmptyBulkRoomRow,
  generateRoomRows,
  makeBulkCreateRoomsSchema,
  makeRoomGeneratorSchema,
  MAX_BULK_ROOMS,
  type BulkCreateRoomsFormValues,
  type RoomGeneratorValues,
} from "@/schemas/room-bulk.schema";
import type { BulkCreateRoomFailedItem, RoomType } from "@/types";
import { useT } from "@/i18n";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apartmentId: string;
  roomTypes: RoomType[];
  onSuccess?: () => void;
}

const defaultGeneratorValues: RoomGeneratorValues = {
  prefix: "",
  floor: "",
  roomTypeId: "",
  start: 101,
  end: 110,
  currentWaterMeterReading: 0,
  currentElectricMeterReading: 0,
  mode: "replace",
};

export function RoomBulkFormDialog({
  open,
  onOpenChange,
  apartmentId,
  roomTypes,
  onSuccess,
}: Props) {
  const t = useT();
  const { bulkCreate } = useRoomActions(apartmentId);
  const submitting = bulkCreate.isPending;
  const [rowErrors, setRowErrors] = useState<
    Record<number, BulkCreateRoomFailedItem>
  >({});
  const [nextClientIndex, setNextClientIndex] = useState(0);

  const defaultRoomTypeId = roomTypes[0]?.id ?? "";

  const form = useForm<BulkCreateRoomsFormValues>({
    resolver: zodFormResolver<BulkCreateRoomsFormValues>(
      makeBulkCreateRoomsSchema(t)
    ),
    defaultValues: {
      rooms: [createEmptyBulkRoomRow(0, defaultRoomTypeId)],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "rooms",
  });

  const generatorForm = useForm<RoomGeneratorValues>({
    resolver: zodFormResolver<RoomGeneratorValues>(makeRoomGeneratorSchema(t)),
    defaultValues: {
      ...defaultGeneratorValues,
      roomTypeId: defaultRoomTypeId,
    },
  });

  const resetDialog = useCallback(() => {
    setRowErrors({});
    setNextClientIndex(1);
    form.reset({
      rooms: [createEmptyBulkRoomRow(0, defaultRoomTypeId)],
    });
    generatorForm.reset({
      ...defaultGeneratorValues,
      roomTypeId: defaultRoomTypeId,
    });
  }, [defaultRoomTypeId, form, generatorForm]);

  useEffect(() => {
    if (!open) return;
    resetDialog();
  }, [open, resetDialog]);

  const applyDefaults = useCallback(
    (patch: Partial<BulkCreateRoomsFormValues["rooms"][number]>) => {
      const current = form.getValues("rooms");
      replace(
        current.map((row) => ({
          ...row,
          ...patch,
        }))
      );
    },
    [form, replace]
  );

  const handleGenerate = generatorForm.handleSubmit((values) => {
    const existing = form.getValues("rooms").filter((row) => row.name.trim());
    const baseRows = values.mode === "append" ? existing : [];

    const startClientIndex =
      values.mode === "append"
        ? baseRows.reduce(
            (max, row) => Math.max(max, row.clientIndex + 1),
            nextClientIndex
          )
        : 0;

    const { rows, nextClientIndex: newNextIndex } = generateRoomRows(
      values,
      baseRows,
      startClientIndex
    );

    if (rows.length > MAX_BULK_ROOMS) {
      toast.error(t("max-rooms-per-batch"));
      return;
    }

    replace(rows);
    setNextClientIndex(newNextIndex);
    setRowErrors({});
    toast.success(t("rooms-generated", { count: rows.length }));
  });

  const onSubmit = (values: BulkCreateRoomsFormValues) => {
    const payload = {
      rooms: values.rooms.map((row) => ({
        clientIndex: row.clientIndex,
        roomTypeId: row.roomTypeId,
        name: row.name.trim(),
        floor: row.floor?.trim() || undefined,
        description: row.description?.trim() || undefined,
        status: row.status,
        isActive: row.isActive,
        currentWaterMeterReading: row.currentWaterMeterReading,
        currentElectricMeterReading: row.currentElectricMeterReading,
      })),
    };

    bulkCreate.mutate(payload, {
      onSuccess: (result) => {
        const { summary, failed } = result;
        const failedByIndex = Object.fromEntries(
          failed.map((item) => [item.clientIndex, item])
        );

        if (summary.succeeded > 0) {
          toast.success(
            t("rooms-bulk-created-summary", {
              succeeded: summary.succeeded,
              failed: summary.failed,
            })
          );
        }

        if (summary.failed === 0) {
          onSuccess?.();
          onOpenChange(false);
          return;
        }

        const remaining = values.rooms.filter(
          (row) => failedByIndex[row.clientIndex]
        );
        replace(remaining);
        setRowErrors(failedByIndex);

        if (summary.succeeded === 0) {
          toast.error(t("rooms-bulk-all-failed"));
        }
      },
      onError: (err) => toast.error(getApiErrorMessage(err)),
    });
  };

  const roomCount = fields.length;

  const bulkDefaults = useMemo(
    () => ({
      roomTypeId: generatorForm.watch("roomTypeId") || defaultRoomTypeId,
      floor: generatorForm.watch("floor") ?? "",
      water: generatorForm.watch("currentWaterMeterReading") ?? 0,
      electric: generatorForm.watch("currentElectricMeterReading") ?? 0,
    }),
    [generatorForm, defaultRoomTypeId]
  );

  return (
    <Dialog open={open} onOpenChange={(o) => !submitting && onOpenChange(o)}>
      <DialogContent className="flex max-h-[90vh] max-w-5xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 px-6 pt-6">
          <DialogTitle>{t("bulk-add-rooms")}</DialogTitle>
          <DialogDescription>{t("bulk-add-rooms-description")}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t("quick-generate-rooms")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Form {...generatorForm}>
                <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <FormField
                  control={generatorForm.control}
                  name="prefix"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("room-name-prefix")}</FormLabel>
                      <FormControl>
                        <Input placeholder="A-" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={generatorForm.control}
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
                <FormField
                  control={generatorForm.control}
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
                <FormField
                  control={generatorForm.control}
                  name="mode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("generate-mode")}</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="replace">{t("replace-rows")}</SelectItem>
                          <SelectItem value="append">{t("append-rows")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <FormField
                  control={generatorForm.control}
                  name="start"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("room-range-start")}</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={generatorForm.control}
                  name="end"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("room-range-end")}</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={generatorForm.control}
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
                  control={generatorForm.control}
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

              <Button type="button" variant="secondary" onClick={handleGenerate}>
                <Wand2 className="h-4 w-4" />
                {t("generate-rooms")}
              </Button>
                </div>
              </Form>
            </CardContent>
          </Card>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {t("apply-to-all-rows")}:
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => applyDefaults({ roomTypeId: bulkDefaults.roomTypeId })}
            >
              {t("nav-room-types")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => applyDefaults({ floor: bulkDefaults.floor || undefined })}
            >
              {t("floor-optional")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                applyDefaults({
                  currentWaterMeterReading: bulkDefaults.water,
                  currentElectricMeterReading: bulkDefaults.electric,
                })
              }
            >
              {t("meter-readings")}
            </Button>
          </div>

          <Separator />

          <Form {...form}>
            <form
              id="bulk-room-form"
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-3"
            >
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40 text-left">
                      <th className="px-3 py-2 font-medium">#</th>
                      <th className="px-3 py-2 font-medium">{t("room-name-number")}</th>
                      <th className="px-3 py-2 font-medium">{t("floor-optional")}</th>
                      <th className="px-3 py-2 font-medium">{t("nav-room-types")}</th>
                      <th className="px-3 py-2 font-medium">{t("initial-water-meter")}</th>
                      <th className="px-3 py-2 font-medium">{t("initial-electric-meter")}</th>
                      <th className="px-3 py-2 font-medium" />
                    </tr>
                  </thead>
                  <tbody>
                    {fields.map((field, index) => {
                      const clientIndex = form.watch(`rooms.${index}.clientIndex`);
                      const apiError = rowErrors[clientIndex];

                      return (
                        <tr
                          key={field.id}
                          className={
                            apiError
                              ? "border-b bg-destructive/5"
                              : "border-b"
                          }
                        >
                          <td className="px-3 py-2 align-top text-muted-foreground">
                            {index + 1}
                          </td>
                          <td className="px-3 py-2 align-top">
                            <FormField
                              control={form.control}
                              name={`rooms.${index}.name`}
                              render={({ field: rowField }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input placeholder="A-101" {...rowField} />
                                  </FormControl>
                                  <FormMessage />
                                  {apiError && (
                                    <p className="text-xs text-destructive">
                                      {apiError.reason}
                                    </p>
                                  )}
                                </FormItem>
                              )}
                            />
                          </td>
                          <td className="px-3 py-2 align-top">
                            <FormField
                              control={form.control}
                              name={`rooms.${index}.floor`}
                              render={({ field: rowField }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input placeholder="1" {...rowField} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </td>
                          <td className="px-3 py-2 align-top">
                            <FormField
                              control={form.control}
                              name={`rooms.${index}.roomTypeId`}
                              render={({ field: rowField }) => (
                                <FormItem>
                                  <Select
                                    value={rowField.value}
                                    onValueChange={rowField.onChange}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue
                                          placeholder={t("select-room-type")}
                                        />
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
                          </td>
                          <td className="px-3 py-2 align-top">
                            <FormField
                              control={form.control}
                              name={`rooms.${index}.currentWaterMeterReading`}
                              render={({ field: rowField }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min={0}
                                      step="0.01"
                                      {...rowField}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </td>
                          <td className="px-3 py-2 align-top">
                            <FormField
                              control={form.control}
                              name={`rooms.${index}.currentElectricMeterReading`}
                              render={({ field: rowField }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min={0}
                                      step="0.01"
                                      {...rowField}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </td>
                          <td className="px-3 py-2 align-top">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              disabled={fields.length <= 1}
                              onClick={() => remove(index)}
                              aria-label={t("remove-row")}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={roomCount >= MAX_BULK_ROOMS}
                onClick={() => {
                  append(createEmptyBulkRoomRow(nextClientIndex, defaultRoomTypeId));
                  setNextClientIndex((value) => value + 1);
                }}
              >
                <Plus className="h-4 w-4" />
                {t("add-row")}
              </Button>
            </form>
          </Form>
        </div>

        <DialogFooter className="shrink-0 border-t px-6 py-4">
          <p className="mr-auto text-sm text-muted-foreground">
            {t("rooms-ready-to-create", { count: roomCount })}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            {t("cancel")}
          </Button>
          <Button
            type="submit"
            form="bulk-room-form"
            disabled={submitting || roomCount === 0}
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("create-n-rooms", { count: roomCount })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
