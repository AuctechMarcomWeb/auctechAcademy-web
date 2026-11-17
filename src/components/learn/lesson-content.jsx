"use client";

import * as React from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, Download, FileText, Link2, Package } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { VideoPlayer } from "./video-player";
import { useWatchThreshold } from "@/hooks/use-watch-threshold";
import { formatDuration } from "@/lib/format";
import { itemLabel } from "./locked-overlay";

const RES_ICON = { pdf: FileText, link: Link2, zip: Package, code: FileText };

export function LessonContent({ lesson, progress, prev, next, nextLocked, onPlayback, onMarkComplete, onNavigate, onTimeChange }) {
  const [mediaDuration, setMediaDuration] = React.useState(0);
  const [thresholdHit, setThresholdHit] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const WATCH_THRESHOLD = useWatchThreshold();
  const markComplete = async () => {
    setSaving(true);
    try {
      await onMarkComplete();
    } finally {
      setSaving(false);
    }
  };
  const completed = Boolean(progress?.completed);
  const duration = mediaDuration || lesson.durationSeconds;
  const reached = completed || thresholdHit || (duration > 0 && (progress?.maxPosition ?? 0) / duration >= WATCH_THRESHOLD);

  return (
    <div className="space-y-5">
      <VideoPlayer
        src={lesson.videoUrl}
        title={lesson.title}
        maxPosition={progress?.maxPosition ?? 0}
        startAt={completed ? 0 : (progress?.lastPosition ?? 0)}
        completed={completed}
        nominalDuration={lesson.durationSeconds}
        onPlayback={(e) => {
          if (e.duration && e.duration !== mediaDuration) setMediaDuration(e.duration);
          onTimeChange?.(e.position);
          onPlayback(e);
        }}
        onThresholdReached={() => setThresholdHit(true)}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold leading-tight">{lesson.title}</h1>
            {completed ? (
              <Badge variant="success">
                <CheckCircle2 className="h-3 w-3" /> Completed
              </Badge>
            ) : reached ? (
              <Badge variant="accent">Ready to mark complete</Badge>
            ) : (
              <Badge variant="muted">In progress</Badge>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Nominal duration {formatDuration(lesson.durationSeconds)}
            {mediaDuration ? ` · demo clip ${formatDuration(mediaDuration)}` : ""}
          </p>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-block">
              <Button
                data-testid="mark-complete"
                onClick={markComplete}
                loading={saving}
                disabled={!reached || completed || saving}
                variant={completed ? "outline" : "success"}
              >
                <CheckCircle2 /> {completed ? "Lesson completed" : "Mark as completed"}
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            {completed
              ? "You have completed this lesson."
              : reached
                ? "Great — record this lesson as complete."
                : `Watch at least ${Math.round(WATCH_THRESHOLD * 100)}% of the video to enable this.`}
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="prose prose-sm max-w-none text-foreground/90">
        <p>{lesson.description}</p>
      </div>

      {lesson.resources.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold mb-2">Learning resources</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {lesson.resources.map((r) => {
              const Icon = RES_ICON[r.type];
              return (
                <li key={r.id}>
                  <a
                    href={r.url}
                    onClick={(e) => {
                      if (r.url === "#") {
                        e.preventDefault();
                        toast.info("Demo resource — downloads are served by the backend in production.");
                      }
                    }}
                    className="flex items-center gap-3 rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-muted"
                  >
                    <Icon className="h-4 w-4 text-secondary shrink-0" />
                    <span className="min-w-0 flex-1 truncate">{r.title}</span>
                    {r.size && <span className="text-xs text-muted-foreground">{r.size}</span>}
                    <Download className="h-4 w-4 text-muted-foreground" />
                  </a>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
        <Button data-testid="prev-item" variant="outline" disabled={!prev} onClick={() => prev && onNavigate(prev)}>
          <ChevronLeft /> Previous
        </Button>
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <Button data-testid="next-item" disabled={!next || nextLocked} onClick={() => next && onNavigate(next)}>
                Next <ChevronRight />
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            {!next
              ? "This is the last step of the course."
              : nextLocked
                ? `Complete this lesson to unlock ${itemLabel(next)}.`
                : `Go to ${itemLabel(next)}`}
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
