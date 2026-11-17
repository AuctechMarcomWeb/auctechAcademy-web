"use client";

import { CheckCircle2, ChevronRight, RotateCcw, Timer, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";

export function QuizResult({ quiz, attempt, canRetake, hasNext, onRetake, onContinue }) {
  const incorrect = attempt.total - attempt.correct;
  return (
    <div className="space-y-5">
      <Card className={cn("p-6 text-center border-2", attempt.passed ? "border-success/40 bg-success/5" : "border-destructive/40 bg-destructive/5")}>
        <div
          className={cn(
            "mx-auto flex h-16 w-16 items-center justify-center rounded-full",
            attempt.passed ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive",
          )}
        >
          {attempt.passed ? <CheckCircle2 className="h-8 w-8" /> : <XCircle className="h-8 w-8" />}
        </div>
        <h2 className="mt-3 text-2xl font-bold" data-testid="quiz-result-status" data-status={attempt.passed ? "passed" : "failed"}>
          {attempt.passed ? "Passed" : "Failed"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {attempt.passed
            ? `You cleared the ${quiz.passingScore}% passing score.`
            : `You need ${quiz.passingScore}% to pass. Review the explanations below and try again.`}
        </p>
        <p className="mt-3 text-5xl font-bold tabular-nums text-primary">{attempt.scorePercent}%</p>
        <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 text-sm">
          <div className="rounded-lg bg-card p-3 border border-border">
            <dt className="text-xs text-muted-foreground">Questions</dt>
            <dd className="font-semibold">{attempt.total}</dd>
          </div>
          <div className="rounded-lg bg-card p-3 border border-border">
            <dt className="text-xs text-muted-foreground">Correct</dt>
            <dd className="font-semibold text-success">{attempt.correct}</dd>
          </div>
          <div className="rounded-lg bg-card p-3 border border-border">
            <dt className="text-xs text-muted-foreground">Incorrect</dt>
            <dd className="font-semibold text-destructive">{incorrect}</dd>
          </div>
          <div className="rounded-lg bg-card p-3 border border-border">
            <dt className="text-xs text-muted-foreground inline-flex items-center gap-1">
              <Timer className="h-3 w-3" /> Time taken
            </dt>
            <dd className="font-semibold">{formatDuration(attempt.timeTakenSeconds)}</dd>
          </div>
        </dl>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {!attempt.passed && canRetake && (
            <Button data-testid="quiz-retake" onClick={onRetake}>
              <RotateCcw /> Retake Quiz
            </Button>
          )}
          {!attempt.passed && !canRetake && <Badge variant="destructive">No attempts remaining — contact support</Badge>}
          {attempt.passed && hasNext && (
            <Button data-testid="quiz-continue" onClick={onContinue}>
              Continue to next lesson <ChevronRight />
            </Button>
          )}
        </div>
      </Card>

      <section>
        <h3 className="text-sm font-semibold mb-3">Answer review</h3>
        <ol className="space-y-3">
          {quiz.questions.map((q, i) => {
            const chosen = attempt.answers[q.id];
            // The server sends a per-question review; correct answers are only revealed once the quiz is passed or no attempts remain.
            const r = attempt.review?.[q.id];
            const correctId = r?.correctOptionId ?? q.correctOptionId;
            const known = r !== undefined || q.correctOptionId !== undefined;
            const right = r ? r.correct : chosen === correctId;
            const explanation = r?.explanation ?? q.explanation;
            return (
              <li key={q.id} className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-start gap-3">
                  <span className={cn("mt-0.5 shrink-0", !known ? "text-muted-foreground" : right ? "text-success" : "text-destructive")}>
                    {known && !right ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      {i + 1}. {q.prompt}
                    </p>
                    <ul className="mt-2 space-y-1 text-sm">
                      {q.options.map((o) => (
                        <li
                          key={o.id}
                          className={cn(
                            "rounded px-2 py-1",
                            correctId && o.id === correctId && "bg-success/10 text-success font-medium",
                            o.id === chosen && known && !right && "bg-destructive/10 text-destructive line-through",
                            o.id === chosen && known && right && !correctId && "bg-success/10 text-success font-medium",
                            o.id === chosen && !known && "bg-muted font-medium",
                          )}
                        >
                          {o.text}
                          {o.id === chosen && <span className="ml-2 text-xs">(your answer)</span>}
                        </li>
                      ))}
                      {!chosen && <li className="text-xs text-muted-foreground italic">Not answered</li>}
                    </ul>
                    {explanation && <p className="mt-2 text-xs text-muted-foreground">{explanation}</p>}
                    {known && !right && !correctId && (
                      <p className="mt-2 text-xs text-muted-foreground">The correct answer is shown once you pass this quiz.</p>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
