import { Suspense } from "react";
import { CourseMarketplace } from "@/components/course/course-marketplace";
import { PageHeader } from "@/components/shared/page-header";
import { CardGridSkeleton } from "@/components/shared/loading";

export const metadata = { title: "All Courses", description: "Every published Auctech Academy course in one place." };

export default function CoursesPage() {
  return (
    <div className="container-x py-8 lg:py-12">
      <PageHeader eyebrow="Catalogue" title="All Courses" description="Filter by category, level, price, duration and rating." className="mb-8" />
      <Suspense fallback={<CardGridSkeleton />}>
        <CourseMarketplace />
      </Suspense>
    </div>
  );
}
