import { Suspense } from "react";
import { CourseMarketplace } from "@/components/course/course-marketplace";
import { PageHeader } from "@/components/shared/page-header";
import { CardGridSkeleton } from "@/components/shared/loading";

export const metadata = {
  title: "Explore Courses",
  description: "Browse job-ready courses in web development, programming, digital marketing, SEO, design, AI and business.",
};

export default function ExplorePage() {
  return (
    <div className="container-x py-8 lg:py-12">
      <PageHeader
        eyebrow="Course marketplace"
        title="Explore Courses"
        description="Structured, assessment-based courses with practical projects and verifiable certificates."
        className="mb-8"
      />
      <Suspense fallback={<CardGridSkeleton />}>
        <CourseMarketplace />
      </Suspense>
    </div>
  );
}
