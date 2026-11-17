"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/form-field";
import { FileDropzone } from "@/components/shared/file-dropzone";
import { internshipService } from "@/services/internship.service";
import { ApiError } from "@/services/api-client";
import { ROUTES } from "@/lib/constants";

const schema = z.object({
  fullName: z.string().min(2, "Enter your full name"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().regex(/^\+?[0-9\s-]{10,15}$/, "Enter a valid phone number"),
  college: z.string().min(2, "Enter your college or university"),
  graduationYear: z.string().regex(/^20\d{2}$/, "Enter a 4-digit year"),
  portfolioUrl: z.string().url("Enter a valid URL").optional().or(z.literal("")),
  coverLetter: z.string().min(80, "Tell us a little more (at least 80 characters)").max(1500, "Keep it under 1,500 characters"),
});

export function InternshipApplicationForm({ internship, user, onDone }) {
  const router = useRouter();
  const [resume, setResume] = useState(null);
  const [resumeError, setResumeError] = useState();
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const { register, handleSubmit, formState } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: user.name,
      email: user.email,
      phone: user.phone ?? "",
      college: "",
      graduationYear: "",
      portfolioUrl: "",
      coverLetter: "",
    },
  });

  const onSubmit = async (values) => {
    if (!resume) {
      setResumeError("Please attach your resume (PDF).");
      return;
    }
    setResumeError(undefined);
    setError(null);
    try {
      await internshipService.apply(
        user.id,
        internship.id,
        { ...values, portfolioUrl: values.portfolioUrl || undefined, resumeFileName: resume.name },
        resume,
      );
      setSuccess(true);
      toast.success("Application submitted");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not submit your application.");
    }
  };

  if (success) {
    return (
      <div className="text-center py-4">
        <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
        <h3 className="mt-3 text-lg font-semibold">Application received</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          We&apos;ll review it and update the status on your internship dashboard. Shortlisted candidates are contacted within 7 working days.
        </p>
        <div className="mt-5 flex flex-col sm:flex-row gap-2 justify-center">
          <Button onClick={() => router.push(ROUTES.student.internships)}>Track application</Button>
          <Button variant="outline" onClick={onDone}>
            Close
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" /> {error}
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Full name" htmlFor="fullName" error={formState.errors.fullName?.message} required>
          <Input id="fullName" {...register("fullName")} />
        </FormField>
        <FormField label="Email" htmlFor="email" error={formState.errors.email?.message} required>
          <Input id="email" type="email" {...register("email")} />
        </FormField>
        <FormField label="Phone" htmlFor="phone" error={formState.errors.phone?.message} required>
          <Input id="phone" type="tel" placeholder="+91 98765 43210" {...register("phone")} />
        </FormField>
        <FormField label="Graduation year" htmlFor="graduationYear" error={formState.errors.graduationYear?.message} required>
          <Input id="graduationYear" inputMode="numeric" placeholder="2027" {...register("graduationYear")} />
        </FormField>
        <FormField label="College / University" htmlFor="college" error={formState.errors.college?.message} required className="sm:col-span-2">
          <Input id="college" {...register("college")} />
        </FormField>
        <FormField label="Portfolio or GitHub URL" htmlFor="portfolioUrl" error={formState.errors.portfolioUrl?.message} className="sm:col-span-2">
          <Input id="portfolioUrl" placeholder="https://github.com/you" {...register("portfolioUrl")} />
        </FormField>
      </div>
      <FormField label="Resume" required error={resumeError}>
        <FileDropzone value={resume} onChange={setResume} accept=".pdf" maxSizeMb={5} hint="PDF · up to 5 MB" id="resume" />
      </FormField>
      <FormField
        label="Why do you want this internship?"
        htmlFor="coverLetter"
        error={formState.errors.coverLetter?.message}
        required
        hint="Mention relevant courses, projects and your availability."
      >
        <Textarea id="coverLetter" rows={5} {...register("coverLetter")} />
      </FormField>
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
        {onDone && (
          <Button type="button" variant="outline" onClick={onDone}>
            Cancel
          </Button>
        )}
        <Button type="submit" loading={formState.isSubmitting}>
          Submit application
        </Button>
      </div>
    </form>
  );
}
