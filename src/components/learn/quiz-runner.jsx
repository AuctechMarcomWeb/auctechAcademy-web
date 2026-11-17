"use client";

import * as React from "react";
import { AlertTriangle, ChevronLeft, ChevronRight, ClipboardList, Timer, Trophy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { learningService } from "@/services/learning.service";
import { ApiError } from "@/services/api-client";
import { attemptsUsed, bestAttempt, canRetake as canRetakeQuiz } from "@/lib/curriculum";
import { formatClock } from "@/lib/format";
import { cn } from "@/lib/utils";
import { QuizResult } from "./quiz-result";

export function QuizRunner({ userId, quiz, attempts, locked, hasNext, onContinue }) {
  const best = bestAttempt(quiz.id, attempts);
  const used = attemptsUsed(quiz.id, attempts);
  const passed = Boolean(best?.passed);
  const retakeAllowed = canRetakeQuiz(quiz, attempts);

  const [phase, setPhase] = React.useState(best ? "result" : "intro");
  const [index, setIndex] = React.useState(0);
  const [answers, setAnswers] = React.useState({});
  const [startedAt, setStartedAt] = React.useState("");
  const [remaining, setRemaining] = React.useState();
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [result, setResult] = React.useState(best);

  const start = () => {
    setAnswers({});
    setIndex(0);
    setStartedAt(new Date().toISOString());
    setRemaining(quiz.timeLimitSeconds);
    setPhase("running");
  };

  const submit = React.useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    setConfirmOpen(false);
    try {
      const attempt = await learningService.submitQuiz({ userId, quiz, answers, startedAt });
      setResult(attempt);
      setPhase("result");
      toast[attempt.passed ? "success" : "error"](
        attempt.passed ? `Passed with ${attempt.scorePercent}%` : `Scored ${attempt.scorePercent}% — not quite there yet`,
      );
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not submit the quiz");
    } finally {
      setSubmitting(false);
    }
  }, [submitting, userId, quiz, answers, startedAt]);

  // Countdown timer with auto-submit.
  React.useEffect(() => {
    if (phase !== "running" || remaining === undefined) return;
    const t = setTimeout(
      () => {
        if (remaining <= 0) {
          toast.warning("Time is up — submitting your answers");
          void submit();
        } else {
          setRemaining((r) => (r ?? 1) - 1);
        }
      },
      remaining <= 0 ? 0 : 1000,
    );
    return () => clearTimeout(t);
  }, [phase, remaining, submit]);

  const answered = quiz.questions.filter((q) => answers[q.id]).length;
  const unanswered = quiz.questions.length - answered;

  if (locked) return null;

  if (phase === "result" && result) {
    return <QuizResult quiz={quiz} attempt={result} canRetake={retakeAllowed} hasNext={hasNext} onRetake={start} onContinue={onContinue} />;
  }

  if (phase === "intro") {
    return (
      <Card className="p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
            <ClipboardList className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold">{quiz.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{quiz.description}</p>
          </div>
        </div>
        <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 text-sm">
          <div className="rounded-lg border border-border p-3">
            <dt className="text-xs text-muted-foreground">Questions</dt>
            <dd className="font-semibold">{quiz.questions.length}</dd>
          </div>
          <div className="rounded-lg border border-border p-3">
            <dt className="text-xs text-muted-foreground">Passing score</dt>
            <dd className="font-semibold">{quiz.passingScore}%</dd>
          </div>
          <div className="rounded-lg border border-border p-3">
            <dt className="text-xs text-muted-foreground">Time limit</dt>
            <dd className="font-semibold">{quiz.timeLimitSeconds ? formatClock(quiz.timeLimitSeconds) : "None"}</dd>
          </div>
          <div className="rounded-lg border border-border p-3">
            <dt className="text-xs text-muted-foreground">Attempts</dt>
            <dd className="font-semibold">
              {used}
              {quiz.maxAttempts ? ` / ${quiz.maxAttempts}` : " used · unlimited"}
            </dd>
          </div>
        </dl>
        {best && (
          <p className="mt-4 inline-flex items-center gap-2 text-sm">
            <Trophy className="h-4 w-4 text-accent" /> Best score so far: <strong>{best.scorePercent}%</strong>
            <Badge variant={best.passed ? "success" : "destructive"}>{best.passed ? "Passed" : "Not passed"}</Badge>
          </p>
        )}
        <ul className="mt-5 space-y-1 text-sm text-muted-foreground list-disc pl-5">
          <li>Each question has exactly one correct answer.</li>
          <li>You can move between questions before submitting.</li>
          {quiz.timeLimitSeconds && <li>The quiz auto-submits when the timer reaches zero.</li>}
          <li>Passing this quiz unlocks the next lesson.</li>
        </ul>
        <div className="mt-6">
          <Button data-testid="quiz-start" size="lg" onClick={start} disabled={passed || !retakeAllowed}>
            {used > 0 ? "Retake Quiz" : "Start Quiz"}
          </Button>
        </div>
      </Card>
    );
  }

  const q = quiz.questions[index];
  const urgent = remaining !== undefined && remaining <= 60;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-secondary">{quiz.title}</p>
          <p className="text-sm text-muted-foreground">
            Question {index + 1} of {quiz.questions.length} · {answered} answered
          </p>
        </div>
        {remaining !== undefined && (
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold tabular-nums",
              urgent ? "border-destructive text-destructive bg-destructive/5" : "border-border",
            )}
            aria-live="polite"
          >
            <Timer className="h-4 w-4" /> {formatClock(remaining)}
          </span>
        )}
      </div>
      <Progress value={((index + 1) / quiz.questions.length) * 100} className="h-1.5" />

      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Questions">
        {quiz.questions.map((qq, i) => (
          <button
            key={qq.id}
            role="tab"
            aria-selected={i === index}
            aria-label={`Question ${i + 1}${answers[qq.id] ? ", answered" : ""}`}
            onClick={() => setIndex(i)}
            className={cn(
              "h-8 w-8 rounded-md border text-xs font-semibold transition-colors cursor-pointer",
              i === index
                ? "border-secondary bg-secondary text-white"
                : answers[qq.id]
                  ? "border-success/40 bg-success/10 text-success"
                  : "border-border bg-card text-muted-foreground hover:bg-muted",
            )}
          >
            {i + 1}
          </button>
        ))}
      </div>

      <Card className="p-5 sm:p-6">
        <p className="text-base font-medium leading-relaxed">{q.prompt}</p>
        <RadioGroup value={answers[q.id] ?? ""} onValueChange={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))} className="mt-4 gap-2">
          {q.options.map((o) => (
            <Label
              key={o.id}
              htmlFor={o.id}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm font-normal transition-colors hover:bg-muted",
                answers[q.id] === o.id ? "border-secondary bg-secondary/5" : "border-border",
              )}
            >
              <RadioGroupItem value={o.id} id={o.id} data-testid={`quiz-option-${o.id}`} />
              {o.text}
            </Label>
          ))}
        </RadioGroup>
      </Card>

      <div className="flex items-center justify-between gap-2">
        <Button variant="outline" onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0}>
          <ChevronLeft /> Previous
        </Button>
        <div className="flex gap-2">
          {index < quiz.questions.length - 1 ? (
            <Button data-testid="quiz-next" onClick={() => setIndex((i) => i + 1)}>
              Next <ChevronRight />
            </Button>
          ) : null}
          <Button data-testid="quiz-submit" variant="success" onClick={() => setConfirmOpen(true)} loading={submitting}>
            Submit quiz
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Submit your answers?"
        description={
          unanswered > 0 ? (
            <span className="inline-flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-warning mt-0.5" /> You have {unanswered} unanswered question{unanswered === 1 ? "" : "s"}.
              Unanswered questions count as incorrect.
            </span>
          ) : (
            "All questions answered. Your score will be calculated immediately."
          )
        }
        confirmLabel="Submit"
        loading={submitting}
        onConfirm={submit}
      />
    </div>
  );
}
