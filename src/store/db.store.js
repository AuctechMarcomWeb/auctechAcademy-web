"use client";

import { create } from "zustand";

const DEFAULT_SETTINGS = {
  siteName: "Auctech Academy",
  supportEmail: "academy@auctech.in",
  currency: "INR",
  gstPercent: 18,
  defaultPassingScore: 70,
  watchThresholdPercent: 90,
  certificatePrefix: "AUC",
  allowQuizRetakes: true,
  maintenanceMode: false,
};

const empty = () => ({
  categories: [],
  instructors: [],
  courses: [],
  quizzes: [],
  assignments: [],
  users: [],
  enrollments: [],
  orders: [],
  certificates: [],
  certificatesIssued: 0,
  internships: [],
  internshipApplications: [],
  assignmentSubmissions: [],
  activity: [],
  coupons: [],
  contactMessages: [],
  settings: DEFAULT_SETTINGS,
});

const replaceById = (list, item) => {
  const idx = list.findIndex((x) => x.id === item.id);
  if (idx === -1) return [item, ...list];
  const next = list.slice();
  next[idx] = item;
  return next;
};

const patchById = (list, id, patch) => list.map((x) => (x.id === id ? { ...x, ...patch } : x));

export const useDb = create()((set) => ({
  ...empty(),
  hydrated: false,
  syncing: false,
  syncError: null,
  lastSyncedAt: null,
  setHydrated: (hydrated) => set({ hydrated }),
  setSyncState: (patch) => set(patch),
  applySync: (p) =>
    set({
      categories: p.categories,
      instructors: p.instructors,
      courses: p.courses,
      quizzes: p.quizzes,
      assignments: p.assignments,
      users: p.users,
      enrollments: p.enrollments,
      orders: p.orders,
      certificates: p.certificates,
      certificatesIssued: p.certificatesIssued,
      internships: p.internships,
      internshipApplications: p.internshipApplications,
      assignmentSubmissions: p.assignmentSubmissions,
      activity: p.activity,
      coupons: p.coupons,
      contactMessages: p.contactMessages ?? [],
      settings: { ...DEFAULT_SETTINGS, ...p.settings },
      lastSyncedAt: p.serverTime,
      syncError: null,
    }),

  upsertUser: (user) => set((s) => ({ users: replaceById(s.users, user) })),
  updateUser: (id, patch) => set((s) => ({ users: patchById(s.users, id, patch) })),

  upsertCategory: (category) => set((s) => ({ categories: replaceById(s.categories, category) })),
  deleteCategory: (id) => set((s) => ({ categories: s.categories.filter((c) => c.id !== id) })),
  upsertCourse: (course) => set((s) => ({ courses: replaceById(s.courses, course) })),
  deleteCourse: (id) => set((s) => ({ courses: s.courses.filter((c) => c.id !== id) })),
  upsertQuiz: (quiz) => set((s) => ({ quizzes: replaceById(s.quizzes, quiz) })),
  deleteQuiz: (id) => set((s) => ({ quizzes: s.quizzes.filter((q) => q.id !== id) })),

  addOrder: (order) => set((s) => ({ orders: replaceById(s.orders, order) })),
  updateOrder: (id, patch) => set((s) => ({ orders: patchById(s.orders, id, patch) })),
  addEnrollment: (e) => set((s) => ({ enrollments: replaceById(s.enrollments, e) })),
  updateEnrollment: (id, patch) => set((s) => ({ enrollments: patchById(s.enrollments, id, patch) })),

  addCertificate: (c) => set((s) => ({ certificates: replaceById(s.certificates, c) })),
  updateCertificate: (id, patch) => set((s) => ({ certificates: patchById(s.certificates, id, patch) })),

  upsertInternship: (i) => set((s) => ({ internships: replaceById(s.internships, i) })),
  deleteInternship: (id) => set((s) => ({ internships: s.internships.filter((i) => i.id !== id) })),
  addApplication: (a) => set((s) => ({ internshipApplications: replaceById(s.internshipApplications, a) })),
  updateApplication: (id, patch) => set((s) => ({ internshipApplications: patchById(s.internshipApplications, id, patch) })),

  upsertSubmission: (sub) => set((s) => ({ assignmentSubmissions: replaceById(s.assignmentSubmissions, sub) })),

  addActivity: (a) =>
    set((s) => ({
      activity: [{ ...a, id: a.id ?? `act_local_${Date.now()}`, at: a.at ?? new Date().toISOString() }, ...s.activity].slice(0, 200),
    })),
  updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
}));

/* ---------- Selectors (memo-friendly, use inside components) ---------- */

export const selectCourseBySlug = (slug) => (s) => s.courses.find((c) => c.slug === slug);
export const selectCourseById = (id) => (s) => s.courses.find((c) => c.id === id);
export const selectQuizzesForCourse = (courseId) => (s) => s.quizzes.filter((q) => q.courseId === courseId);
export const selectAssignmentsForCourse = (courseId) => (s) => s.assignments.filter((a) => a.courseId === courseId);
export const selectEnrollmentsForUser = (userId) => (s) =>
  userId ? s.enrollments.filter((e) => e.userId === userId && e.status !== "refunded") : [];
export const selectInstructor = (id) => (s) => s.instructors.find((i) => i.id === id);
export const selectCategory = (id) => (s) => s.categories.find((c) => c.id === id);
