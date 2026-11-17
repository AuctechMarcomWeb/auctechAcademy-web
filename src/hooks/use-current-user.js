"use client";

import { useAuth } from "@/store/auth.store";
import { useDb } from "@/store/db.store";

export function useCurrentUser() {
  const userId = useAuth((s) => s.userId);
  const user = useDb((s) => (userId ? s.users.find((u) => u.id === userId) : undefined));
  return user;
}
