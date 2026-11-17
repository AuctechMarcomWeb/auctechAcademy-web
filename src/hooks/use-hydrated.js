"use client";

import { useAuth } from "@/store/auth.store";
import { useDb } from "@/store/db.store";
import { useLearning } from "@/store/learning.store";

/** True once every persisted store has rehydrated from localStorage. */
export function useHydrated() {
  const a = useAuth((s) => s.hydrated);
  const b = useDb((s) => s.hydrated);
  const c = useLearning((s) => s.hydrated);
  return a && b && c;
}
