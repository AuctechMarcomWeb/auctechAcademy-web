"use client";

import { ClipboardList, FileCheck2, Lock, PlayCircle, Trophy } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { useDb } from "@/store/db.store";
import { formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Public (pre-purchase) curriculum view: lessons are listed but locked except previews. */
export function CurriculumAccordion({ course, unlocked = false }) {
  const quizzes = useDb((s) => s.quizzes);
  const assignments = useDb((s) => s.assignments);
  const defaultOpen = course.modules[0]?.id;

  return (
    <Accordion
      type="multiple"
      defaultValue={defaultOpen ? [defaultOpen] : []}
      className="rounded-xl border border-border bg-card divide-y divide-border"
    >
      {course.modules.map((m) => {
        const quiz = m.quizId ? quizzes.find((q) => q.id === m.quizId) : undefined;
        const assignment = m.assignmentId ? assignments.find((a) => a.id === m.assignmentId) : undefined;
        const minutes = m.lessons.reduce((a, l) => a + l.durationSeconds, 0);
        return (
          <AccordionItem key={m.id} value={m.id} className="px-4 border-b-0">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex-1 min-w-0 text-left">
                <p className="font-semibold">
                  <span className="text-muted-foreground mr-2">Module {m.order}:</span>
                  {m.title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {m.lessons.length} lesson{m.lessons.length === 1 ? "" : "s"} · {formatDuration(minutes)}
                  {quiz && " · quiz"}
                  {assignment && " · assignment"}
                </p>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-1">
                {m.lessons.map((l) => {
                  const open = unlocked || l.isPreview;
                  return (
                    <li
                      key={l.id}
                      className={cn("flex items-center gap-3 rounded-md px-2 py-2 text-sm", open ? "text-foreground" : "text-muted-foreground")}
                    >
                      {open ? <PlayCircle className="h-4 w-4 text-secondary shrink-0" /> : <Lock className="h-4 w-4 shrink-0" />}
                      <span className="flex-1 min-w-0 truncate">{l.title}</span>
                      {l.isPreview && !unlocked && <Badge variant="secondary">Preview</Badge>}
                      <span className="text-xs tabular-nums">{formatDuration(l.durationSeconds)}</span>
                    </li>
                  );
                })}
                {assignment && (
                  <li className="flex items-center gap-3 rounded-md px-2 py-2 text-sm text-muted-foreground">
                    <FileCheck2 className="h-4 w-4 shrink-0 text-amber-600" />
                    <span className="flex-1 truncate">Assignment: {assignment.title}</span>
                    <span className="text-xs">{assignment.maxMarks} marks</span>
                  </li>
                )}
                {quiz && (
                  <li className="flex items-center gap-3 rounded-md px-2 py-2 text-sm text-muted-foreground">
                    {m.isFinalAssessment ? (
                      <Trophy className="h-4 w-4 shrink-0 text-accent" />
                    ) : (
                      <ClipboardList className="h-4 w-4 shrink-0 text-secondary" />
                    )}
                    <span className="flex-1 truncate">{quiz.title}</span>
                    <span className="text-xs">
                      {quiz.questions.length} questions · pass {quiz.passingScore}%
                    </span>
                  </li>
                )}
              </ul>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
