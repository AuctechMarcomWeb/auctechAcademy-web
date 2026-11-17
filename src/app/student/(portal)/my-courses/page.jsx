"use client";

import Link from "next/link";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { PageSkeleton } from "@/components/shared/loading";
import { CourseProgressCard } from "@/components/student/course-progress-card";
import { useStudentCourses } from "@/components/student/use-student-courses";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useHydrated } from "@/hooks/use-hydrated";
import { ROUTES } from "@/lib/constants";

function List({ items, emptyTitle }) {
  if (!items.length) {
    return (
      <EmptyState
        icon={BookOpen}
        title={emptyTitle}
        description="Find your next course in the catalogue."
        action={
          <Button asChild>
            <Link href={ROUTES.explore}>Explore courses</Link>
          </Button>
        }
      />
    );
  }
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {items.map((sc) => (
        <CourseProgressCard key={sc.enrollment.id} sc={sc} />
      ))}
    </div>
  );
}

export default function MyCoursesPage() {
  const hydrated = useHydrated();
  const user = useCurrentUser();
  const courses = useStudentCourses(user?.id);
  if (!hydrated || !user) return <PageSkeleton />;
  const inProgress = courses.filter((c) => !c.summary.allRequirementsMet);
  const completed = courses.filter((c) => c.summary.allRequirementsMet);
  return (
    <div className="space-y-6">
      <PageHeader
        title="My Courses"
        description="Every course you are enrolled in, with live progress."
        actions={
          <Button asChild variant="outline">
            <Link href={ROUTES.explore}>Browse more courses</Link>
          </Button>
        }
      />
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Courses ({courses.length})</TabsTrigger>
          <TabsTrigger value="progress">In Progress ({inProgress.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completed.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <List items={courses} emptyTitle="You have not enrolled in any course yet" />
        </TabsContent>
        <TabsContent value="progress">
          <List items={inProgress} emptyTitle="No courses in progress" />
        </TabsContent>
        <TabsContent value="completed">
          <List items={completed} emptyTitle="No completed courses yet" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
