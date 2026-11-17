"use client";

import * as React from "react";
import Link from "next/link";
import { Award, CheckCircle2, Clock, ExternalLink, FileCheck2, Layers, PlayCircle, Target } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DemoTag } from "@/components/shared/demo-banner";
import { QuizScoresChart } from "@/components/charts/quiz-scores-chart";
import { bestAttempt } from "@/lib/curriculum";
import { learningService } from "@/services/learning.service";
import { ApiError } from "@/services/api-client";
import { useDb } from "@/store/db.store";
import { formatDate, formatDuration } from "@/lib/format";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

function Stat({ icon: Icon, label, value, tone }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Icon className={cn("h-3.5 w-3.5", tone)} /> {label}
      </p>
      <p className="mt-1 text-lg font-bold text-primary leading-tight">{value}</p>
    </div>
  );
}

export function CompletionReportBody({ userId, studentName, course, ctx, summary }) {
  const certificate = useDb((s) => s.certificates.find((c) => c.userId === userId && c.courseId === course.id && c.status === "valid"));
  const completedAt = ctx.progress?.completedAt ?? certificate?.completedAt;
  const [issuing, setIssuing] = React.useState(false);

  const quizPoints = ctx.quizzes
    .map((q) => ({
      label: q.title.replace(/ Quiz$/, "").slice(0, 18),
      score: bestAttempt(q.id, ctx.attempts)?.scorePercent ?? 0,
      passing: q.passingScore,
    }))
    .filter((p) => p.score > 0 || summary.attemptedQuizzes > 0);

  const issue = async () => {
    setIssuing(true);
    try {
      const { certificate: cert } = await learningService.completeCourse(userId, course, ctx);
      toast.success(`Certificate ${cert.id} issued`);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not issue the certificate");
    } finally {
      setIssuing(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-secondary">Course completion report</p>
          <h2 className="text-xl font-bold">{course.title}</h2>
          <p className="text-sm text-muted-foreground">{studentName}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge variant={summary.allRequirementsMet ? "success" : "warning"} className="text-sm">
            {summary.allRequirementsMet ? "All requirements met" : `${summary.percent}% complete`}
          </Badge>
          <DemoTag />
        </div>
      </div>

      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-muted-foreground">Overall progress</span>
          <span className="font-semibold">{summary.percent}%</span>
        </div>
        <Progress value={summary.percent} indicatorClassName={summary.allRequirementsMet ? "bg-success" : undefined} />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <Stat icon={Layers} label="Modules" value={`${summary.completedModules} / ${summary.totalModules}`} tone="text-secondary" />
        <Stat icon={PlayCircle} label="Lessons completed" value={`${summary.completedLessons} / ${summary.totalLessons}`} tone="text-secondary" />
        <Stat icon={Clock} label="Total video duration" value={formatDuration(summary.totalVideoSeconds)} tone="text-secondary" />
        <Stat icon={Clock} label="Tracked watch time" value={formatDuration(summary.watchedSeconds)} tone="text-accent" />
        <Stat icon={Target} label="Quizzes attempted" value={`${summary.attemptedQuizzes} / ${summary.totalQuizzes}`} tone="text-secondary" />
        <Stat icon={CheckCircle2} label="Quizzes passed" value={`${summary.passedQuizzes} / ${summary.totalQuizzes}`} tone="text-success" />
        <Stat icon={Target} label="Average quiz score" value={`${summary.averageQuizScore}%`} tone="text-secondary" />
        <Stat
          icon={FileCheck2}
          label="Assignments submitted"
          value={`${summary.submittedAssignments} / ${summary.totalAssignments}`}
          tone="text-secondary"
        />
        <Stat
          icon={Award}
          label="Final assessment"
          value={summary.finalAssessmentScore !== undefined ? `${summary.finalAssessmentScore}%` : "—"}
          tone="text-accent"
        />
        <Stat icon={CheckCircle2} label="Completion date" value={completedAt ? formatDate(completedAt) : "Pending"} tone="text-success" />
        <Stat
          icon={Award}
          label="Status"
          value={certificate ? "Certified" : summary.allRequirementsMet ? "Eligible" : "In progress"}
          tone="text-success"
        />
      </div>

      {quizPoints.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold mb-2">Best score per quiz</h3>
          <QuizScoresChart data={quizPoints} />
        </section>
      )}

      <section className="rounded-lg border border-border p-4 text-sm">
        <h3 className="font-semibold mb-2">Certificate</h3>
        {certificate ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p>
              Certificate <span className="font-mono font-medium">{certificate.id}</span> issued on {formatDate(certificate.issuedAt)}.
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href={ROUTES.student.certificates}>
                View certificate <ExternalLink />
              </Link>
            </Button>
          </div>
        ) : summary.allRequirementsMet ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p>Every mandatory requirement is satisfied. Issue your assessment-based certificate (demo).</p>
            <Button data-testid="issue-certificate" onClick={issue} loading={issuing} variant="accent">
              <Award /> Issue certificate
            </Button>
          </div>
        ) : (
          <p className="text-muted-foreground">
            A certificate becomes available only after every lesson is watched, every quiz is passed and every assignment is submitted.
          </p>
        )}
      </section>
    </div>
  );
}

export function CompletionReport(props) {
  const { open, onOpenChange, asDialog = true, ...rest } = props;
  if (!asDialog) return <CompletionReportBody {...rest} />;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="xl">
        <DialogHeader>
          <DialogTitle className="sr-only">Completion report</DialogTitle>
          <DialogDescription className="sr-only">Summary of your progress and certificate eligibility.</DialogDescription>
        </DialogHeader>
        <CompletionReportBody {...rest} />
      </DialogContent>
    </Dialog>
  );
}
