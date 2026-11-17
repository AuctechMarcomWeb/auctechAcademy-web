"use client";

import * as React from "react";
import { CalendarClock, FileCheck2, MessageSquare, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/form-field";
import { FileDropzone } from "@/components/shared/file-dropzone";
import { StatusBadge } from "@/components/shared/status-badge";
import { learningService } from "@/services/learning.service";
import { ApiError } from "@/services/api-client";
import { formatDate, formatDateTime } from "@/lib/format";

export function AssignmentPanel({ userId, assignment, submission, courseTitle, moduleTitle }) {
  const [file, setFile] = React.useState(null);
  const [note, setNote] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [uploadPct, setUploadPct] = React.useState(null);
  const [error, setError] = React.useState();

  const canSubmit = !submission || submission.status === "pending" || (submission.status === "rejected" && assignment.allowResubmission);
  const overdue = new Date(assignment.deadline) < new Date();

  const submit = async () => {
    if (!file) {
      setError("Attach your submission file first.");
      return;
    }
    setBusy(true);
    setError(undefined);
    try {
      await learningService.submitAssignment({ userId, assignment, file, note: note.trim() || undefined, onProgress: setUploadPct });
      toast.success("Assignment submitted for review");
      setFile(null);
      setNote("");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Submission failed");
    } finally {
      setBusy(false);
      setUploadPct(null);
    }
  };

  return (
    <div className="space-y-5">
      <Card className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-secondary">Assignment</p>
            <h1 className="text-xl font-bold">{assignment.title}</h1>
            <p className="text-sm text-muted-foreground">{[courseTitle, moduleTitle].filter(Boolean).join(" · ")}</p>
          </div>
          <StatusBadge status={submission?.status ?? "pending"} />
        </div>
        <dl className="mt-4 grid gap-3 sm:grid-cols-3 text-sm">
          <div className="rounded-lg border border-border p-3">
            <dt className="text-xs text-muted-foreground inline-flex items-center gap-1">
              <CalendarClock className="h-3 w-3" /> Deadline
            </dt>
            <dd className={overdue ? "font-semibold text-destructive" : "font-semibold"}>
              {formatDate(assignment.deadline)}
              {overdue ? " (passed)" : ""}
            </dd>
          </div>
          <div className="rounded-lg border border-border p-3">
            <dt className="text-xs text-muted-foreground">Max marks</dt>
            <dd className="font-semibold">{assignment.maxMarks}</dd>
          </div>
          <div className="rounded-lg border border-border p-3">
            <dt className="text-xs text-muted-foreground">Resubmission</dt>
            <dd className="font-semibold">{assignment.allowResubmission ? "Allowed if rejected" : "Not allowed"}</dd>
          </div>
        </dl>
        <section className="mt-5">
          <h2 className="text-sm font-semibold mb-1">Instructions</h2>
          <p className="text-sm leading-relaxed text-foreground/90">{assignment.instructions}</p>
        </section>
      </Card>

      {submission && submission.status !== "pending" && (
        <Card className="p-6">
          <h2 className="text-sm font-semibold inline-flex items-center gap-2">
            <FileCheck2 className="h-4 w-4 text-secondary" /> Your submission
          </h2>
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted-foreground">File</dt>
              <dd className="font-medium">
                {submission.fileName} {submission.fileSize ? `(${(submission.fileSize / 1024 / 1024).toFixed(2)} MB)` : ""}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Submitted</dt>
              <dd className="font-medium">
                {submission.submittedAt ? formatDateTime(submission.submittedAt) : "—"} · attempt {submission.attempt}
              </dd>
            </div>
            {submission.note && (
              <div className="sm:col-span-2">
                <dt className="text-xs text-muted-foreground">Your note</dt>
                <dd>{submission.note}</dd>
              </div>
            )}
            {typeof submission.marks === "number" && (
              <div>
                <dt className="text-xs text-muted-foreground">Marks</dt>
                <dd className="font-semibold">
                  {submission.marks} / {assignment.maxMarks}{" "}
                  {submission.grade && <span className="ml-1 rounded bg-success/10 px-1.5 text-success">{submission.grade}</span>}
                </dd>
              </div>
            )}
          </dl>
          {submission.feedback && (
            <div className="mt-4 rounded-lg bg-muted p-4 text-sm">
              <p className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground mb-1">
                <MessageSquare className="h-3 w-3" /> Instructor feedback
              </p>
              <p>{submission.feedback}</p>
            </div>
          )}
          {submission.status === "under_review" && (
            <p className="mt-3 text-xs text-muted-foreground">Your work is with the instructor. You will be notified when it is graded.</p>
          )}
        </Card>
      )}

      {canSubmit && (
        <Card className="p-6">
          <h2 className="text-sm font-semibold inline-flex items-center gap-2">
            <Upload className="h-4 w-4 text-secondary" /> {submission?.status === "rejected" ? "Resubmit your work" : "Submit your work"}
          </h2>
          <div className="mt-4 space-y-4">
            <FormField label="Submission file" required error={error} htmlFor="assignment-file">
              <FileDropzone
                id="assignment-file"
                value={file}
                onChange={(f) => {
                  setFile(f);
                  setError(undefined);
                }}
                accept=".pdf,.zip,.doc,.docx,.ppt,.pptx"
                maxSizeMb={25}
                hint="PDF, ZIP or Office documents · up to 25 MB (demo: file is not uploaded, only recorded)"
              />
            </FormField>
            <FormField
              label="Note for the reviewer"
              htmlFor="assignment-note"
              hint="Optional — include live links, repository URLs or anything the reviewer should know."
            >
              <Textarea id="assignment-note" value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
            </FormField>
            <Button onClick={submit} loading={busy} data-testid="assignment-submit">
              <Upload /> {uploadPct !== null && uploadPct < 100 ? `Uploading ${uploadPct}%` : "Submit assignment"}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
