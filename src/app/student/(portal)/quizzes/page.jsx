"use client";

import Link from "next/link";
import { ClipboardList, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader, SectionHeading } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { PageSkeleton } from "@/components/shared/loading";
import { StatusBadge } from "@/components/shared/status-badge";
import { useStudentCourses } from "@/components/student/use-student-courses";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useHydrated } from "@/hooks/use-hydrated";
import { attemptsUsed, bestAttempt, computeLockStates } from "@/lib/curriculum";
import { formatDateTime, formatDuration } from "@/lib/format";
import { ROUTES } from "@/lib/constants";

export default function QuizzesPage() {
  const hydrated = useHydrated();
  const user = useCurrentUser();
  const courses = useStudentCourses(user?.id);
  if (!hydrated || !user) return <PageSkeleton />;

  const rows = courses.flatMap((sc) => {
    const locks = computeLockStates(sc.ctx);
    return sc.ctx.quizzes.map((q) => {
      const best = bestAttempt(q.id, sc.ctx.attempts);
      const lock = locks.get(q.id) ?? "locked";
      const status = best?.passed ? "passed" : best ? "failed" : lock;
      return { sc, q, best, used: attemptsUsed(q.id, sc.ctx.attempts), status, locked: lock === "locked" };
    });
  });
  const history = courses
    .flatMap((sc) => sc.ctx.attempts.map((a) => ({ a, sc, quiz: sc.ctx.quizzes.find((q) => q.id === a.quizId) })))
    .sort((x, y) => y.a.submittedAt.localeCompare(x.a.submittedAt));

  if (!rows.length)
    return (
      <div className="space-y-6">
        <PageHeader title="Quizzes" />
        <EmptyState
          icon={ClipboardList}
          title="No quizzes yet"
          description="Quizzes appear once you enrol in a course."
          action={
            <Button asChild>
              <Link href={ROUTES.explore}>Explore courses</Link>
            </Button>
          }
        />
      </div>
    );

  return (
    <div className="space-y-8">
      <PageHeader title="Quizzes" description="Every module quiz and final assessment across your courses." />
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Quiz</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Pass mark</TableHead>
              <TableHead>Best score</TableHead>
              <TableHead>Attempts</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(({ sc, q, best, used, status, locked }) => (
              <TableRow key={q.id}>
                <TableCell className="font-medium">{q.title}</TableCell>
                <TableCell className="text-muted-foreground max-w-[220px] truncate">{sc.course.title}</TableCell>
                <TableCell>{q.passingScore}%</TableCell>
                <TableCell className="tabular-nums">{best ? `${best.scorePercent}%` : "—"}</TableCell>
                <TableCell>
                  {used}
                  {q.maxAttempts ? ` / ${q.maxAttempts}` : ""}
                </TableCell>
                <TableCell>
                  <StatusBadge status={status === "passed" ? "approved" : status === "failed" ? "failed" : status} />
                </TableCell>
                <TableCell className="text-right">
                  <Button asChild size="sm" variant={locked ? "ghost" : "outline"} disabled={locked}>
                    <Link href={`${ROUTES.student.learn(sc.course.id)}?item=${q.id}`} aria-disabled={locked}>
                      <PlayCircle /> {best?.passed ? "Review" : locked ? "Locked" : used ? "Retake" : "Start"}
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <section>
        <SectionHeading title="Attempt history" />
        {history.length ? (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Quiz</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Correct</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Result</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map(({ a, quiz }) => (
                  <TableRow key={a.id}>
                    <TableCell className="whitespace-nowrap">{formatDateTime(a.submittedAt)}</TableCell>
                    <TableCell>{quiz?.title ?? a.quizId}</TableCell>
                    <TableCell className="tabular-nums font-medium">{a.scorePercent}%</TableCell>
                    <TableCell>
                      {a.correct}/{a.total}
                    </TableCell>
                    <TableCell>{formatDuration(a.timeTakenSeconds)}</TableCell>
                    <TableCell>
                      <StatusBadge status={a.passed ? "approved" : "failed"} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        ) : (
          <EmptyState compact title="No attempts yet" />
        )}
      </section>
    </div>
  );
}
