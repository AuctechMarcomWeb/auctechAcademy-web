"use client";

import { useDb } from "@/store/db.store";

/** Share of a video (0–1) that must be watched before a lesson can be completed. Set by admins in Settings; the server enforces the same value. */
export function useWatchThreshold() {
  return useDb((s) => (s.settings.watchThresholdPercent ?? 90) / 100);
}
