"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Mail, MapPin, Phone, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/form-field";
import { PageHeader } from "@/components/shared/page-header";
import { PageSkeleton } from "@/components/shared/loading";
import { UserAvatar } from "@/components/shared/user-avatar";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useHydrated } from "@/hooks/use-hydrated";
import { authService } from "@/services/auth.service";
import { formatDate } from "@/lib/format";

const schema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(80),
  phone: z
    .string()
    .trim()
    .regex(/^[+\d][\d\s-]{7,16}$/, "Enter a valid phone number")
    .or(z.literal("")),
  headline: z.string().trim().max(80, "Keep it under 80 characters").optional(),
  bio: z.string().trim().max(500, "Keep it under 500 characters").optional(),
  location: z.string().trim().max(80).optional(),
});

function ProfileForm({ user }) {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: user.name, phone: user.phone ?? "", headline: user.headline ?? "", bio: user.bio ?? "", location: user.location ?? "" },
  });
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    reset,
  } = form;

  const onSubmit = async (v) => {
    const updated = await authService.updateProfile(user.id, {
      name: v.name,
      phone: v.phone || undefined,
      headline: v.headline || undefined,
      bio: v.bio || undefined,
      location: v.location || undefined,
    });
    reset({
      name: updated.name,
      phone: updated.phone ?? "",
      headline: updated.headline ?? "",
      bio: updated.bio ?? "",
      location: updated.location ?? "",
    });
    toast.success("Profile updated");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
      <FormField label="Full name" htmlFor="name" required error={errors.name?.message}>
        <Input id="name" {...register("name")} aria-invalid={Boolean(errors.name)} />
      </FormField>
      <FormField label="Phone" htmlFor="phone" error={errors.phone?.message}>
        <Input id="phone" {...register("phone")} placeholder="+91 98765 43210" aria-invalid={Boolean(errors.phone)} />
      </FormField>
      <FormField
        label="Headline"
        htmlFor="headline"
        error={errors.headline?.message}
        hint="Shown on your certificates page and internship applications."
      >
        <Input id="headline" {...register("headline")} placeholder="Aspiring Full-Stack Developer" />
      </FormField>
      <FormField label="Location" htmlFor="location" error={errors.location?.message}>
        <Input id="location" {...register("location")} placeholder="City, State" />
      </FormField>
      <FormField label="Bio" htmlFor="bio" error={errors.bio?.message} className="sm:col-span-2">
        <Textarea id="bio" {...register("bio")} rows={4} />
      </FormField>
      <div className="sm:col-span-2 flex justify-end">
        <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
          <Save /> Save changes
        </Button>
      </div>
    </form>
  );
}

export default function ProfilePage() {
  const hydrated = useHydrated();
  const user = useCurrentUser();
  if (!hydrated || !user) return <PageSkeleton />;
  return (
    <div className="space-y-6">
      <PageHeader title="My Profile" description="Your name appears on certificates exactly as entered here." />
      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="p-6 flex flex-col items-center text-center">
          <UserAvatar name={user.name} src={user.avatarUrl} className="h-24 w-24 text-2xl" />
          <h2 className="mt-4 text-lg font-semibold">{user.name}</h2>
          {user.headline && <p className="text-sm text-muted-foreground">{user.headline}</p>}
          <ul className="mt-4 w-full space-y-2 text-sm text-left">
            <li className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4" /> <span className="truncate">{user.email}</span>
            </li>
            {user.phone && (
              <li className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" /> {user.phone}
              </li>
            )}
            {user.location && (
              <li className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" /> {user.location}
              </li>
            )}
          </ul>
          <p className="mt-4 text-xs text-muted-foreground">Member since {formatDate(user.joinedAt)}</p>
        </Card>
        <Card className="p-6">
          <h2 className="font-semibold mb-4">Edit details</h2>
          <ProfileForm key={user.id} user={user} />
        </Card>
      </div>
    </div>
  );
}
