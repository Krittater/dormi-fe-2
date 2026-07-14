import { create } from "zustand";
import { persist } from "zustand/middleware";

import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { useApartmentStore } from "@/stores/apartment.store";
import type { Me, RoleAssignment, User } from "@/types";

interface LoginPayload {
  email: string;
  password: string;
}

interface RegisterPayload {
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  firstNameTH?: string;
  lastNameTH?: string;
  first_name_en?: string;
  last_name_en?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  // RBAC — โหลดใหม่ทุก bootstrap (ไม่ persist)
  isSuperuser: boolean;
  roles: RoleAssignment[];
  permissions: string[];
  apartmentPermissions: Record<string, string[]>;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
  can: (permission: string, apartmentId?: string | null) => boolean;
  markAuthenticated: () => void;
  markUnauthenticated: () => void;
}

const EMPTY_RBAC = {
  isSuperuser: false,
  roles: [] as RoleAssignment[],
  permissions: [] as string[],
  apartmentPermissions: {} as Record<string, string[]>,
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isBootstrapping: true,
      ...EMPTY_RBAC,

      login: async (payload) => {
        await api.post(endpoints.auth.login(), payload);
        // ดึงสิทธิ์ + โปรไฟล์จริงจาก /auth/me (source of truth)
        await get().fetchMe();
      },

      register: async (payload) => {
        await api.post(endpoints.auth.register(), payload);
      },

      logout: async () => {
        try {
          await api.post(endpoints.auth.logout());
        } finally {
          set({
            user: null,
            isAuthenticated: false,
            isBootstrapping: false,
            ...EMPTY_RBAC,
          });
          useApartmentStore.getState().reset();
        }
      },

      fetchMe: async () => {
        const me = await api.get<Me>(endpoints.auth.me());
        const user: User = {
          id: me.user.userId,
          email: me.user.email,
          firstNameTH: me.user.firstNameTH,
          lastNameTH: me.user.lastNameTH,
        };
        set({
          user,
          isAuthenticated: true,
          isBootstrapping: false,
          isSuperuser: me.isSuperuser,
          roles: me.roles,
          permissions: me.permissions,
          apartmentPermissions: me.apartmentPermissions ?? {},
        });
      },

      can: (permission, apartmentId) => {
        const s = get();
        if (s.isSuperuser) return true;
        if (s.permissions.includes(permission)) return true;
        if (apartmentId) {
          const scoped = s.apartmentPermissions[apartmentId];
          if (scoped?.includes(permission)) return true;
        }
        return false;
      },

      markAuthenticated: () =>
        set({ isAuthenticated: true, isBootstrapping: false }),

      markUnauthenticated: () =>
        set({
          user: null,
          isAuthenticated: false,
          isBootstrapping: false,
          ...EMPTY_RBAC,
        }),
    }),
    {
      // เก็บเฉพาะโปรไฟล์ไว้แสดงชื่อหลัง refresh — สถานะ login + สิทธิ์จริง
      // ยังตรวจจาก /auth/me ตอน bootstrap เสมอ (cookie คือ source of truth)
      name: "dormi-auth",
      partialize: (s) => ({ user: s.user }),
      // rehydrate หลัง mount เท่านั้น กัน SSR/client HTML ไม่ตรงกัน
      skipHydration: true,
    }
  )
);
