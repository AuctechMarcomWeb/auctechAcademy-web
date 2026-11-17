"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Eye, EyeOff, KeyRound, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { FormField } from "@/components/ui/form-field";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { PageSkeleton } from "@/components/shared/loading";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useHydrated } from "@/hooks/use-hydrated";
import { authService } from "@/services/auth.service";
import { ApiError } from "@/services/api-client";
import { learningService } from "@/services/learning.service";
import { useServerConfig } from "@/services/sync.service";

const pwSchema = z
  .object({
    current: z.string().min(1, "Enter your current password"),
    next: z.string().min(8, "Use at least 8 characters").regex(/[0-9]/, "Include at least one number"),
    confirm: z.string(),
  })
  .refine((v) => v.next === v.confirm, { path: ["confirm"], message: "Passwords do not match" });

const NOTIFS = [
  { key: "courseUpdates", label: "Course updates", hint: "New lessons, resources and announcements." },
  { key: "assessmentReminders", label: "Assessment reminders", hint: "Upcoming quiz deadlines and assignment due dates." },
  { key: "internshipAlerts", label: "Internship alerts", hint: "Application status changes and new openings." },
  { key: "marketing", label: "Offers and recommendations", hint: "Occasional discounts and course suggestions." },
];

export default function SettingsPage() {
  const hydrated = useHydrated();
  const user = useCurrentUser();
  const config = useServerConfig((s) => s.config);
  const [show, setShow] = React.useState(false);
  const defaults = { courseUpdates: true, assessmentReminders: true, internshipAlerts: true, marketing: false };
  const notifs = { ...defaults, ...(user?.notificationPrefs ?? {}) };
  const [resetOpen, setResetOpen] = React.useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(pwSchema) });

  const toggle = async (key, value) => {
    try {
      await authService.updateNotifications({ ...notifs, [key]: value });
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not save your preference");
    }
  };

  if (!hydrated || !user) return <PageSkeleton />;

  const changePassword = async (v) => {
    try {
      await authService.changePassword(user.id, v.current, v.next);
      toast.success("Password updated");
      reset();
    } catch (e) {
      if (e instanceof ApiError && e.code === "invalid_password") setError("current", { message: e.message });
      else toast.error(e instanceof ApiError ? e.message : "Could not update password");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Security, notifications and demo controls." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="font-semibold inline-flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-secondary" /> Change password
          </h2>
          <form onSubmit={handleSubmit(changePassword)} className="mt-4 space-y-4">
            <FormField label="Current password" htmlFor="current" required error={errors.current?.message}>
              <Input
                id="current"
                type={show ? "text" : "password"}
                autoComplete="current-password"
                {...register("current")}
                aria-invalid={Boolean(errors.current)}
              />
            </FormField>
            <FormField label="New password" htmlFor="next" required error={errors.next?.message} hint="At least 8 characters with a number.">
              <Input
                id="next"
                type={show ? "text" : "password"}
                autoComplete="new-password"
                {...register("next")}
                aria-invalid={Boolean(errors.next)}
              />
            </FormField>
            <FormField label="Confirm new password" htmlFor="confirm" required error={errors.confirm?.message}>
              <Input
                id="confirm"
                type={show ? "text" : "password"}
                autoComplete="new-password"
                {...register("confirm")}
                aria-invalid={Boolean(errors.confirm)}
              />
            </FormField>
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />} {show ? "Hide" : "Show"} passwords
              </button>
              <Button type="submit" loading={isSubmitting}>
                Update password
              </Button>
            </div>
          </form>
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold">Notifications</h2>
          <p className="text-xs text-muted-foreground">Saved on this device.</p>
          <ul className="mt-4 divide-y divide-border">
            {NOTIFS.map((n) => (
              <li key={n.key} className="flex items-center justify-between gap-4 py-3">
                <div>
                  <Label htmlFor={`notif-${n.key}`} className="cursor-pointer">
                    {n.label}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">{n.hint}</p>
                </div>
                <Switch id={`notif-${n.key}`} checked={notifs[n.key]} onCheckedChange={(v) => toggle(n.key, v)} />
              </li>
            ))}
          </ul>
        </Card>

        {config?.demoReset && (
          <Card className="p-6 border-destructive/30 lg:col-span-2">
            <h2 className="font-semibold text-destructive">Danger zone</h2>
            <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Reset my demo progress</p>
                <p className="text-xs text-muted-foreground">
                  Deletes your saved playback positions, quiz attempts and notes on the server. Enrollments and certificates are kept.
                </p>
              </div>
              <Button variant="destructive" onClick={() => setResetOpen(true)}>
                <Trash2 /> Reset progress
              </Button>
            </div>
          </Card>
        )}
      </div>
      <ConfirmDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title="Reset all learning progress?"
        description="This removes every lesson position, quiz attempt and note on your account. It cannot be undone."
        confirmLabel="Reset progress"
        destructive
        onConfirm={async () => {
          try {
            await learningService.resetMyProgress(user.id);
            toast.success("Progress reset. Open a course to start again.");
          } catch (e) {
            toast.error(e instanceof ApiError ? e.message : "Could not reset progress");
          } finally {
            setResetOpen(false);
          }
        }}
      />
    </div>
  );
}
