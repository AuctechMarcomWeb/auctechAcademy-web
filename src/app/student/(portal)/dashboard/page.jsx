"use client";

import Link from "next/link";
import { Award, BookOpen, CheckCircle2, ClipboardList, Clock, FileCheck2, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StatCard } from "@/components/shared/stat-card";
import { SectionHeading } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { PageSkeleton } from "@/components/shared/loading";
import { StatusBadge } from "@/components/shared/status-badge";
import { CourseCard } from "@/components/course/course-card";
import { CourseProgressCard, resumeHref } from "@/components/student/course-progress-card";
import { ActivityFeed } from "@/components/student/activity-feed";
import { useStudentCourses } from "@/components/student/use-student-courses";
import { LearningProgressChart } from "@/components/charts/lazy";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useHydrated } from "@/hooks/use-hydrated";
import { useDb } from "@/store/db.store";
import { computeLockStates, flattenCurriculum } from "@/lib/curriculum";
import { formatDate, formatHours } from "@/lib/format";
import { ROUTES } from "@/lib/constants";

export default function StudentDashboardPage() {
  const hydrated = useHydrated();
  const user = useCurrentUser();
  const courses = useStudentCourses(user?.id);
  const certificates = useDb((s) => s.certificates);
  const activity = useDb((s) => s.activity);
  const allCourses = useDb((s) => s.courses);

  if (!hydrated || !user) return <PageSkeleton />;

  const myCerts = certificates.filter((c) => c.userId === user.id && c.status === "valid");
  const completed = courses.filter((c) => c.summary.allRequirementsMet);
  const active = courses.filter((c) => !c.summary.allRequirementsMet);
  const watched = courses.reduce((a, c) => a + c.summary.watchedSeconds, 0);
  const continueCourse = active[0] ?? courses[0];
  const events = activity.filter((a) => a.userId === user.id);

  const upcoming = courses
    .flatMap((sc) => {
      const items = flattenCurriculum(sc.course, sc.ctx.quizzes, sc.ctx.assignments);
      const locks = computeLockStates(sc.ctx);
      return items
        .filter((i) => i.kind !== "lesson" && locks.get(i.id) !== "completed")
        .slice(0, 2)
        .map((i) => ({ sc, item: i, state: locks.get(i.id) ?? "locked" }));
    })
    .slice(0, 5);

  const enrolledIds = new Set(courses.map((c) => c.course.id));
  const myCategories = new Set(courses.map((c) => c.course.categoryId));
  const recommended = allCourses
    .filter((c) => c.status === "published" && !enrolledIds.has(c.id))
    .sort((a, b) => Number(myCategories.has(b.categoryId)) - Number(myCategories.has(a.categoryId)) || b.enrolledCount - a.enrolledCount)
    .slice(0, 3);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Welcome back, {user.name.split(" ")[0]}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Here is where you left off and what is coming up next.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Enrolled Courses" value={courses.length} icon={BookOpen} tone="secondary" hint={`${active.length} in progress`} />
        <StatCard
          label="Completed Courses"
          value={completed.length}
          icon={CheckCircle2}
          tone="success"
          hint={courses.length ? `${Math.round((completed.length / courses.length) * 100)}% completion rate` : "No courses yet"}
        />
        <StatCard label="Learning Hours" value={formatHours(watched)} icon={Clock} tone="accent" hint="Tracked watch time" />
        <StatCard label="Certificates Earned" value={myCerts.length} icon={Award} tone="primary" hint="Verifiable certificates" />
      </div>

      {continueCourse ? (
        <section>
          <SectionHeading title="Continue learning" />
          <Card className="p-5 sm:p-6 flex flex-col gap-4 md:flex-row md:items-center">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-secondary">Pick up where you left off</p>
              <h3 className="mt-1 text-lg font-semibold">{continueCourse.course.title}</h3>
              <p className="text-sm text-muted-foreground">
                {continueCourse.summary.completedLessons} of {continueCourse.summary.totalLessons} lessons · {continueCourse.summary.passedQuizzes} of{" "}
                {continueCourse.summary.totalQuizzes} quizzes passed
              </p>
              <div className="mt-3 flex items-center gap-3">
                <Progress value={continueCourse.summary.percent} className="max-w-md" />
                <span className="text-sm font-semibold tabular-nums">{continueCourse.summary.percent}%</span>
              </div>
            </div>
            <Button asChild size="lg">
              <Link href={resumeHref(continueCourse)}>
                <PlayCircle /> Resume
              </Link>
            </Button>
          </Card>
        </section>
      ) : (
        <EmptyState
          icon={BookOpen}
          title="You have not enrolled in any course yet"
          description="Browse the catalogue and start learning today."
          action={
            <Button asChild>
              <Link href={ROUTES.explore}>Explore courses</Link>
            </Button>
          }
        />
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2 space-y-4">
          <SectionHeading
            title="My active courses"
            action={
              <Button asChild variant="link" size="sm">
                <Link href={ROUTES.student.myCourses}>View all</Link>
              </Button>
            }
          />
          {active.length ? (
            active.slice(0, 3).map((sc) => <CourseProgressCard key={sc.enrollment.id} sc={sc} />)
          ) : (
            <EmptyState compact title="No active courses" description="Everything you enrolled in is complete. Time for the next one?" />
          )}
        </section>
        <section>
          <SectionHeading title="Recent activity" />
          <Card className="p-5">
            <ActivityFeed events={events} />
          </Card>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <SectionHeading title="Learning progress" description="Completion per enrolled course" />
          <Card className="p-4">
            {courses.length ? (
              <LearningProgressChart
                data={courses.map((c) => ({
                  label: c.course.title.length > 24 ? `${c.course.title.slice(0, 22)}…` : c.course.title,
                  percent: c.summary.percent,
                }))}
              />
            ) : (
              <EmptyState compact title="No data yet" />
            )}
          </Card>
        </section>
        <section>
          <SectionHeading title="Upcoming assessments" />
          <Card className="divide-y divide-border">
            {upcoming.length ? (
              upcoming.map(({ sc, item, state }) => (
                <Link
                  key={item.id}
                  href={`${ROUTES.student.learn(sc.course.id)}?item=${item.id}`}
                  className="flex items-center gap-3 p-4 hover:bg-muted/50"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                    {item.kind === "quiz" ? <ClipboardList className="h-4 w-4" /> : <FileCheck2 className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {item.kind === "quiz" ? item.quiz.title : item.kind === "assignment" ? item.assignment.title : item.lesson.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {sc.course.title}
                      {item.kind === "assignment" ? ` · due ${formatDate(item.assignment.deadline)}` : ""}
                    </p>
                  </div>
                  <StatusBadge status={state} />
                </Link>
              ))
            ) : (
              <div className="p-4">
                <EmptyState compact title="No pending assessments" />
              </div>
            )}
          </Card>
        </section>
      </div>

      {recommended.length > 0 && (
        <section>
          <SectionHeading
            title="Recommended for you"
            description="Based on the categories you are learning"
            action={
              <Button asChild variant="link" size="sm">
                <Link href={ROUTES.explore}>Browse all</Link>
              </Button>
            }
          />
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {recommended.map((c) => (
              <CourseCard key={c.id} course={c} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
