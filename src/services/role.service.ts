import { http } from "@/api";
import { endpoints } from "@/lib/endpoints";

export interface RoleRecord {
  roleId: string;
  code: string;
  name: string;
  description: string | null;
  scope: "GLOBAL" | "APARTMENT";
  apartmentId: string | null;
  isSystem: boolean;
  isSuperuser: boolean;
  permissionCodes?: string[];
}

export interface PermissionRecord {
  permissionId: string;
  code: string;
  resource: string;
  action: string;
  description: string | null;
  httpRoutes: { method: string; path: string }[] | null;
}

export interface ApartmentStaffMember {
  userId: string;
  email: string;
  firstNameTH: string | null;
  lastNameTH: string | null;
  roles: { roleId: string; code: string; name: string }[];
}

export interface StaffLookupUser {
  userId: string;
  email: string;
  firstNameTH: string | null;
  lastNameTH: string | null;
}

export const roleService = {
  list(apartmentId?: string): Promise<RoleRecord[]> {
    return http.get(endpoints.roles.list(apartmentId));
  },

  detail(roleId: string): Promise<RoleRecord> {
    return http.get(endpoints.roles.detail(roleId));
  },

  create(payload: {
    name: string;
    description?: string;
    apartmentId?: string;
    permissionCodes?: string[];
  }): Promise<RoleRecord> {
    return http.post(endpoints.roles.create(), payload);
  },

  update(
    roleId: string,
    payload: { name?: string; description?: string }
  ): Promise<RoleRecord> {
    return http.patch(endpoints.roles.update(roleId), payload);
  },

  remove(roleId: string): Promise<void> {
    return http.delete(endpoints.roles.remove(roleId));
  },

  setPermissions(
    roleId: string,
    permissionCodes: string[]
  ): Promise<RoleRecord> {
    return http.put(endpoints.roles.permissions(roleId), { permissionCodes });
  },

  setUserApartmentRoles(
    userId: string,
    apartmentId: string,
    roleIds: string[]
  ): Promise<{ message: string }> {
    return http.put(endpoints.roles.setUserApartment(userId, apartmentId), {
      roleIds,
    });
  },

  setUserGlobalRoles(
    userId: string,
    roleIds: string[]
  ): Promise<{ message: string }> {
    return http.put(endpoints.roles.setUserGlobal(userId), { roleIds });
  },

  listPermissions(assignableToApartment?: boolean): Promise<PermissionRecord[]> {
    return http.get(endpoints.permissions.list(assignableToApartment));
  },

  listStaff(apartmentId: string): Promise<ApartmentStaffMember[]> {
    return http.get(endpoints.staff.list(apartmentId));
  },

  lookupStaff(
    apartmentId: string,
    email: string
  ): Promise<StaffLookupUser> {
    return http.get(endpoints.staff.lookup(apartmentId, email));
  },
};
