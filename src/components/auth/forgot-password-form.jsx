"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { toast } from "sonner";
import { ApiError } from "@/services/api-client";
import { authService } from "@/services/auth.service";
import { ROUTES } from "@/lib/constants";

const schema = z.object({ email: z.string().email("Enter a valid email address") });

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(null);
  const { register, handleSubmit, formState } = useForm({ resolver: zodResolver(schema), defaultValues: { email: "" } });

  if (sent) {
    return (
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success">
          <MailCheck className="h-6 w-6" />
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          If an account exists for <span className="font-medium text-foreground">{sent}</span>, a password reset link has been sent. Check your inbox
          and spam folder.
        </p>
        <Button asChild variant="outline" className="mt-6 w-full">
          <Link href={ROUTES.login}>Back to login</Link>
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(async (v) => {
        try {
          await authService.forgotPassword(v.email);
          setSent(v.email);
        } catch (e) {
          toast.error(e instanceof ApiError ? e.message : "Could not send the reset link. Please try again.");
        }
      })}
      className="space-y-4"
      noValidate
    >
      <FormField label="Email" htmlFor="email" error={formState.errors.email?.message} required hint="We'll send a reset link to this address.">
        <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" {...register("email")} />
      </FormField>
      <Button type="submit" className="w-full" loading={formState.isSubmitting}>
        Send reset link
      </Button>
    </form>
  );
}
