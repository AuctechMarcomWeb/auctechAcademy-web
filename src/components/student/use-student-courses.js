"use client";

import { useMemo } from "react";
import { useDb } from "@/store/db.store";
import { useLearning } from "@/store/learning.store";
import { summarizeCourse } from "@/lib/curriculum";

/** All of a learner's enrolled courses joined with live progress summaries. */
export function useStudentCourses(userId) {
  const enrollments = useDb((s) => s.enrollments);
  const courses = useDb((s) => s.courses);
  const quizzes = useDb((s) => s.quizzes);
  const assignments = useDb((s) => s.assignments);
  const submissions = useDb((s) => s.assignmentSubmissions);
  const progressMap = useLearning((s) => s.progress);
  const attempts = useLearning((s) => s.attempts);
  const owners = useLearning((s) => s.attemptOwners);

  return useMemo(() => {
    if (!userId) return [];
    const result = [];
    for (const enrollment of enrollments.filter((e) => e.userId === userId && e.status !== "refunded")) {
      const course = courses.find((c) => c.id === enrollment.courseId);
      if (!course) continue;
      const ctx = {
        course,
        quizzes: quizzes.filter((q) => q.courseId === course.id),
        assignments: assignments.filter((a) => a.courseId === course.id),
        progress: progressMap[`${userId}:${course.id}`],
        attempts: attempts.filter((a) => owners[a.id] === userId && a.courseId === course.id),
        submissions: submissions.filter((s) => s.userId === userId),
      };
      result.push({ enrollment, course, ctx, summary: summarizeCourse(ctx), lastActivityAt: ctx.progress?.updatedAt });
    }
    return result.sort((a, b) => (b.lastActivityAt ?? b.enrollment.enrolledAt).localeCompare(a.lastActivityAt ?? a.enrollment.enrolledAt));
  }, [userId, enrollments, courses, quizzes, assignments, submissions, progressMap, attempts, owners]);
}
