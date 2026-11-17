import { Lock } from "lucide-react";

export function itemLabel(item) {
  if (!item) return "the previous step";
  if (item.kind === "lesson") return `“${item.lesson.title}”`;
  if (item.kind === "quiz") return `the ${item.quiz.title}`;
  return `the assignment “${item.assignment.title}”`;
}

export function LockedOverlay({ item, previous }) {
  const title = item.kind === "lesson" ? item.lesson.title : item.kind === "quiz" ? item.quiz.title : item.assignment.title;
  return (
    <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/60 p-6 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-card shadow-card">
        <Lock className="h-6 w-6 text-muted-foreground" />
      </span>
      <h3 className="font-semibold">{title} is locked</h3>
      <p className="max-w-md text-sm text-muted-foreground">
        Complete {itemLabel(previous)} to unlock this step. Lessons open in sequence: watch each video to at least 90% and pass the module quiz to
        move on.
      </p>
    </div>
  );
}
