"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { authService } from "@/services/auth.service";
import { ApiError } from "@/services/api-client";
import { useServerConfig } from "@/services/sync.service";
import { APP_KIND } from "@/lib/constants";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.8-5.5 3.8-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.9 1.5l2.6-2.6C16.9 3.1 14.7 2 12 2 6.5 2 2 6.5 2 12s4.5 10 10 10c5.8 0 9.6-4.1 9.6-9.8 0-.7-.1-1.2-.2-1.7H12z"
      />
    </svg>
  );
}

/**
 * Google OAuth entry point. Structured for a real provider integration:
 * authService.loginWithGoogle() redirects to the backend OAuth route once
 * NEXT_PUBLIC_GOOGLE_CLIENT_ID is configured. Nothing is simulated.
 */
/** Google sign-in is offered on the student website when the backend has OAuth credentials. */
function useGoogleEnabled() {
  const config = useServerConfig((s) => s.config);
  return APP_KIND === "frontend" && Boolean(config?.googleEnabled);
}

export function GoogleButton({ label = "Continue with Google" }) {
  const [loading, setLoading] = useState(false);
  const enabled = useGoogleEnabled();
  const onClick = async () => {
    setLoading(true);
    try {
      await authService.loginWithGoogle();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Google sign-in is unavailable right now.");
      setLoading(false);
    }
  };
  if (!enabled) return null;
  return (
    <Button type="button" variant="outline" className="w-full" onClick={onClick} loading={loading}>
      {!loading && <GoogleIcon />}
      {label}
    </Button>
  );
}

export function OrDivider() {
  const enabled = useGoogleEnabled();
  if (!enabled) return null;
  return (
    <div className="relative my-5">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t border-border" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-card px-2 text-muted-foreground">or continue with email</span>
      </div>
    </div>
  );
}
