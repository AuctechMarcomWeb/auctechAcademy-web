"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InternshipCard } from "@/components/internship/internship-card";
import { SectionHeading } from "@/components/shared/page-header";
import { useShallow } from "zustand/react/shallow";
import { useDb } from "@/store/db.store";
import { ROUTES } from "@/lib/constants";
import { CardGridSkeleton } from "@/components/shared/loading";

export function InternshipPrograms() {
  const internships = useDb(useShallow((s) => s.internships.filter((i) => i.status === "open").slice(0, 3)));
  const ready = useDb((s) => s.hydrated);
  return (
    <section className="container-x py-14 lg:py-20">
      <SectionHeading
        title="Internship programmes"
        description="Apply what you learn on real projects with a mentor, and earn an internship certificate."
        action={
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link href={ROUTES.internships}>
              All internships <ArrowRight />
            </Link>
          </Button>
        }
      />
      {!ready ? (
        <CardGridSkeleton count={3} />
      ) : (
        <div className="grid gap-5 md:grid-cols-3">
          {internships.map((i) => (
            <InternshipCard key={i.id} internship={i} />
          ))}
        </div>
      )}
    </section>
  );
}
