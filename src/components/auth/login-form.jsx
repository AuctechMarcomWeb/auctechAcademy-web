"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, FlaskConical } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { PasswordInput } from "./password-input";
import { GoogleButton, OrDivider } from "./google-button";
import { authService } from "@/services/auth.service";
import { ApiError } from "@/services/api-client";
import { ADMIN_URL, APP_KIND, DEMO_ACCOUNTS, FRONTEND_URL, ROUTES } from "@/lib/constants";
import { useServerConfig } from "@/services/sync.service";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next");
  const [error, setError] = useState(null);
  const [wrongPortal, setWrongPortal] = useState(false);
  const config = useServerConfig((s) => s.config);
  const demoAccounts = DEMO_ACCOUNTS.filter((a) => a.role === (APP_KIND === "admin" ? "admin" : "student"));
  const form = useForm({ resolver: zodResolver(schema), defaultValues: { email: "", password: "" } });
  const { register, handleSubmit, setValue, formState } = form;

  const onSubmit = async (values) => {
    setError(null);
    try {
      const user = await authService.login(values);
      const expected = APP_KIND === "admin" ? "admin" : "student";
      if (user.role !== expected) {
        await authService.logout();
        setError(
          APP_KIND === "admin"
            ? "This portal is for administrators. Students sign in on the main website."
            : "Admin accounts sign in on the admin portal.",
        );
        setWrongPortal(true);
        return;
      }
      toast.success(`Welcome back, ${user.name.split(" ")[0]}`);
      if (user.role === "admin") router.push(next && next.startsWith("/admin") ? next : ROUTES.admin.dashboard);
      else router.push(next && next.startsWith("/") && !next.startsWith("//") ? next : ROUTES.student.dashboard);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Unable to sign in. Please try again.");
    }
  };

  return (
    <div>
      <GoogleButton />
      <OrDivider />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {error && (
          <div role="alert" className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>
              {error}{" "}
              {wrongPortal && (
                <a className="font-semibold underline" href={APP_KIND === "admin" ? `${FRONTEND_URL}${ROUTES.login}` : `${ADMIN_URL}${ROUTES.login}`}>
                  {APP_KIND === "admin" ? "Go to the website" : "Open the admin portal"}
                </a>
              )}
            </span>
          </div>
        )}
        <FormField label="Email" htmlFor="email" error={formState.errors.email?.message} required>
          <Input
            data-testid="login-email"
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={!!formState.errors.email}
            {...register("email")}
          />
        </FormField>
        <FormField label="Password" htmlFor="password" error={formState.errors.password?.message} required>
          <PasswordInput
            data-testid="login-password"
            id="password"
            autoComplete="current-password"
            placeholder="••••••••"
            aria-invalid={!!formState.errors.password}
            {...register("password")}
          />
        </FormField>
        <div className="flex justify-end -mt-1">
          <Link href={ROUTES.forgotPassword} className="text-xs font-medium text-secondary hover:underline">
            Forgot password?
          </Link>
        </div>
        <Button data-testid="login-submit" type="submit" className="w-full" loading={formState.isSubmitting}>
          Sign in
        </Button>
      </form>

      {config?.demoReset && (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-900">
            <FlaskConical className="h-3.5 w-3.5" /> Demo accounts
          </p>
          <p className="mt-1 text-xs text-amber-800">
            Seeded by <code className="font-mono">npm run seed</code> on the backend. Password: <code className="font-mono">password123</code>
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {demoAccounts.map((a) => (
              <Button
                key={a.email}
                type="button"
                size="sm"
                variant="outline"
                className="bg-white"
                onClick={() => {
                  setValue("email", a.email, { shouldValidate: true });
                  setValue("password", a.password, { shouldValidate: true });
                }}
              >
                Fill {a.role} login
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
