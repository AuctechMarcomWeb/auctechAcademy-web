"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "@/components/ui/form-field";
import { PasswordInput } from "./password-input";
import { GoogleButton, OrDivider } from "./google-button";
import { authService } from "@/services/auth.service";
import { ApiError } from "@/services/api-client";
import { ROUTES } from "@/lib/constants";

const schema = z
  .object({
    name: z.string().min(2, "Enter your full name"),
    email: z.string().email("Enter a valid email address"),
    phone: z.string().regex(/^\+?[0-9\s-]{10,15}$/, "Enter a valid phone number"),
    password: z.string().min(8, "Use at least 8 characters").regex(/[0-9]/, "Include at least one number"),
    confirm: z.string(),
    terms: z.boolean().refine((v) => v, { message: "You must accept the terms to continue" }),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Passwords do not match" });

export function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next");
  const [error, setError] = useState(null);
  const { register, handleSubmit, control, formState } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", phone: "", password: "", confirm: "", terms: false },
  });

  const onSubmit = async (values) => {
    setError(null);
    try {
      const user = await authService.register({ name: values.name, email: values.email, password: values.password, phone: values.phone });
      toast.success(`Account created. Welcome, ${user.name.split(" ")[0]}!`);
      router.push(next && next.startsWith("/") ? next : ROUTES.student.dashboard);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Unable to create your account. Please try again.");
    }
  };

  return (
    <div>
      <GoogleButton label="Sign up with Google" />
      <OrDivider />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {error && (
          <div role="alert" className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" /> {error}
          </div>
        )}
        <FormField label="Full name" htmlFor="name" error={formState.errors.name?.message} required>
          <Input id="name" autoComplete="name" placeholder="Ananya Sharma" aria-invalid={!!formState.errors.name} {...register("name")} />
        </FormField>
        <FormField label="Email" htmlFor="email" error={formState.errors.email?.message} required>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={!!formState.errors.email}
            {...register("email")}
          />
        </FormField>
        <FormField label="Phone" htmlFor="phone" error={formState.errors.phone?.message} required>
          <Input
            id="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+91 98765 43210"
            aria-invalid={!!formState.errors.phone}
            {...register("phone")}
          />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Password" htmlFor="password" error={formState.errors.password?.message} required>
            <PasswordInput id="password" autoComplete="new-password" aria-invalid={!!formState.errors.password} {...register("password")} />
          </FormField>
          <FormField label="Confirm password" htmlFor="confirm" error={formState.errors.confirm?.message} required>
            <PasswordInput id="confirm" autoComplete="new-password" aria-invalid={!!formState.errors.confirm} {...register("confirm")} />
          </FormField>
        </div>
        <FormField error={formState.errors.terms?.message}>
          <Controller
            control={control}
            name="terms"
            render={({ field }) => (
              <label className="flex items-start gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(v) => field.onChange(v === true)}
                  className="mt-0.5"
                  aria-invalid={!!formState.errors.terms}
                />
                <span className="text-muted-foreground">
                  I agree to the{" "}
                  <Link href="/terms" className="text-secondary hover:underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-secondary hover:underline">
                    Privacy Policy
                  </Link>
                  .
                </span>
              </label>
            )}
          />
        </FormField>
        <Button type="submit" className="w-full" loading={formState.isSubmitting}>
          Create account
        </Button>
      </form>
    </div>
  );
}
