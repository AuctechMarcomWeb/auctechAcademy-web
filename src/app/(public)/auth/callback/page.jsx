"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AuthCard } from "@/components/auth/auth-card";
import { Spinner } from "@/components/shared/loading";
import { authService } from "@/services/auth.service";
import { ApiError } from "@/services/api-client";
import { ROUTES } from "@/lib/constants";

/** The backend's Google OAuth callback redirects here with #token=… (or #error=…). */
export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState(null);

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    window.history.replaceState(null, "", window.location.pathname);
    const token = hash.get("token");
    const err = hash.get("error");
    const run = err || !token ? Promise.reject(new ApiError(err ?? "Sign-in did not complete.")) : authService.loginWithToken(token);
    run
      .then((user) => {
        toast.success(`Welcome, ${user.name.split(" ")[0]}`);
        router.replace(user.role === "admin" ? ROUTES.admin.dashboard : ROUTES.student.dashboard);
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Sign-in failed."));
  }, [router]);

  return (
    <AuthCard title={error ? "Sign-in failed" : "Signing you in…"}>
      {error ? (
        <p className="text-center text-sm text-muted-foreground">
          {error}{" "}
          <Link href={ROUTES.login} className="font-medium text-secondary hover:underline">
            Back to login
          </Link>
        </p>
      ) : (
        <Spinner label="Finishing Google sign-in…" />
      )}
    </AuthCard>
  );
}
