"use client";

import { useCallback, useMemo, useState } from "react";
import { Pencil, Plus, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pagination } from "@/components/ui/pagination";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionGate } from "@/components/shared/permission-gate";
import { FilterBar } from "@/components/shared/filter-bar";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ErrorState } from "@/components/shared/error-state";
import { DataTable, type Column } from "@/components/shared/data-table";
import { useFilterParams } from "@/hooks/use-filter-params";
import { useAdminUserActions, useAdminUsers } from "@/hooks/useAdminUsers";
import { useRoles } from "@/hooks/useRoles";
import { useAuthStore } from "@/stores/auth.store";
import { DEFAULT_PAGE_SIZE } from "@/constants/config";
import { totalPagesOf } from "@/lib/list";
import { formatDate } from "@/lib/format";
import { P } from "@/lib/permissions";
import { useT } from "@/i18n";
import type { AdminUser } from "@/services/admin-user.service";

export function AdminUsersPage() {
  const t = useT();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const { values, setValue, clearAll, hasActiveFilters } = useFilterParams({
    defaults: { search: "", page: "1" },
    debounceKeys: ["search"],
  });
  const search = values.search;
  const page = Math.max(1, Number(values.page) || 1);

  const { data, isLoading, error, refetch } = useAdminUsers({
    search: search || undefined,
    page,
    limit: DEFAULT_PAGE_SIZE,
  });
  const { data: allRoles = [] } = useRoles();
  const { create, remove, setGlobalRoles } = useAdminUserActions();

  /** admin กำหนดได้ทุก role ระดับแพลตฟอร์ม (รวม superuser) — ไม่รวมตำแหน่งเฉพาะหอ */
  const globalRoles = useMemo(
    () => allRoles.filter((r) => !r.apartmentId),
    [allRoles]
  );

  const items = data?.items ?? [];
  const meta = data?.meta;

  const [createOpen, setCreateOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [target, setTarget] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState<AdminUser | null>(null);
  const [assignRoleIds, setAssignRoleIds] = useState<string[]>([]);

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstNameTH, setFirstNameTH] = useState("");
  const [lastNameTH, setLastNameTH] = useState("");
  const [createRoleIds, setCreateRoleIds] = useState<string[]>([]);

  const openCreate = useCallback(() => {
    setEmail("");
    setPhone("");
    setPassword("");
    setConfirmPassword("");
    setFirstNameTH("");
    setLastNameTH("");
    setCreateRoleIds([]);
    setCreateOpen(true);
  }, []);

  const openAssign = useCallback((user: AdminUser) => {
    setTarget(user);
    setAssignRoleIds(user.roles.map((r) => r.roleId));
    setAssignOpen(true);
  }, []);

  const saveCreate = async () => {
    if (!email.trim() || !phone.trim() || !password) {
      toast.error(t("user-form-required"));
      return;
    }
    if (password !== confirmPassword) {
      toast.error(t("passwords-not-matching"));
      return;
    }
    const created = await create.mutateAsync({
      email: email.trim(),
      phone: phone.trim(),
      password,
      confirmPassword,
      firstNameTH: firstNameTH.trim() || undefined,
      lastNameTH: lastNameTH.trim() || undefined,
    });
    if (createRoleIds.length > 0 && created.userId) {
      await setGlobalRoles.mutateAsync({
        userId: created.userId,
        roleIds: createRoleIds,
      });
    }
    setCreateOpen(false);
  };

  const saveAssign = async () => {
    if (!target) return;
    await setGlobalRoles.mutateAsync({
      userId: target.userId,
      roleIds: assignRoleIds,
    });
    setAssignOpen(false);
    setTarget(null);
  };

  const columns: Column<AdminUser>[] = [
    {
      key: "name",
      header: t("user-name"),
      cell: (row) => (
        <div>
          <div className="font-medium text-gray-900">
            {[row.firstNameTH, row.lastNameTH].filter(Boolean).join(" ") ||
              "—"}
          </div>
          <div className="text-xs text-gray-500">{row.email}</div>
        </div>
      ),
    },
    {
      key: "phone",
      header: t("phone"),
      cell: (row) => row.phone,
    },
    {
      key: "roles",
      header: t("user-roles"),
      cell: (row) =>
        row.roles.length === 0 ? (
          <span className="text-gray-400">—</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {row.roles.map((r) => (
              <Badge key={r.roleId} variant="secondary">
                {r.name}
              </Badge>
            ))}
          </div>
        ),
    },
    {
      key: "status",
      header: t("status"),
      cell: (row) => (
        <Badge variant={row.status === "active" ? "success" : "secondary"}>
          {row.status}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      header: t("created-at"),
      cell: (row) => formatDate(row.createdAt),
    },
    {
      key: "actions",
      header: "",
      cell: (row) => {
        const isSelf = row.userId === currentUserId;
        return (
          <div className="flex justify-end gap-1">
            <PermissionGate permission={P.user.update}>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => openAssign(row)}
                aria-label={t("assign-roles")}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </PermissionGate>
            <PermissionGate permission={P.user.delete}>
              <Button
                variant="ghost"
                size="icon"
                disabled={isSelf}
                onClick={() => setDeleting(row)}
                aria-label={t("delete")}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </PermissionGate>
          </div>
        );
      },
    },
  ];

  const roleChecklist = (
    selected: string[],
    onChange: (ids: string[]) => void
  ) => (
    <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border p-3">
      {globalRoles.length === 0 ? (
        <p className="text-sm text-gray-500">{t("no-roles")}</p>
      ) : (
        globalRoles.map((role) => (
          <label key={role.roleId} className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={selected.includes(role.roleId)}
              onCheckedChange={(checked) => {
                onChange(
                  checked
                    ? [...selected, role.roleId]
                    : selected.filter((id) => id !== role.roleId)
                );
              }}
            />
            <span className="flex flex-wrap items-center gap-1.5">
              {role.name}
              <span className="text-xs text-gray-400">({role.code})</span>
              {role.isSuperuser && (
                <Badge variant="warning">{t("superuser")}</Badge>
              )}
              {role.isSystem && (
                <Badge variant="secondary">{t("system-role")}</Badge>
              )}
            </span>
          </label>
        ))
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("nav-admin-users")}
        description={t("admin-users-description")}
        actions={
          <PermissionGate permission={P.user.create}>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              {t("add-user")}
            </Button>
          </PermissionGate>
        }
      />

      <FilterBar
        search={{
          value: search,
          onChange: (v) => {
            setValue("search", v);
            setValue("page", "1");
          },
          placeholder: t("search-users-placeholder"),
        }}
        onClear={clearAll}
        showClear={hasActiveFilters}
      />

      {error ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : (
        <DataTable
          columns={columns}
          data={items}
          loading={isLoading}
          getRowId={(row) => row.userId}
          emptyTitle={t("no-users")}
          emptyDescription={t("no-users-description")}
        />
      )}

      <Pagination
        page={page}
        totalPages={totalPagesOf(meta, items.length, DEFAULT_PAGE_SIZE)}
        onPageChange={(p) => setValue("page", String(p))}
      />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("add-user")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t("first-name")}</label>
                <Input
                  value={firstNameTH}
                  onChange={(e) => setFirstNameTH(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t("last-name")}</label>
                <Input
                  value={lastNameTH}
                  onChange={(e) => setLastNameTH(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t("email")}</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t("phone")}</label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t("password")}</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                {t("confirm-password")}
              </label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                {t("assign-roles-optional")}
              </label>
              {roleChecklist(createRoleIds, setCreateRoleIds)}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              {t("cancel")}
            </Button>
            <Button
              onClick={() => void saveCreate()}
              disabled={create.isPending || setGlobalRoles.isPending}
            >
              <UserPlus className="h-4 w-4" />
              {t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("assign-roles")}
              {target ? ` — ${target.email}` : ""}
            </DialogTitle>
          </DialogHeader>
          {roleChecklist(assignRoleIds, setAssignRoleIds)}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>
              {t("cancel")}
            </Button>
            <Button
              onClick={() => void saveAssign()}
              disabled={setGlobalRoles.isPending}
            >
              {t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={t("delete-user")}
        description={t("delete-user-confirm")}
        destructive
        onConfirm={async () => {
          if (!deleting) return;
          await remove.mutateAsync(deleting.userId);
          setDeleting(null);
        }}
      />
    </div>
  );
}
