"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { PasswordInput } from "./password-input";
import { authService } from "@/services/auth.service";
import { ApiError } from "@/services/api-client";
import { ROUTES } from "@/lib/constants";

const schema = z
  .object({
    password: z.string().min(8, "Use at least 8 characters"),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Passwords do not match" });

/** Landing page for the link in the password-reset email (?token=…&email=…). */
export function ResetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";
  const email = params.get("email") ?? "";
  const [error, setError] = useState(null);
  const { register, handleSubmit, formState } = useForm({ resolver: zodResolver(schema) });

  if (!token || !email) {
    return (
      <div className="text-center text-sm text-muted-foreground">
        This reset link is incomplete.{" "}
        <Link href={ROUTES.forgotPassword} className="font-medium text-secondary hover:underline">
          Request a new one
        </Link>
        .
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(async (v) => {
        setError(null);
        try {
          const user = await authService.resetPassword(email, token, v.password);
          toast.success("Password updated — you're signed in");
          router.push(user.role === "admin" ? ROUTES.admin.dashboard : ROUTES.student.dashboard);
        } catch (e) {
          setError(e instanceof ApiError ? e.message : "Could not reset the password.");
        }
      })}
      className="space-y-4"
      noValidate
    >
      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" /> {error}
        </div>
      )}
      <p className="text-sm text-muted-foreground">
        Choose a new password for <span className="font-medium text-foreground">{email}</span>.
      </p>
      <FormField label="New password" htmlFor="password" error={formState.errors.password?.message} required>
        <PasswordInput id="password" autoComplete="new-password" {...register("password")} />
      </FormField>
      <FormField label="Confirm password" htmlFor="confirm" error={formState.errors.confirm?.message} required>
        <PasswordInput id="confirm" autoComplete="new-password" {...register("confirm")} />
      </FormField>
      <Button type="submit" className="w-full" loading={formState.isSubmitting}>
        Set new password
      </Button>
    </form>
  );
}
