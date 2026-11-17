"use client";

import { CheckCircle2, ClipboardList, FileCheck2, Lock, PlayCircle, Circle } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";

function StateIcon({ state, kind }) {
  if (state === "completed") return <CheckCircle2 className="h-4 w-4 text-success" />;
  if (state === "locked") return <Lock className="h-4 w-4 text-muted-foreground/70" />;
  if (kind === "quiz") return <ClipboardList className="h-4 w-4 text-secondary" />;
  if (kind === "assignment") return <FileCheck2 className="h-4 w-4 text-secondary" />;
  return state === "in_progress" ? <PlayCircle className="h-4 w-4 text-secondary" /> : <Circle className="h-4 w-4 text-muted-foreground" />;
}

export function LessonSidebar({ course, items, locks, currentId, onSelect, className }) {
  return (
    <div className={cn("flex flex-col", className)}>
      {course.modules.map((module) => {
        const moduleItems = items.filter((i) => i.moduleId === module.id);
        const done = moduleItems.filter((i) => locks.get(i.id) === "completed").length;
        const pct = moduleItems.length ? Math.round((done / moduleItems.length) * 100) : 0;
        return (
          <section key={module.id} className="border-b border-border last:border-b-0">
            <header className="px-4 pt-4 pb-2">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold leading-snug">
                  <span className="text-muted-foreground">Module {module.order}:</span> {module.title}
                </h3>
                <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                  {done}/{moduleItems.length}
                </span>
              </div>
              <Progress value={pct} className="mt-2 h-1" indicatorClassName={pct === 100 ? "bg-success" : undefined} />
            </header>
            <ul className="pb-2">
              {moduleItems.map((item) => {
                const state = locks.get(item.id) ?? "locked";
                const active = item.id === currentId;
                const label = item.kind === "lesson" ? item.lesson.title : item.kind === "quiz" ? item.quiz.title : item.assignment.title;
                const meta =
                  item.kind === "lesson"
                    ? formatDuration(item.lesson.durationSeconds)
                    : item.kind === "quiz"
                      ? `${item.quiz.questions.length} questions · pass ${item.quiz.passingScore}%`
                      : "Assignment";
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      data-testid={`lesson-item-${item.id}`}
                      data-state={state}
                      aria-current={active ? "true" : undefined}
                      aria-disabled={state === "locked"}
                      onClick={() => {
                        if (state === "locked") {
                          toast.info("This step is locked. Complete the previous lesson or quiz first.");
                          return;
                        }
                        onSelect(item);
                      }}
                      className={cn(
                        "flex w-full items-start gap-3 px-4 py-2.5 text-left text-sm transition-colors cursor-pointer",
                        active ? "bg-secondary/10 border-l-2 border-secondary" : "border-l-2 border-transparent hover:bg-muted",
                        state === "locked" && "text-muted-foreground cursor-not-allowed",
                      )}
                    >
                      <span className="mt-0.5 shrink-0">
                        <StateIcon state={state} kind={item.kind} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={cn("block leading-snug", active && "font-medium text-primary")}>{label}</span>
                        <span className="block text-xs text-muted-foreground">{meta}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
