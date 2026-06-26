import { create } from "zustand";
import { persist } from "zustand/middleware";

import { api } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import type { Apartment } from "@/types";

interface ApartmentState {
  apartments: Apartment[];
  currentApartmentId: string | null;
  isLoading: boolean;
  hasLoaded: boolean;
  fetchApartments: () => Promise<Apartment[]>;
  setCurrent: (id: string | null) => void;
  upsertLocal: (apartment: Apartment) => void;
  removeLocal: (id: string) => void;
  getCurrent: () => Apartment | undefined;
}

export const useApartmentStore = create<ApartmentState>()(
  persist(
    (set, get) => ({
      apartments: [],
      currentApartmentId: null,
      isLoading: false,
      hasLoaded: false,

      fetchApartments: async () => {
        set({ isLoading: true });
        try {
          const data = await api.get<Apartment[]>(endpoints.apartments.list());
          const list = Array.isArray(data) ? data : [];
          const current = get().currentApartmentId;
          const stillExists = list.some((apt) => apt.id === current);
          set({
            apartments: list,
            isLoading: false,
            hasLoaded: true,
            currentApartmentId: stillExists
              ? current
              : list[0]?.id ?? null,
          });
          return list;
        } catch (err) {
          set({ isLoading: false, hasLoaded: true });
          throw err;
        }
      },

      setCurrent: (id) => set({ currentApartmentId: id }),

      upsertLocal: (apartment) =>
        set((state) => {
          const idx = state.apartments.findIndex((a) => a.id === apartment.id);
          const apartments =
            idx >= 0
              ? state.apartments.map((a) =>
                  a.id === apartment.id ? apartment : a
                )
              : [...state.apartments, apartment];
          return {
            apartments,
            currentApartmentId: state.currentApartmentId ?? apartment.id,
          };
        }),

      removeLocal: (id) =>
        set((state) => {
          const apartments = state.apartments.filter((a) => a.id !== id);
          return {
            apartments,
            currentApartmentId:
              state.currentApartmentId === id
                ? apartments[0]?.id ?? null
                : state.currentApartmentId,
          };
        }),

      getCurrent: () =>
        get().apartments.find((a) => a.id === get().currentApartmentId),
    }),
    {
      name: "dormi-apartment",
      partialize: (state) => ({
        currentApartmentId: state.currentApartmentId,
      }),
    }
  )
);
