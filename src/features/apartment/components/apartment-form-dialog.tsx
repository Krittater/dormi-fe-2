"use client";

import { useEffect, useMemo } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodFormResolver } from "@/lib/zod-resolver";
import { z } from "zod";
import { Loader2, Plus, Trash2 } from "lucide-react";

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
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getDistricts,
  getPostcode,
  getProvinces,
  getSubDistricts,
} from "@/constants/thai-address-data";
import { useApartmentActions } from "@/hooks/useApartments";
import { useT, type TranslateFn } from "@/i18n";
import { apartmentDefaultCutoffs } from "@/schemas/invoice-setup.schema";
import type { Apartment, ApartmentOverview } from "@/types";

const makeBaseSchema = (t: TranslateFn) => {
  const dayField = z.coerce
    .number({ message: t("enter-a-number") })
    .int()
    .min(1, t("between-1-and-31"))
    .max(31, t("between-1-and-31"));
  const rateField = z.coerce
    .number({ message: t("enter-a-number") })
    .min(0, t("must-not-be-negative"));

  return z.object({
    name: z.string().min(1, t("enter-apartment-name")),
    province: z.string().min(1, t("enter-province")),
    district: z.string().min(1, t("enter-district")),
    subDistrict: z.string().min(1, t("enter-sub-district")),
    postalCode: z.string().min(1, t("enter-postal-code")),
    phone: z.string().optional(),
    description: z.string().optional(),
    invoiceCutOffDate: dayField,
    invoiceDueDate: dayField,
    electricityCutOffDate: dayField,
    electricityRatePerUnit: rateField,
    waterCutOffDate: dayField,
    waterRatePerUnit: rateField,
  });
};

const makeCreateSchema = (t: TranslateFn) =>
  makeBaseSchema(t).extend({
    roomTypes: z
      .array(
        z.object({
          name: z.string().min(1, t("enter-room-type-name")),
          price: z.coerce
            .number({ message: t("enter-a-number") })
            .positive(t("price-must-be-positive")),
          description: z.string().optional(),
        })
      )
      .min(1, t("at-least-one-room-type")),
  });

type CreateValues = z.infer<ReturnType<typeof makeCreateSchema>>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apartment?: Apartment | ApartmentOverview | null;
  onSuccess?: () => void;
}

const isFullApartment = (
  apartment: Apartment | ApartmentOverview | null | undefined
): apartment is Apartment =>
  Boolean(apartment) && "province" in (apartment as Apartment);

const emptyDefaults: CreateValues = {
  name: "",
  province: "",
  district: "",
  subDistrict: "",
  postalCode: "",
  phone: "",
  description: "",
  invoiceCutOffDate: apartmentDefaultCutoffs.invoiceCutOffDate,
  invoiceDueDate: apartmentDefaultCutoffs.invoiceDueDate,
  electricityCutOffDate: apartmentDefaultCutoffs.electricityCutOffDate,
  electricityRatePerUnit: 0,
  waterCutOffDate: apartmentDefaultCutoffs.waterCutOffDate,
  waterRatePerUnit: 0,
  roomTypes: [{ name: "", price: 0, description: "" }],
};

export function ApartmentFormDialog({
  open,
  onOpenChange,
  apartment,
  onSuccess,
}: Props) {
  const t = useT();
  const isEdit = Boolean(apartment);
  const { create, update } = useApartmentActions();
  const isPending = create.isPending || update.isPending;

  const form = useForm<CreateValues>({
    resolver: zodFormResolver<CreateValues>(
      isEdit ? makeBaseSchema(t) : makeCreateSchema(t)
    ),
    defaultValues: emptyDefaults,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "roomTypes",
  });

  const selectedProvince = form.watch("province");
  const selectedDistrict = form.watch("district");

  const provinceOptions = useMemo(() => getProvinces(), []);
  const districtOptions = useMemo(
    () => (selectedProvince ? getDistricts(selectedProvince) : []),
    [selectedProvince]
  );
  const subDistrictOptions = useMemo(
    () =>
      selectedProvince && selectedDistrict
        ? getSubDistricts(selectedProvince, selectedDistrict)
        : [],
    [selectedProvince, selectedDistrict]
  );

  useEffect(() => {
    if (!open) return;
    if (apartment) {
      const full = isFullApartment(apartment) ? apartment : null;
      form.reset({
        name: apartment.name,
        province: full?.province ?? "",
        district: full?.district ?? "",
        subDistrict: full?.subDistrict ?? "",
        postalCode: full?.postalCode ?? "",
        phone: full?.phone ?? "",
        description: full?.description ?? "",
        invoiceCutOffDate: full?.invoiceCutOffDate ?? apartmentDefaultCutoffs.invoiceCutOffDate,
        invoiceDueDate: full?.invoiceDueDate ?? apartmentDefaultCutoffs.invoiceDueDate,
        electricityCutOffDate:
          full?.electricityCutOffDate ?? apartmentDefaultCutoffs.electricityCutOffDate,
        electricityRatePerUnit: full?.electricityRatePerUnit ?? 0,
        waterCutOffDate: full?.waterCutOffDate ?? apartmentDefaultCutoffs.waterCutOffDate,
        waterRatePerUnit: full?.waterRatePerUnit ?? 0,
        roomTypes: [{ name: "", price: 0, description: "" }],
      });
    } else {
      form.reset(emptyDefaults);
    }
  }, [open, apartment, form]);

  const onSubmit = (values: CreateValues) => {
    const onDone = {
      onSuccess: () => {
        onSuccess?.();
        onOpenChange(false);
      },
    };

    if (isEdit && apartment) {
      const { roomTypes: _omit, ...payload } = values;
      void _omit;
      update.mutate({ id: apartment.id, payload }, onDone);
    } else {
      create.mutate(values, onDone);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !isPending && onOpenChange(o)}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t("edit-apartment") : t("add-new-apartment")}
          </DialogTitle>
          <DialogDescription>{t("apartment-form-description")}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>{t("apartment-name")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("apartment-name-placeholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="province"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("province")}</FormLabel>
                    <Select
                      value={field.value || undefined}
                      onValueChange={(value) => {
                        field.onChange(value);
                        form.setValue("district", "");
                        form.setValue("subDistrict", "");
                        form.setValue("postalCode", "");
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("select-province")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {provinceOptions.map((name) => (
                          <SelectItem key={name} value={name}>
                            {name}
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
                name="district"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("district")}</FormLabel>
                    <Select
                      value={field.value || undefined}
                      onValueChange={(value) => {
                        field.onChange(value);
                        form.setValue("subDistrict", "");
                        form.setValue("postalCode", "");
                      }}
                      disabled={!selectedProvince}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("select-district")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {districtOptions.map((name) => (
                          <SelectItem key={name} value={name}>
                            {name}
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
                name="subDistrict"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("sub-district")}</FormLabel>
                    <Select
                      value={field.value || undefined}
                      onValueChange={(value) => {
                        field.onChange(value);
                        const postcode = getPostcode(
                          selectedProvince,
                          selectedDistrict,
                          value
                        );
                        if (postcode) form.setValue("postalCode", postcode);
                      }}
                      disabled={!selectedDistrict}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("select-sub-district")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {subDistrictOptions.map((name) => (
                          <SelectItem key={name} value={name}>
                            {name}
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
                name="postalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("postal-code")}</FormLabel>
                    <FormControl>
                      <Input readOnly {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("phone-optional")}</FormLabel>
                    <FormControl>
                      <Input placeholder="0812345678" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>{t("description-optional")}</FormLabel>
                    <FormControl>
                      <Textarea rows={2} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />
            <div>
              <h3 className="mb-3 text-sm font-semibold text-gray-900">
                {t("rates-and-cutoff-dates")}
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="invoiceCutOffDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("invoice-cutoff-date")}</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} max={31} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="invoiceDueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("invoice-due-date")}</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} max={31} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="electricityCutOffDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("electricity-cutoff-date")}</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} max={31} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="electricityRatePerUnit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("electricity-rate-baht")}</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="waterCutOffDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("water-cutoff-date")}</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} max={31} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="waterRatePerUnit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("water-rate-baht")}</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {!isEdit && (
              <>
                <Separator />
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900">
                      {t("nav-room-types")}
                    </h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        append({ name: "", price: 0, description: "" })
                      }
                    >
                      <Plus className="h-4 w-4" />
                      {t("add-type")}
                    </Button>
                  </div>
                  {form.formState.errors.roomTypes?.root && (
                    <p className="mb-2 text-xs font-medium text-destructive">
                      {form.formState.errors.roomTypes.root.message}
                    </p>
                  )}
                  <div className="space-y-3">
                    {fields.map((fieldRow, index) => (
                      <div
                        key={fieldRow.id}
                        className="rounded-lg border border-gray-200 bg-gray-50 p-3"
                      >
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
                          <FormField
                            control={form.control}
                            name={`roomTypes.${index}.name`}
                            render={({ field }) => (
                              <FormItem className="sm:col-span-5">
                                <FormLabel>{t("type-name")}</FormLabel>
                                <FormControl>
                                  <Input placeholder="Standard" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`roomTypes.${index}.price`}
                            render={({ field }) => (
                              <FormItem className="sm:col-span-3">
                                <FormLabel>{t("price-per-month")}</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`roomTypes.${index}.description`}
                            render={({ field }) => (
                              <FormItem className="sm:col-span-3">
                                <FormLabel>{t("description")}</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="flex items-end sm:col-span-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                              disabled={fields.length <= 1}
                              onClick={() => remove(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {isEdit ? t("save") : t("create-apartment")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
