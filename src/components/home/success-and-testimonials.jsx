"use client";

import { Quote } from "lucide-react";
import { Card } from "@/components/ui/card";
import { RatingStars } from "@/components/shared/rating-stars";
import { UserAvatar } from "@/components/shared/user-avatar";
import { SectionHeading } from "@/components/shared/page-header";
import { useDb } from "@/store/db.store";
import { testimonials } from "@/data/people";

const STATS = [
  { value: "94%", label: "Course completion rate among active learners" },
  { value: "4.7/5", label: "Average course rating" },
  { value: "3 in 5", label: "Interns receive a job referral from their mentor" },
  { value: "48 hrs", label: "Average assignment feedback turnaround" },
];

export function StudentSuccess() {
  const certs = useDb((s) => s.certificatesIssued);
  return (
    <section className="bg-primary text-white">
      <div className="container-x py-14 lg:py-20">
        <div className="max-w-2xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Student success, measured</h2>
          <p className="mt-2 text-slate-300">We track outcomes, not vanity metrics. Here is what learners achieve on the platform.</p>
        </div>
        <div className="mt-10 grid gap-6 grid-cols-2 lg:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="border-l-2 border-accent pl-4">
              <p className="text-3xl font-bold text-white">{s.value}</p>
              <p className="mt-1 text-sm text-slate-300">{s.label}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 text-xs text-slate-400">{certs.toLocaleString("en-IN")} certificates currently valid in the verification registry.</p>
      </div>
    </section>
  );
}

export function Testimonials() {
  return (
    <section className="container-x py-14 lg:py-20">
      <SectionHeading title="What learners say" description="From people who completed a course, an internship, or both." />
      <div className="grid gap-5 md:grid-cols-2">
        {testimonials.map((t) => (
          <Card key={t.id} className="p-6 flex flex-col">
            <Quote className="h-6 w-6 text-accent" />
            <p className="mt-3 text-sm leading-relaxed text-foreground/90 flex-1">&ldquo;{t.quote}&rdquo;</p>
            <div className="mt-5 flex items-center gap-3">
              <UserAvatar name={t.name} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{t.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {t.role}
                  {t.company && ` · ${t.company}`}
                </p>
              </div>
              <RatingStars rating={t.rating} size="xs" showValue={false} />
            </div>
            <p className="mt-3 text-xs text-secondary font-medium">{t.courseTitle}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}
