"use client";

import { Award, BookOpenCheck, CheckCircle2, FileCheck2, GraduationCap, XCircle } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

const ICONS = {
  lesson_completed: { icon: CheckCircle2, tone: "bg-secondary/10 text-secondary" },
  quiz_passed: { icon: BookOpenCheck, tone: "bg-success/10 text-success" },
  quiz_failed: { icon: XCircle, tone: "bg-destructive/10 text-destructive" },
  enrolled: { icon: GraduationCap, tone: "bg-primary/10 text-primary" },
  certificate_issued: { icon: Award, tone: "bg-accent/30 text-amber-700" },
  assignment_submitted: { icon: FileCheck2, tone: "bg-secondary/10 text-secondary" },
  course_completed: { icon: Award, tone: "bg-success/10 text-success" },
};

export function ActivityFeed({ events, limit = 6 }) {
  if (!events.length) return <EmptyState compact title="No activity yet" description="Start a lesson to see your activity here." />;
  return (
    <ol className="space-y-3">
      {events.slice(0, limit).map((e) => {
        const { icon: Icon, tone } = ICONS[e.type];
        return (
          <li key={e.id} className="flex items-start gap-3">
            <span className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full", tone)}>
              <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-sm leading-snug">{e.title}</p>
              <p className="text-xs text-muted-foreground">{timeAgo(e.at)}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
