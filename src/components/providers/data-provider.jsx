"use client";

import * as React from "react";
import { useAuth } from "@/store/auth.store";
import { useDb } from "@/store/db.store";
import { syncService } from "@/services/sync.service";
import { toast } from "sonner";
import { API_URL, ApiError } from "@/services/api-client";

/**
 * Loads data from the backend once the session has been restored from
 * localStorage, and again whenever the signed-in user changes or the tab
 * regains focus after a while.
 */
export function DataProvider({ children }) {
  const authHydrated = useAuth((s) => s.hydrated);
  const token = useAuth((s) => s.token);
  const lastToken = React.useRef(undefined);

  React.useEffect(() => {
    if (!authHydrated) return;
    if (lastToken.current === token) return;
    const first = lastToken.current === undefined;
    lastToken.current = token;
    // First load: show the saved copy instantly, then refresh. Later token changes (login/logout) just re-sync.
    if (first) syncService.start();
    else if (!useDb.getState().syncing) void syncService.load();
  }, [authHydrated, token]);

  React.useEffect(() => {
    let last = Date.now();
    const onFocus = () => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - last > 60_000) {
        last = Date.now();
        syncService.refresh();
      }
    };
    document.addEventListener("visibilitychange", onFocus);
    return () => document.removeEventListener("visibilitychange", onFocus);
  }, []);

  // Safety net: any API error a component forgot to catch still reaches the user.
  React.useEffect(() => {
    const onRejection = (e) => {
      if (e.reason instanceof ApiError) {
        e.preventDefault();
        toast.error(e.reason.message);
      }
    };
    window.addEventListener("unhandledrejection", onRejection);
    return () => window.removeEventListener("unhandledrejection", onRejection);
  }, []);

  return <>{children}</>;
}

/** Shown in place of the page when the API can't be reached on first load. */
export function SyncErrorBanner() {
  const error = useDb((s) => s.syncError);
  const hasData = useDb((s) => s.courses.length > 0);
  if (!error) return null;
  return (
    <div role="alert" className="bg-destructive/10 border-b border-destructive/30 text-destructive text-xs font-medium px-3 py-2 text-center">
      {hasData ? "Lost connection to the server — showing the last loaded data." : `Could not load data from the API (${API_URL}). ${error}`}{" "}
      <button type="button" className="underline font-semibold" onClick={() => syncService.refresh()}>
        Retry
      </button>
    </div>
  );
}
