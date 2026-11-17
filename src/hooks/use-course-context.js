"use client";

import { useMemo } from "react";
import { useDb } from "@/store/db.store";
import { useLearning } from "@/store/learning.store";
import { computeLockStates, flattenCurriculum, summarizeCourse } from "@/lib/curriculum";

/**
 * Assembles everything the player / progress pages need for one course and
 * one learner, re-computed whenever the underlying stores change.
 */
export function useCourseContext(userId, course) {
  const quizzes = useDb((s) => s.quizzes);
  const assignments = useDb((s) => s.assignments);
  const submissions = useDb((s) => s.assignmentSubmissions);
  const progressMap = useLearning((s) => s.progress);
  const attempts = useLearning((s) => s.attempts);
  const owners = useLearning((s) => s.attemptOwners);

  return useMemo(() => {
    if (!course || !userId) return undefined;
    const ctx = {
      course,
      quizzes: quizzes.filter((q) => q.courseId === course.id),
      assignments: assignments.filter((a) => a.courseId === course.id),
      progress: progressMap[`${userId}:${course.id}`],
      attempts: attempts.filter((a) => owners[a.id] === userId && a.courseId === course.id),
      submissions: submissions.filter((s) => s.userId === userId),
    };
    const items = flattenCurriculum(ctx.course, ctx.quizzes, ctx.assignments);
    const locks = computeLockStates(ctx);
    const summary = summarizeCourse(ctx);
    return { ctx, items, locks, summary };
  }, [course, userId, quizzes, assignments, submissions, progressMap, attempts, owners]);
}
