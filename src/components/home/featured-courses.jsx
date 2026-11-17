"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CourseCard } from "@/components/course/course-card";
import { SectionHeading } from "@/components/shared/page-header";
import { useShallow } from "zustand/react/shallow";
import { useDb } from "@/store/db.store";
import { ROUTES } from "@/lib/constants";
import { CardGridSkeleton } from "@/components/shared/loading";

export function FeaturedCourses() {
  const featured = useDb(useShallow((s) => s.courses.filter((c) => c.status === "published" && c.isFeatured).slice(0, 4)));
  const ready = useDb((s) => s.hydrated);
  return (
    <section className="bg-white border-y border-border">
      <div className="container-x py-14 lg:py-20">
        <SectionHeading
          title="Featured courses"
          description="Our most-enrolled programmes, each ending in a graded final assessment."
          action={
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link href={ROUTES.explore}>
                View all <ArrowRight />
              </Link>
            </Button>
          }
        />
        {!ready ? (
          <CardGridSkeleton count={4} />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((c) => (
              <CourseCard key={c.id} course={c} />
            ))}
          </div>
        )}
        <Button asChild variant="outline" className="mt-6 w-full sm:hidden">
          <Link href={ROUTES.explore}>View all courses</Link>
        </Button>
      </div>
    </section>
  );
}
