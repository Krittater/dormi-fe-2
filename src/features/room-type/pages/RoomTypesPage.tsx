"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useApartmentId } from "@/hooks/use-apartment-id";
import { useForm } from "react-hook-form";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Pagination } from "@/components/ui/pagination";
import { ROOM_TYPES_PAGE_SIZE, SEARCH_DEBOUNCE_MS } from "@/constants/config";
import { useRoomTypeActions, useRoomTypes } from "@/hooks/useRoomTypes";
import { formatCurrency, getApiErrorMessage } from "@/lib/format";
import { totalPagesOf } from "@/lib/list";
import { zodFormResolver } from "@/lib/zod-resolver";
import {
  makeRoomTypeSchema,
  type RoomTypeFormValues,
} from "@/schemas/room-type.schema";
import type { RoomType } from "@/types";
import { useT } from "@/i18n";

export function RoomTypesPage() {
  const t = useT();
  const apartmentId = useApartmentId();

  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RoomType | null>(null);
  const [deleting, setDeleting] = useState<RoomType | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(keyword);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [keyword]);

  const listParams = useMemo(
    () => ({
      page,
      limit: ROOM_TYPES_PAGE_SIZE,
      keyword: debouncedKeyword || undefined,
    }),
    [page, debouncedKeyword]
  );

  const { data, isLoading } = useRoomTypes(apartmentId, listParams);
  const { create, update, remove } = useRoomTypeActions(apartmentId);

  const items = data?.items ?? [];
  const meta = data?.meta;
  const submitting = create.isPending || update.isPending;

  const form = useForm<RoomTypeFormValues>({
    resolver: zodFormResolver<RoomTypeFormValues>(makeRoomTypeSchema(t)),
    defaultValues: { name: "", price: 0, description: "" },
  });

  const openCreate = useCallback(() => {
    setEditing(null);
    form.reset({ name: "", price: 0, description: "" });
    setFormOpen(true);
  }, [form]);

  const openEdit = useCallback(
    (rt: RoomType) => {
      setEditing(rt);
      form.reset({
        name: rt.name,
        price: rt.price,
        description: rt.description ?? "",
      });
      setFormOpen(true);
    },
    [form]
  );

  const onSubmit = useCallback(
    (values: RoomTypeFormValues) => {
      const mutationOptions = {
        onSuccess: () => setFormOpen(false),
        onError: (err: unknown) => toast.error(getApiErrorMessage(err)),
      };

      if (editing) {
        update.mutate(
          { roomTypeId: editing.id, payload: values },
          mutationOptions
        );
      } else {
        create.mutate(values, mutationOptions);
      }
    },
    [create, editing, update]
  );

  const handleDelete = useCallback(async () => {
    if (!deleting) return;
    await remove.mutateAsync(deleting.id);
    setDeleting(null);
  }, [deleting, remove]);

  const columns = useMemo<Column<RoomType>[]>(
    () => [
      {
        key: "name",
        header: t("type-name"),
        cell: (r) => (
          <span className="font-medium text-gray-900">{r.name}</span>
        ),
      },
      {
        key: "price",
        header: t("price-per-month"),
        cell: (r) => formatCurrency(r.price),
      },
      {
        key: "description",
        header: t("description"),
        cell: (r) => (
          <span className="text-gray-500">{r.description || "-"}</span>
        ),
      },
      {
        key: "actions",
        header: "",
        className: "text-right",
        cell: (r) => (
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => openEdit(r)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive"
              onClick={() => setDeleting(r)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [t, openEdit]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("nav-room-types")}
        description={t("room-types-page-description")}
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            {t("add-room-type")}
          </Button>
        }
      />

      <div className="max-w-sm">
        <Input
          placeholder={t("search-room-type")}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
      </div>

      <DataTable
        columns={columns}
        data={items}
        loading={isLoading}
        getRowId={(r) => r.id}
        emptyTitle={t("no-room-types")}
        emptyDescription={t("add-room-type-to-create-rooms")}
      />

      <Pagination
        page={page}
        totalPages={totalPagesOf(meta, items.length, ROOM_TYPES_PAGE_SIZE)}
        onPageChange={setPage}
      />

      <Dialog
        open={formOpen}
        onOpenChange={(o) => !submitting && setFormOpen(o)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? t("edit-room-type") : t("add-room-type")}
            </DialogTitle>
            <DialogDescription>
              {t("room-type-form-description")}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("type-name")}</FormLabel>
                    <FormControl>
                      <Input placeholder="Standard Room" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("price-per-month-baht")}</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} step="0.01" {...field} />
                    </FormControl>
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
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFormOpen(false)}
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

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={t("delete-room-type")}
        description={t("delete-confirm-description", {
          name: deleting?.name ?? "",
        })}
        confirmLabel={t("delete")}
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}
