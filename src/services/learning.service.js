import { useAuth } from "@/store/auth.store";
import { useDb } from "@/store/db.store";
import { useLearning } from "@/store/learning.store";
import { api, API_BASE } from "./api-client";
import { syncService } from "./sync.service";
import { uploadService } from "./upload.service";

const FLUSH_INTERVAL_MS = 5000;
const pending = new Map(); // courseId → lessonId → aggregated event
const timers = new Map();
const owners = new Map(); // courseId → userId

function scheduleFlush(courseId) {
  if (timers.has(courseId)) return;
  timers.set(
    courseId,
    setTimeout(() => {
      timers.delete(courseId);
      void learningService.flushPlayback(courseId);
    }, FLUSH_INTERVAL_MS),
  );
}

function reapplyPending(userId, courseId) {
  const events = pending.get(courseId);
  if (!events) return;
  for (const e of events.values())
    useLearning.getState().recordPlayback(userId, courseId, e.lessonId, { position: e.position, delta: 0, duration: e.duration });
}

if (typeof window !== "undefined") {
  // Best-effort flush when the tab is hidden or closed.
  const flushAllKeepalive = () => {
    const token = useAuth.getState().token;
    if (!token) return;
    for (const [courseId, events] of pending) {
      if (!events.size) continue;
      void fetch(`${API_BASE}/learning/courses/${encodeURIComponent(courseId)}/playback`, {
        method: "POST",
        keepalive: true,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ events: [...events.values()] }),
      }).catch(() => {});
      pending.delete(courseId);
    }
  };
  window.addEventListener("pagehide", flushAllKeepalive);
  document.addEventListener("visibilitychange", () => document.visibilityState === "hidden" && flushAllKeepalive());
}

const lastLessonTimers = new Map();

export const learningService = {
  /** Called by the player many times per minute: instant local update + batched server report. */
  recordPlayback(userId, courseId, lessonId, e) {
    const lp = useLearning.getState().recordPlayback(userId, courseId, lessonId, e);
    owners.set(courseId, userId);
    const events = pending.get(courseId) ?? new Map();
    const prev = events.get(lessonId);
    events.set(lessonId, { lessonId, position: e.position, delta: (prev?.delta ?? 0) + Math.max(0, e.delta), duration: e.duration });
    pending.set(courseId, events);
    scheduleFlush(courseId);
    return lp;
  },

  async flushPlayback(courseId) {
    const events = pending.get(courseId);
    if (!events?.size) return;
    pending.delete(courseId);
    const t = timers.get(courseId);
    if (t) clearTimeout(t);
    timers.delete(courseId);
    const userId = owners.get(courseId) ?? useAuth.getState().userId;
    try {
      const { progress } = await api.post(`/learning/courses/${encodeURIComponent(courseId)}/playback`, { events: [...events.values()] });
      if (userId && progress) {
        useLearning.getState().setProgress(userId, courseId, progress);
        reapplyPending(userId, courseId);
      }
    } catch {
      // Network hiccup: telemetry for this batch is dropped; the next batch carries the latest position.
    }
  },

  setLastLesson(userId, courseId, lessonId) {
    useLearning.getState().ensureProgress(userId, courseId);
    const before = useLearning.getState().getProgress(userId, courseId)?.lastLessonId;
    useLearning.getState().setLastLesson(userId, courseId, lessonId);
    if (before === lessonId) return;
    const prev = lastLessonTimers.get(courseId);
    if (prev) clearTimeout(prev);
    lastLessonTimers.set(
      courseId,
      setTimeout(() => {
        lastLessonTimers.delete(courseId);
        void api.post(`/learning/courses/${encodeURIComponent(courseId)}/last-lesson`, { lessonId }).catch(() => {});
      }, 800),
    );
  },

  /** The server checks the lesson is unlocked and the watch threshold was reached. */
  async completeLesson(userId, courseId, lessonId, lessonTitle) {
    await learningService.flushPlayback(courseId);
    const { progress } = await api.post(`/learning/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lessonId)}/complete`);
    useLearning.getState().setProgress(userId, courseId, progress);
    useDb.getState().addActivity({ userId, type: "lesson_completed", title: `Completed ${lessonTitle}`, courseId });
  },

  async submitQuiz({ userId, quiz, answers, startedAt }) {
    const { attempt } = await api.post(`/learning/quizzes/${encodeURIComponent(quiz.id)}/attempts`, { answers, startedAt });
    useLearning.getState().addAttempt(userId, attempt);
    useDb.getState().addActivity({
      userId,
      type: attempt.passed ? "quiz_passed" : "quiz_failed",
      title: `${attempt.passed ? "Passed" : "Did not pass"} ${quiz.title} with ${attempt.scorePercent}%`,
      courseId: quiz.courseId,
    });
    return attempt;
  },

  /** Uploads the file to the backend, then records the submission. */
  async submitAssignment(params) {
    const upload = await uploadService.upload(params.file, "assignment", params.onProgress);
    const { submission } = await api.post(`/learning/assignments/${encodeURIComponent(params.assignment.id)}/submissions`, {
      uploadId: upload.id,
      fileName: params.file.name,
      fileSize: params.file.size,
      note: params.note,
    });
    useDb.getState().upsertSubmission(submission);
    useDb
      .getState()
      .addActivity({
        userId: params.userId,
        type: "assignment_submitted",
        title: `Submitted ${params.assignment.title}`,
        courseId: params.assignment.courseId,
      });
    return submission;
  },

  /** The backend re-checks every requirement, completes the enrollment and issues the certificate. */
  async completeCourse(userId, course, ctx) {
    void ctx;
    await learningService.flushPlayback(course.id);
    const res = await api.post(`/learning/courses/${encodeURIComponent(course.id)}/complete`);
    const db = useDb.getState();
    db.addCertificate(res.certificate);
    db.addEnrollment(res.enrollment);
    if (res.progress) useLearning.getState().setProgress(userId, course.id, res.progress);
    syncService.refresh();
    return { certificate: res.certificate };
  },

  async addNote(userId, courseId, note) {
    const { note: saved } = await api.post(`/learning/courses/${encodeURIComponent(courseId)}/notes`, note);
    useLearning.getState().addNote(userId, courseId, saved);
    return saved;
  },

  async deleteNote(userId, courseId, noteId) {
    await api.delete(`/learning/notes/${encodeURIComponent(noteId)}`);
    useLearning.getState().deleteNote(userId, courseId, noteId);
  },

  /** Demo control: wipes the signed-in learner's own progress on the server. */
  async resetMyProgress(userId) {
    await api.post("/learning/reset");
    useLearning.getState().clearUser(userId);
    await syncService.load();
  },

  /* Admin: review assignment */
  async reviewSubmission(submissionId, review) {
    const { submission } = await api.patch(`/admin/submissions/${encodeURIComponent(submissionId)}/review`, review);
    useDb.getState().upsertSubmission(submission);
  },
};
