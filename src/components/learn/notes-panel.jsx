"use client";

import * as React from "react";
import { Clock, StickyNote, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useLearning } from "@/store/learning.store";
import { learningService } from "@/services/learning.service";
import { ApiError } from "@/services/api-client";
import { formatClock, timeAgo } from "@/lib/format";

export function NotesPanel({ userId, courseId, lessonId, lessonTitleById, currentTime }) {
  const notesMap = useLearning((s) => s.notes);
  const [saving, setSaving] = React.useState(false);
  const notes = notesMap[`${userId}:${courseId}`] ?? [];
  const [body, setBody] = React.useState("");
  const [onlyThisLesson, setOnlyThisLesson] = React.useState(true);

  const visible = onlyThisLesson && lessonId ? notes.filter((n) => n.lessonId === lessonId) : notes;

  const save = async () => {
    if (!body.trim() || !lessonId || saving) return;
    setSaving(true);
    try {
      await learningService.addNote(userId, courseId, {
        lessonId,
        body: body.trim(),
        timestampSeconds: currentTime !== undefined ? Math.floor(currentTime) : undefined,
      });
      setBody("");
      toast.success("Note saved");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not save the note");
    } finally {
      setSaving(false);
    }
  };
  const remove = async (noteId) => {
    try {
      await learningService.deleteNote(userId, courseId, noteId);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not delete the note");
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {lessonId ? (
        <div className="space-y-2">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={currentTime !== undefined ? `Note at ${formatClock(currentTime)}…` : "Write a note for this lesson…"}
            rows={3}
            aria-label="New note"
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") void save();
            }}
          />
          <div className="flex items-center justify-between gap-2">
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={onlyThisLesson}
                onChange={(e) => setOnlyThisLesson(e.target.checked)}
                className="accent-[var(--secondary)]"
              />
              This lesson only
            </label>
            <Button size="sm" onClick={() => void save()} loading={saving} disabled={!body.trim() || saving}>
              <StickyNote /> Save note
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Open a lesson to add notes.</p>
      )}
      {visible.length === 0 ? (
        <p className="rounded-md border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
          No notes yet. Notes are saved per lesson with the video timestamp.
        </p>
      ) : (
        <ul className="space-y-2">
          {visible.map((n) => (
            <li key={n.id} className="rounded-md border border-border bg-card p-3 text-sm">
              <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span className="truncate">{lessonTitleById[n.lessonId] ?? "Lesson"}</span>
                <span className="inline-flex items-center gap-2 shrink-0">
                  {n.timestampSeconds !== undefined && (
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {formatClock(n.timestampSeconds)}
                    </span>
                  )}
                  <button onClick={() => void remove(n.id)} className="hover:text-destructive cursor-pointer" aria-label="Delete note">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </span>
              </div>
              <p className="mt-1 whitespace-pre-wrap">{n.body}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">{timeAgo(n.createdAt)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
