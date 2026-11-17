"use client";

import { FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";
import { useServerConfig } from "@/services/sync.service";

/**
 * Shown while the backend runs without live Razorpay keys (demo payments) or
 * with the demo-reset switch on. Disappears automatically in production.
 */
export function DemoBanner({ className, compact }) {
  const config = useServerConfig((s) => s.config);
  if (!config || (!config.demoPayments && !config.demoReset)) return null;
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs font-medium px-3",
        compact ? "py-1" : "py-1.5",
        className,
      )}
      role="status"
    >
      <FlaskConical className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">
        {config.demoPayments
          ? "Test mode — payments are simulated (no Razorpay keys on the server). Data is stored in MongoDB."
          : "Test mode — demo data can be reset by an admin."}
      </span>
    </div>
  );
}

export function DemoTag({ className }) {
  const config = useServerConfig((s) => s.config);
  if (!config?.demoReset) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        className,
      )}
    >
      <FlaskConical className="h-3 w-3" /> Demo data
    </span>
  );
}
