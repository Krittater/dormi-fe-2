"use client";

import { useCallback, useMemo, useState } from "react";
import { Pencil, Plus, Shield, Trash2 } from "lucide-react";
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
import { PageHeader } from "@/components/shared/page-header";
import { PermissionGate } from "@/components/shared/permission-gate";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ErrorState } from "@/components/shared/error-state";
import { DataTable, type Column } from "@/components/shared/data-table";
import {
  usePermissions,
  useRoleActions,
  useRoles,
} from "@/hooks/useRoles";
import { roleService, type RoleRecord } from "@/services/role.service";
import { P } from "@/lib/permissions";
import { useT } from "@/i18n";

export function AdminRolesPage() {
  const t = useT();
  const { data: roles = [], isLoading, error, refetch } = useRoles();
  const { data: permissions = [] } = usePermissions(false);
  const { create, update, remove, setPermissions } = useRoleActions();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RoleRecord | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [deleting, setDeleting] = useState<RoleRecord | null>(null);
  const [viewing, setViewing] = useState<RoleRecord | null>(null);
  const [viewCodes, setViewCodes] = useState<string[]>([]);

  const customGlobal = useMemo(
    () => roles.filter((r) => !r.apartmentId && !r.isSystem),
    [roles]
  );
  const systemRoles = useMemo(
    () => roles.filter((r) => r.isSystem),
    [roles]
  );

  const permsByResource = useMemo(() => {
    const map = new Map<string, typeof permissions>();
    for (const p of permissions) {
      const list = map.get(p.resource) ?? [];
      list.push(p);
      map.set(p.resource, list);
    }
    return [...map.entries()];
  }, [permissions]);

  const openCreate = useCallback(() => {
    setEditing(null);
    setName("");
    setDescription("");
    setSelectedCodes([]);
    setOpen(true);
  }, []);

  const openEdit = useCallback(async (role: RoleRecord) => {
    if (role.isSystem) {
      toast.error(t("system-role-readonly"));
      return;
    }
    setEditing(role);
    setName(role.name);
    setDescription(role.description ?? "");
    try {
      const detail = await roleService.detail(role.roleId);
      setSelectedCodes(detail.permissionCodes ?? []);
    } catch {
      setSelectedCodes([]);
    }
    setOpen(true);
  }, [t]);

  const openView = useCallback(async (role: RoleRecord) => {
    setViewing(role);
    try {
      const detail = await roleService.detail(role.roleId);
      setViewCodes(detail.permissionCodes ?? []);
    } catch {
      setViewCodes([]);
    }
  }, []);

  const toggleCode = (code: string) => {
    setSelectedCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const save = async () => {
    if (!name.trim()) {
      toast.error(t("role-name-required"));
      return;
    }
    if (editing) {
      await update.mutateAsync({
        roleId: editing.roleId,
        name: name.trim(),
        description: description.trim() || undefined,
      });
      await setPermissions.mutateAsync({
        roleId: editing.roleId,
        permissionCodes: selectedCodes,
      });
    } else {
      await create.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        permissionCodes: selectedCodes,
      });
    }
    setOpen(false);
  };

  const columns: Column<RoleRecord>[] = [
    {
      key: "name",
      header: t("role-name"),
      cell: (row) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">{row.name}</span>
            {row.isSystem && <Badge variant="secondary">{t("system-role")}</Badge>}
            {row.isSuperuser && <Badge>{t("superuser")}</Badge>}
          </div>
          <div className="text-xs text-gray-500">{row.code}</div>
        </div>
      ),
    },
    {
      key: "scope",
      header: t("role-scope"),
      cell: (row) => row.scope,
    },
    {
      key: "description",
      header: t("role-description"),
      cell: (row) => row.description || "—",
    },
    {
      key: "actions",
      header: "",
      cell: (row) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => void openView(row)}
            aria-label={t("view")}
          >
            <Shield className="h-4 w-4" />
          </Button>
          {!row.isSystem && (
            <>
              <PermissionGate permission={P.role.update}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => void openEdit(row)}
                  aria-label={t("edit")}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </PermissionGate>
              <PermissionGate permission={P.role.delete}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleting(row)}
                  aria-label={t("delete")}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </PermissionGate>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title={t("nav-admin-roles")}
        description={t("admin-roles-description")}
        actions={
          <PermissionGate permission={P.role.create}>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              {t("add-role")}
            </Button>
          </PermissionGate>
        }
      />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">
          {t("system-roles")}
        </h2>
        {error ? (
          <ErrorState error={error} onRetry={() => refetch()} />
        ) : (
          <DataTable
            columns={columns}
            data={systemRoles}
            loading={isLoading}
            getRowId={(row) => row.roleId}
            emptyTitle={t("no-roles")}
          />
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">
          {t("custom-roles")}
        </h2>
        <DataTable
          columns={columns}
          data={customGlobal}
          loading={isLoading}
          getRowId={(row) => row.roleId}
          emptyTitle={t("no-custom-roles")}
          emptyDescription={t("no-custom-roles-description")}
        />
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? t("edit-role") : t("add-role")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t("role-name")}</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                {t("role-description")}
              </label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="space-y-3">
              <p className="text-sm font-medium">{t("role-permissions")}</p>
              {permsByResource.map(([resource, perms]) => (
                <div key={resource} className="rounded-lg border p-3">
                  <p className="mb-2 text-xs font-semibold uppercase text-gray-500">
                    {resource}
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {perms.map((p) => (
                      <label
                        key={p.code}
                        className="flex items-center gap-2 text-sm"
                      >
                        <Checkbox
                          checked={selectedCodes.includes(p.code)}
                          onCheckedChange={() => toggleCode(p.code)}
                        />
                        <span>{p.description || p.code}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t("cancel")}
            </Button>
            <Button
              onClick={() => void save()}
              disabled={
                create.isPending || update.isPending || setPermissions.isPending
              }
            >
              {t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!viewing}
        onOpenChange={(o) => !o && setViewing(null)}
      >
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {viewing?.name} — {t("role-permissions")}
            </DialogTitle>
          </DialogHeader>
          {viewing?.isSuperuser ? (
            <p className="text-sm text-gray-600">{t("superuser-all-permissions")}</p>
          ) : viewCodes.length === 0 ? (
            <p className="text-sm text-gray-500">{t("no-permissions")}</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {viewCodes.map((code) => (
                <li key={code} className="rounded bg-gray-50 px-2 py-1 font-mono text-xs">
                  {code}
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={t("delete-role")}
        description={t("delete-role-confirm")}
        destructive
        onConfirm={async () => {
          if (!deleting) return;
          await remove.mutateAsync(deleting.roleId);
          setDeleting(null);
        }}
      />
    </div>
  );
}
