"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/store/auth.store";
import { useHydrated } from "@/hooks/use-hydrated";
import { ADMIN_URL, APP_KIND, FRONTEND_URL, ROUTES } from "@/lib/constants";
import { Spinner } from "@/components/shared/loading";

/**
 * Client-side route protection. Redirects unauthenticated users to /login
 * (remembering where they were going) and users with the wrong role to their
 * own portal — which may be the other app (student website ↔ admin portal).
 * The backend still authorises every API call.
 */
export function RouteGuard({ role, children }) {
  const hydrated = useHydrated();
  const userId = useAuth((s) => s.userId);
  const sessionRole = useAuth((s) => s.role);
  const router = useRouter();
  const pathname = usePathname();

  const authorised = Boolean(userId) && sessionRole === role;

  useEffect(() => {
    if (!hydrated) return;
    if (!userId) {
      router.replace(`${ROUTES.login}?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (sessionRole === role) return;
    const target = sessionRole === "admin" ? ROUTES.admin.dashboard : ROUTES.student.dashboard;
    const lives = sessionRole === "admin" ? "admin" : "frontend";
    if (lives === APP_KIND) router.replace(target);
    else {
      // The signed-in account belongs to the other app: sign out here and send them there.
      useAuth.getState().clearSession();
      window.location.assign(`${lives === "admin" ? ADMIN_URL : FRONTEND_URL}${ROUTES.login}`);
    }
  }, [hydrated, userId, sessionRole, role, router, pathname]);

  if (!hydrated || !authorised) return <Spinner label="Checking your session…" />;
  return <>{children}</>;
}
