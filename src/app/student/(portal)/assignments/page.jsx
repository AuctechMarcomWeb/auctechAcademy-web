"use client";

import Link from "next/link";
import { CalendarClock, FileCheck2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { PageSkeleton } from "@/components/shared/loading";
import { StatusBadge } from "@/components/shared/status-badge";
import { useStudentCourses } from "@/components/student/use-student-courses";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useHydrated } from "@/hooks/use-hydrated";
import { computeLockStates } from "@/lib/curriculum";
import { formatDate } from "@/lib/format";
import { ROUTES } from "@/lib/constants";

export default function AssignmentsPage() {
  const hydrated = useHydrated();
  const user = useCurrentUser();
  const courses = useStudentCourses(user?.id);
  if (!hydrated || !user) return <PageSkeleton />;

  const rows = courses.flatMap((sc) => {
    const locks = computeLockStates(sc.ctx);
    return sc.ctx.assignments.map((a) => {
      const mod = sc.course.modules.find((m) => m.id === a.moduleId);
      const sub = sc.ctx.submissions.find((s) => s.assignmentId === a.id);
      return { sc, a, mod, sub, locked: locks.get(a.id) === "locked" };
    });
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assignments"
        description="Project work reviewed by instructors. Submitted work moves to Under Review, then Approved or Rejected."
      />
      {rows.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {rows.map(({ sc, a, mod, sub, locked }) => {
            const overdue = !sub && new Date(a.deadline) < new Date();
            return (
              <Card key={a.id} className="p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold leading-snug">{a.title}</h3>
                    <p className="text-xs text-muted-foreground truncate">
                      {sc.course.title} · {mod?.title}
                    </p>
                  </div>
                  <StatusBadge status={sub?.status ?? "pending"} />
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{a.instructions}</p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                  <span className={`inline-flex items-center gap-1 ${overdue ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                    <CalendarClock className="h-3.5 w-3.5" /> Due {formatDate(a.deadline)}
                    {overdue ? " · overdue" : ""}
                  </span>
                  {typeof sub?.marks === "number" && (
                    <span className="inline-flex items-center gap-1 font-medium">
                      {sub.marks}/{a.maxMarks} marks {sub.grade && <Badge variant="success">{sub.grade}</Badge>}
                    </span>
                  )}
                  {locked && <Badge variant="muted">Locked until earlier steps are complete</Badge>}
                </div>
                {sub?.feedback && (
                  <p className="rounded-md bg-muted p-3 text-xs">
                    <span className="font-semibold">Feedback:</span> {sub.feedback}
                  </p>
                )}
                <div className="mt-auto pt-1">
                  <Button asChild size="sm" variant={sub ? "outline" : "default"} disabled={locked}>
                    <Link href={`${ROUTES.student.learn(sc.course.id)}?item=${a.id}`}>
                      {sub ? (
                        <>
                          <FileCheck2 /> View submission
                        </>
                      ) : (
                        <>
                          <Upload /> Open & submit
                        </>
                      )}
                    </Link>
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={FileCheck2}
          title="No assignments"
          description="Assignments appear once you enrol in a course that includes project work."
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
