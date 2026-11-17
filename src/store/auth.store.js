"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const useAuth = create()(
  persist(
    (set) => ({
      userId: null,
      role: null,
      token: null,
      hydrated: false,
      setSession: ({ userId, role, token }) => set({ userId, role, token }),
      clearSession: () => set({ userId: null, role: null, token: null }),
      setHydrated: (hydrated) => set({ hydrated }),
    }),
    {
      name: "auctech.session",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ userId: s.userId, role: s.role, token: s.token }),
      onRehydrateStorage: () => (state) => state?.setHydrated(true),
    },
  ),
);
