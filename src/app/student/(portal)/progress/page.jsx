"use client";

import * as React from "react";
import Link from "next/link";
import { BarChart3, CheckCircle2, Circle, FileText, Lock, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { PageSkeleton } from "@/components/shared/loading";
import { StatCard } from "@/components/shared/stat-card";
import { CompletionReport } from "@/components/learn/completion-report";
import { useStudentCourses } from "@/components/student/use-student-courses";
import { WeeklyActivityChart } from "@/components/charts/lazy";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useHydrated } from "@/hooks/use-hydrated";
import { bestAttempt, computeLockStates, flattenCurriculum } from "@/lib/curriculum";
import { formatDuration, formatHours } from "@/lib/format";
import { ROUTES } from "@/lib/constants";

function weeklyActivity(courses) {
  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return { key: d.toDateString(), label: d.toLocaleDateString("en-IN", { weekday: "short" }), minutes: 0 };
  });
  for (const sc of courses) {
    for (const lp of Object.values(sc.ctx.progress?.lessons ?? {})) {
      const day = days.find((x) => x.key === new Date(lp.updatedAt).toDateString());
      if (day) day.minutes += Math.round(lp.watchedSeconds / 60);
    }
  }
  return days;
}

function CourseProgressDetail({ sc, userName }) {
  const { course, ctx, summary } = sc;
  const [reportOpen, setReportOpen] = React.useState(false);
  const items = flattenCurriculum(course, ctx.quizzes, ctx.assignments);
  const locks = computeLockStates(ctx);
  return (
    <Card className="overflow-hidden">
      <div className="p-5 border-b border-border flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold">{course.title}</h3>
          <p className="text-xs text-muted-foreground">
            {summary.completedModules}/{summary.totalModules} modules · {summary.completedLessons}/{summary.totalLessons} lessons ·{" "}
            {formatDuration(summary.watchedSeconds)} watched · avg quiz {summary.averageQuizScore}%
          </p>
          <div className="mt-2 flex items-center gap-3 max-w-md">
            <Progress value={summary.percent} indicatorClassName={summary.allRequirementsMet ? "bg-success" : undefined} />
            <span className="text-sm font-semibold tabular-nums">{summary.percent}%</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setReportOpen(true)}>
            <FileText /> {summary.allRequirementsMet ? "Completion report" : "Progress report"}
          </Button>
          <Button asChild size="sm">
            <Link href={ROUTES.student.learn(course.id)}>
              <PlayCircle /> Open
            </Link>
          </Button>
        </div>
      </div>
      <Accordion type="multiple" className="px-5">
        {course.modules.map((m) => {
          const mItems = items.filter((i) => i.moduleId === m.id);
          const done = mItems.filter((i) => locks.get(i.id) === "completed").length;
          return (
            <AccordionItem key={m.id} value={m.id}>
              <AccordionTrigger>
                <span className="flex-1 text-left">
                  Module {m.order}: {m.title}
                </span>
                <Badge variant={done === mItems.length ? "success" : "muted"} className="mr-2">
                  {done}/{mItems.length}
                </Badge>
              </AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-1.5">
                  {mItems.map((i) => {
                    const state = locks.get(i.id);
                    const label = i.kind === "lesson" ? i.lesson.title : i.kind === "quiz" ? i.quiz.title : i.assignment.title;
                    const lp = i.kind === "lesson" ? ctx.progress?.lessons[i.lesson.id] : undefined;
                    const best = i.kind === "quiz" ? bestAttempt(i.quiz.id, ctx.attempts) : undefined;
                    return (
                      <li key={i.id} className="flex items-center gap-2 text-sm">
                        {state === "completed" ? (
                          <CheckCircle2 className="h-4 w-4 text-success" />
                        ) : state === "locked" ? (
                          <Lock className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Circle className="h-4 w-4 text-secondary" />
                        )}
                        <Link href={`${ROUTES.student.learn(course.id)}?item=${i.id}`} className="flex-1 truncate hover:text-secondary">
                          {label}
                        </Link>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {i.kind === "lesson" && lp ? `${formatDuration(lp.watchedSeconds)} watched` : ""}
                          {best ? `best ${best.scorePercent}%` : ""}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
      <CompletionReport
        open={reportOpen}
        onOpenChange={setReportOpen}
        userId={sc.enrollment.userId}
        studentName={userName}
        course={course}
        ctx={ctx}
        summary={summary}
      />
    </Card>
  );
}

export default function ProgressPage() {
  const hydrated = useHydrated();
  const user = useCurrentUser();
  const courses = useStudentCourses(user?.id);
  if (!hydrated || !user) return <PageSkeleton />;
  const watched = courses.reduce((a, c) => a + c.summary.watchedSeconds, 0);
  const quizzes = courses.reduce((a, c) => a + c.summary.passedQuizzes, 0);
  const totalQuizzes = courses.reduce((a, c) => a + c.summary.totalQuizzes, 0);
  const avg = courses.length ? Math.round(courses.reduce((a, c) => a + c.summary.percent, 0) / courses.length) : 0;
  return (
    <div className="space-y-6">
      <PageHeader title="Progress" description="Module-by-module breakdown of every course, with watch time and quiz scores." />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Average completion" value={`${avg}%`} icon={BarChart3} />
        <StatCard label="Watch time" value={formatHours(watched)} icon={PlayCircle} tone="accent" />
        <StatCard label="Quizzes passed" value={`${quizzes} / ${totalQuizzes}`} icon={CheckCircle2} tone="success" />
      </div>
      <Card className="p-4">
        <p className="text-sm font-semibold mb-2">Last 7 days</p>
        <WeeklyActivityChart data={weeklyActivity(courses)} />
      </Card>
      {courses.length ? (
        courses.map((sc) => <CourseProgressDetail key={sc.enrollment.id} sc={sc} userName={user.name} />)
      ) : (
        <EmptyState
          title="No progress yet"
          description="Enrol in a course to start tracking your progress."
          action={
            <Button asChild>
              <Link href={ROUTES.explore}>Explore courses</Link>
            </Button>
          }
        />
      )}
    </div>
  );
}
