"use client";

import { create } from "zustand";
const key = (userId, courseId) => `${userId}:${courseId}`;

export const useLearning = create()((set, get) => ({
  hydrated: false,
  progress: {},
  attempts: [],
  attemptOwners: {},
  notes: {},
  setHydrated: (hydrated) => set({ hydrated }),
  applySync: (p) =>
    set({
      progress: p.progress,
      attempts: p.attempts,
      attemptOwners: p.attemptOwners,
      notes: p.notes,
    }),

  ensureProgress: (userId, courseId) => {
    const k = key(userId, courseId);
    const existing = get().progress[k];
    if (existing) return existing;
    const now = new Date().toISOString();
    const fresh = { courseId, lessons: {}, startedAt: now, updatedAt: now };
    set((s) => ({ progress: { ...s.progress, [k]: fresh } }));
    return fresh;
  },

  getProgress: (userId, courseId) => get().progress[key(userId, courseId)],

  setProgress: (userId, courseId, progress) => {
    const k = key(userId, courseId);
    set((s) => {
      // Keep any newer local playback position the server hasn't seen yet.
      const local = s.progress[k];
      const lessons = { ...progress.lessons };
      if (local) {
        for (const [id, lp] of Object.entries(local.lessons)) {
          const remote = lessons[id];
          if (remote && !remote.completed && lp.lastPosition > remote.lastPosition && lp.updatedAt > remote.updatedAt) {
            lessons[id] = { ...remote, lastPosition: lp.lastPosition };
          }
        }
      }
      return { progress: { ...s.progress, [k]: { ...progress, courseId, lessons } } };
    });
  },

  recordPlayback: (userId, courseId, lessonId, { position, delta, duration }) => {
    const k = key(userId, courseId);
    const now = new Date().toISOString();
    const current = get().progress[k] ?? { courseId, lessons: {}, startedAt: now, updatedAt: now };
    const prev = current.lessons[lessonId] ?? {
      lessonId,
      maxPosition: 0,
      watchedSeconds: 0,
      lastPosition: 0,
      completed: false,
      updatedAt: now,
    };
    const safePosition = Math.max(0, Math.min(position, duration || position));
    const next = {
      ...prev,
      lastPosition: safePosition,
      maxPosition: Math.max(prev.maxPosition, safePosition),
      watchedSeconds: Math.min(prev.watchedSeconds + Math.max(0, delta), duration ? duration * 1.05 : Infinity),
      updatedAt: now,
    };
    set((s) => ({
      progress: {
        ...s.progress,
        [k]: { ...current, lessons: { ...current.lessons, [lessonId]: next }, lastLessonId: lessonId, updatedAt: now },
      },
    }));
    return next;
  },

  setLastLesson: (userId, courseId, lessonId) => {
    const k = key(userId, courseId);
    set((s) => {
      const current = s.progress[k];
      if (!current || current.lastLessonId === lessonId) return {};
      return { progress: { ...s.progress, [k]: { ...current, lastLessonId: lessonId } } };
    });
  },

  addAttempt: (userId, attempt) => {
    set((s) => ({
      attempts: [attempt, ...s.attempts.filter((a) => a.id !== attempt.id)],
      attemptOwners: { ...s.attemptOwners, [attempt.id]: userId },
    }));
    return attempt;
  },

  attemptsFor: (userId, courseId) => get().attempts.filter((a) => get().attemptOwners[a.id] === userId && (!courseId || a.courseId === courseId)),

  addNote: (userId, courseId, note) => {
    const k = key(userId, courseId);
    set((s) => ({ notes: { ...s.notes, [k]: [note, ...(s.notes[k] ?? [])] } }));
  },
  deleteNote: (userId, courseId, noteId) => {
    const k = key(userId, courseId);
    set((s) => ({ notes: { ...s.notes, [k]: (s.notes[k] ?? []).filter((n) => n.id !== noteId) } }));
  },
  notesFor: (userId, courseId) => get().notes[key(userId, courseId)] ?? [],

  clearUser: (userId) =>
    set((s) => {
      const keep = (rec) => Object.fromEntries(Object.entries(rec).filter(([k]) => !k.startsWith(`${userId}:`)));
      const attempts = s.attempts.filter((a) => s.attemptOwners[a.id] !== userId);
      return { progress: keep(s.progress), notes: keep(s.notes), attempts };
    }),
  resetAll: () => set({ progress: {}, attempts: [], attemptOwners: {}, notes: {} }),
}));
