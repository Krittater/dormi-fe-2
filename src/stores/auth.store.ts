import { create } from "zustand";
import { persist } from "zustand/middleware";

import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { useApartmentStore } from "@/stores/apartment.store";
import type { User } from "@/types";

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
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  markAuthenticated: () => void;
  markUnauthenticated: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
  user: null,
  isAuthenticated: false,
  isBootstrapping: true,

  login: async (payload) => {
    const data = await api.post<Partial<User> & { userId?: string }>(
      endpoints.auth.login(),
      payload
    );
    const user: User = {
      id: data?.id ?? data?.userId ?? "",
      email: data?.email ?? payload.email,
      phone: data?.phone,
      firstNameTH: data?.firstNameTH ?? null,
      lastNameTH: data?.lastNameTH ?? null,
    };
    set({ user, isAuthenticated: true, isBootstrapping: false });
  },

  register: async (payload) => {
    await api.post(endpoints.auth.register(), payload);
  },

  logout: async () => {
    try {
      await api.post(endpoints.auth.logout());
    } finally {
      set({ user: null, isAuthenticated: false, isBootstrapping: false });
      useApartmentStore.getState().reset();
    }
  },

  markAuthenticated: () => set({ isAuthenticated: true, isBootstrapping: false }),

  markUnauthenticated: () =>
    set({ user: null, isAuthenticated: false, isBootstrapping: false }),
    }),
    {
      // เก็บเฉพาะโปรไฟล์ไว้แสดงชื่อหลัง refresh — สถานะ login จริงยังตรวจ
      // จาก API ตอน bootstrap เสมอ (cookie คือ source of truth)
      name: "dormi-auth",
      partialize: (s) => ({ user: s.user }),
      // rehydrate หลัง mount เท่านั้น กัน SSR/client HTML ไม่ตรงกัน
      skipHydration: true,
    }
  )
);
