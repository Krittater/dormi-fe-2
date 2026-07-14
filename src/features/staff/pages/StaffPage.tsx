"use client";

import { useCallback, useMemo, useState } from "react";
import { Pencil, Plus, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
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
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { DataTable, type Column } from "@/components/shared/data-table";
import { useApartmentId } from "@/hooks/use-apartment-id";
import {
  useApartmentStaff,
  usePermissions,
  useRoleActions,
  useRoles,
} from "@/hooks/useRoles";
import { roleService, type RoleRecord } from "@/services/role.service";
import { P } from "@/lib/permissions";
import { useT } from "@/i18n";

export function StaffPage() {
  const t = useT();
  const apartmentId = useApartmentId();
  const { data: roles = [], isLoading: rolesLoading, error: rolesError, refetch: refetchRoles } =
    useRoles(apartmentId);
  const { data: staff = [], isLoading: staffLoading, error: staffError, refetch: refetchStaff } =
    useApartmentStaff(apartmentId);
  const { data: permissions = [] } = usePermissions(true);
  const { create, update, remove, setPermissions, setApartmentRoles } =
    useRoleActions(apartmentId);

  const positions = useMemo(
    () => roles.filter((r) => r.apartmentId === apartmentId && !r.isSystem),
    [roles, apartmentId]
  );

  const [positionOpen, setPositionOpen] = useState(false);
  const [editing, setEditing] = useState<RoleRecord | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [deleting, setDeleting] = useState<RoleRecord | null>(null);

  const [assignOpen, setAssignOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [lookupUserId, setLookupUserId] = useState<string | null>(null);
  const [lookupLabel, setLookupLabel] = useState("");
  const [assignRoleIds, setAssignRoleIds] = useState<string[]>([]);

  const permsByResource = useMemo(() => {
    const map = new Map<string, typeof permissions>();
    for (const p of permissions) {
      const list = map.get(p.resource) ?? [];
      list.push(p);
      map.set(p.resource, list);
    }
    return [...map.entries()];
  }, [permissions]);

  const openCreatePosition = useCallback(() => {
    setEditing(null);
    setName("");
    setDescription("");
    setSelectedCodes([]);
    setPositionOpen(true);
  }, []);

  const openEditPosition = useCallback(async (role: RoleRecord) => {
    setEditing(role);
    setName(role.name);
    setDescription(role.description ?? "");
    try {
      const detail = await roleService.detail(role.roleId);
      setSelectedCodes(detail.permissionCodes ?? []);
    } catch {
      setSelectedCodes([]);
    }
    setPositionOpen(true);
  }, []);

  const toggleCode = (code: string) => {
    setSelectedCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const savePosition = async () => {
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
        apartmentId,
        permissionCodes: selectedCodes,
      });
    }
    setPositionOpen(false);
  };

  const handleLookup = async () => {
    if (!email.trim()) return;
    try {
      const user = await roleService.lookupStaff(apartmentId, email.trim());
      setLookupUserId(user.userId);
      setLookupLabel(
        [user.firstNameTH, user.lastNameTH].filter(Boolean).join(" ") ||
          user.email
      );
      const existing = staff.find((s) => s.userId === user.userId);
      setAssignRoleIds(existing?.roles.map((r) => r.roleId) ?? []);
    } catch {
      setLookupUserId(null);
      setLookupLabel("");
      toast.error(t("staff-user-not-found"));
    }
  };

  const saveAssignment = async () => {
    if (!lookupUserId) {
      toast.error(t("staff-lookup-first"));
      return;
    }
    await setApartmentRoles.mutateAsync({
      userId: lookupUserId,
      apartmentId,
      roleIds: assignRoleIds,
    });
    setAssignOpen(false);
    setEmail("");
    setLookupUserId(null);
    setAssignRoleIds([]);
  };

  const positionColumns: Column<RoleRecord>[] = [
    {
      key: "name",
      header: t("role-name"),
      cell: (row) => (
        <div>
          <div className="font-medium text-gray-900">{row.name}</div>
          <div className="text-xs text-gray-500">{row.code}</div>
        </div>
      ),
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
          <PermissionGate permission={P.staff.update}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => void openEditPosition(row)}
              aria-label={t("edit")}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </PermissionGate>
          <PermissionGate permission={P.staff.delete}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDeleting(row)}
              aria-label={t("delete")}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </PermissionGate>
        </div>
      ),
    },
  ];

  const staffColumns: Column<(typeof staff)[number]>[] = [
    {
      key: "name",
      header: t("staff-member"),
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
      key: "roles",
      header: t("staff-positions"),
      cell: (row) =>
        row.roles.map((r) => r.name).join(", ") || "—",
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title={t("nav-staff")}
        description={t("staff-page-description")}
        actions={
          <div className="flex flex-wrap gap-2">
            <PermissionGate permission={P.staff.update}>
              <Button variant="outline" onClick={() => setAssignOpen(true)}>
                <UserPlus className="h-4 w-4" />
                {t("assign-staff")}
              </Button>
            </PermissionGate>
            <PermissionGate permission={P.staff.create}>
              <Button onClick={openCreatePosition}>
                <Plus className="h-4 w-4" />
                {t("add-position")}
              </Button>
            </PermissionGate>
          </div>
        }
      />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">
          {t("staff-positions")}
        </h2>
        {rolesError ? (
          <ErrorState error={rolesError} onRetry={() => refetchRoles()} />
        ) : (
          <DataTable
            columns={positionColumns}
            data={positions}
            loading={rolesLoading}
            getRowId={(row) => row.roleId}
            emptyTitle={t("no-positions")}
            emptyDescription={t("no-positions-description")}
          />
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">
          {t("staff-members")}
        </h2>
        {staffError ? (
          <ErrorState error={staffError} onRetry={() => refetchStaff()} />
        ) : staff.length === 0 && !staffLoading ? (
          <EmptyState
            icon={UserPlus}
            title={t("no-staff")}
            description={t("no-staff-description")}
          />
        ) : (
          <DataTable
            columns={staffColumns}
            data={staff}
            loading={staffLoading}
            getRowId={(row) => row.userId}
            emptyTitle={t("no-staff")}
            emptyDescription={t("no-staff-description")}
          />
        )}
      </section>

      <Dialog open={positionOpen} onOpenChange={setPositionOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? t("edit-position") : t("add-position")}
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
            <Button variant="outline" onClick={() => setPositionOpen(false)}>
              {t("cancel")}
            </Button>
            <Button
              onClick={() => void savePosition()}
              disabled={create.isPending || update.isPending || setPermissions.isPending}
            >
              {t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("assign-staff")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder={t("staff-email-placeholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button variant="outline" onClick={() => void handleLookup()}>
                {t("lookup")}
              </Button>
            </div>
            {lookupUserId && (
              <p className="text-sm text-gray-700">
                {t("staff-found")}: <strong>{lookupLabel}</strong>
              </p>
            )}
            <div className="space-y-2">
              <p className="text-sm font-medium">{t("staff-positions")}</p>
              {positions.length === 0 ? (
                <p className="text-sm text-gray-500">{t("no-positions")}</p>
              ) : (
                positions.map((role) => (
                  <label
                    key={role.roleId}
                    className="flex items-center gap-2 text-sm"
                  >
                    <Checkbox
                      checked={assignRoleIds.includes(role.roleId)}
                      onCheckedChange={(checked) => {
                        setAssignRoleIds((prev) =>
                          checked
                            ? [...prev, role.roleId]
                            : prev.filter((id) => id !== role.roleId)
                        );
                      }}
                    />
                    {role.name}
                  </label>
                ))
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>
              {t("cancel")}
            </Button>
            <Button
              onClick={() => void saveAssignment()}
              disabled={setApartmentRoles.isPending}
            >
              {t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={t("delete-position")}
        description={t("delete-position-confirm")}
        onConfirm={async () => {
          if (!deleting) return;
          await remove.mutateAsync(deleting.roleId);
          setDeleting(null);
        }}
      />
    </div>
  );
}
