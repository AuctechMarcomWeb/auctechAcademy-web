"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/form-field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { contactService } from "@/services/contact.service";
import { ApiError } from "@/services/api-client";

const schema = z.object({
  name: z.string().min(2, "Enter your name"),
  email: z.string().email("Enter a valid email"),
  topic: z.enum(["courses", "internships", "certificates", "payments", "partnership", "other"]),
  message: z.string().min(20, "Please give us a little more detail (20+ characters)"),
});

export function ContactForm() {
  const [done, setDone] = useState(false);
  const { register, handleSubmit, setValue, watch, formState } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", topic: "courses", message: "" },
  });

  if (done) {
    return (
      <div className="rounded-xl border border-success/30 bg-success/5 p-8 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-success" />
        <h3 className="mt-3 font-semibold">Message sent</h3>
        <p className="mt-1 text-sm text-muted-foreground">Thanks for writing in. We reply within one working day.</p>
        <Button variant="outline" className="mt-4" onClick={() => setDone(false)}>
          Send another
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(async (values) => {
        try {
          await contactService.send(values);
          setDone(true);
        } catch (e) {
          toast.error(e instanceof ApiError ? e.message : "Could not send your message. Please try again.");
        }
      })}
      className="space-y-4"
      noValidate
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Name" htmlFor="name" error={formState.errors.name?.message} required>
          <Input id="name" {...register("name")} />
        </FormField>
        <FormField label="Email" htmlFor="email" error={formState.errors.email?.message} required>
          <Input id="email" type="email" {...register("email")} />
        </FormField>
      </div>
      <FormField label="Topic" htmlFor="topic" required>
        <Select value={watch("topic")} onValueChange={(v) => setValue("topic", v)}>
          <SelectTrigger id="topic">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[
              ["courses", "Courses"],
              ["internships", "Internships"],
              ["certificates", "Certificates & verification"],
              ["payments", "Payments & refunds"],
              ["partnership", "Partnerships"],
              ["other", "Something else"],
            ].map(([v, l]) => (
              <SelectItem key={v} value={v}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
      <FormField label="Message" htmlFor="message" error={formState.errors.message?.message} required>
        <Textarea id="message" rows={5} {...register("message")} />
      </FormField>
      <Button type="submit" loading={formState.isSubmitting}>
        Send message
      </Button>
    </form>
  );
}
