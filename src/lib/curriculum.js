import { WATCH_THRESHOLD } from "./constants";

export function flattenCurriculum(course, quizzes, assignments) {
  const items = [];
  let index = 0;
  for (const mod of [...course.modules].sort((a, b) => a.order - b.order)) {
    for (const lesson of [...mod.lessons].sort((a, b) => a.order - b.order)) {
      items.push({ kind: "lesson", id: lesson.id, moduleId: mod.id, lesson, index: index++ });
    }
    if (mod.assignmentId) {
      const assignment = assignments.find((a) => a.id === mod.assignmentId);
      if (assignment) items.push({ kind: "assignment", id: assignment.id, moduleId: mod.id, assignment, index: index++ });
    }
    if (mod.quizId) {
      const quiz = quizzes.find((q) => q.id === mod.quizId);
      if (quiz) items.push({ kind: "quiz", id: quiz.id, moduleId: mod.id, quiz, index: index++ });
    }
  }
  return items;
}

export function isLessonComplete(lesson, progress) {
  const lp = progress?.lessons[lesson.id];
  return Boolean(lp?.completed);
}

export function lessonWatchPercent(lesson, progress, actualDuration) {
  const lp = progress?.lessons[lesson.id];
  if (!lp) return 0;
  const duration = actualDuration || lesson.durationSeconds || 1;
  return Math.min(100, Math.round((lp.maxPosition / duration) * 100));
}

export function hasReachedThreshold(maxPosition, duration) {
  if (!duration) return false;
  return maxPosition / duration >= WATCH_THRESHOLD;
}

export function bestAttempt(quizId, attempts) {
  return attempts.filter((a) => a.quizId === quizId).sort((a, b) => b.scorePercent - a.scorePercent)[0];
}

export function isQuizPassed(quizId, attempts) {
  return attempts.some((a) => a.quizId === quizId && a.passed);
}

export function attemptsUsed(quizId, attempts) {
  return attempts.filter((a) => a.quizId === quizId).length;
}

export function canRetake(quiz, attempts) {
  if (isQuizPassed(quiz.id, attempts)) return false;
  if (quiz.maxAttempts === undefined) return true;
  return attemptsUsed(quiz.id, attempts) < quiz.maxAttempts;
}

/** An assignment counts as complete once it has been submitted (approval is reviewed asynchronously). */
export function isAssignmentComplete(assignmentId, submissions) {
  return submissions.some((s) => s.assignmentId === assignmentId && s.status !== "pending" && s.status !== "rejected");
}

export function isItemComplete(item, ctx) {
  switch (item.kind) {
    case "lesson":
      return isLessonComplete(item.lesson, ctx.progress);
    case "quiz":
      return isQuizPassed(item.quiz.id, ctx.attempts);
    case "assignment":
      return isAssignmentComplete(item.assignment.id, ctx.submissions);
  }
}

export function computeLockStates(ctx) {
  const items = flattenCurriculum(ctx.course, ctx.quizzes, ctx.assignments);
  const states = new Map();
  let previousComplete = true;
  for (const item of items) {
    const complete = isItemComplete(item, ctx);
    if (complete) {
      states.set(item.id, "completed");
    } else if (previousComplete) {
      const started =
        item.kind === "lesson"
          ? (ctx.progress?.lessons[item.lesson.id]?.maxPosition ?? 0) > 0
          : item.kind === "quiz"
            ? attemptsUsed(item.quiz.id, ctx.attempts) > 0
            : false;
      states.set(item.id, started ? "in_progress" : "available");
    } else {
      states.set(item.id, "locked");
    }
    previousComplete = previousComplete && complete;
  }
  return states;
}

export function firstAvailableItem(ctx) {
  const items = flattenCurriculum(ctx.course, ctx.quizzes, ctx.assignments);
  const states = computeLockStates(ctx);
  return items.find((i) => states.get(i.id) === "available" || states.get(i.id) === "in_progress") ?? items[items.length - 1];
}

export function nextItem(items, currentId) {
  const idx = items.findIndex((i) => i.id === currentId);
  return idx >= 0 ? items[idx + 1] : undefined;
}

export function previousItem(items, currentId) {
  const idx = items.findIndex((i) => i.id === currentId);
  return idx > 0 ? items[idx - 1] : undefined;
}

export function summarizeCourse(ctx) {
  const { course, quizzes, assignments, progress, attempts, submissions } = ctx;
  const items = flattenCurriculum(course, quizzes, assignments);
  const lessons = items.filter((i) => i.kind === "lesson");
  const quizItems = items.filter((i) => i.kind === "quiz");
  const assignmentItems = items.filter((i) => i.kind === "assignment");

  const completedLessons = lessons.filter((l) => isItemComplete(l, ctx)).length;
  const passedQuizzes = quizItems.filter((q) => isItemComplete(q, ctx)).length;
  const attemptedQuizzes = quizItems.filter((q) => attemptsUsed(q.id, attempts) > 0).length;
  const submittedAssignments = assignmentItems.filter((a) => isItemComplete(a, ctx)).length;

  const bestScores = quizItems.map((q) => bestAttempt(q.id, attempts)?.scorePercent).filter((s) => typeof s === "number");
  const averageQuizScore = bestScores.length ? Math.round(bestScores.reduce((a, b) => a + b, 0) / bestScores.length) : 0;

  const completedModules = course.modules.filter((m) => items.filter((i) => i.moduleId === m.id).every((i) => isItemComplete(i, ctx))).length;

  const totalVideoSeconds = lessons.reduce((acc, l) => acc + (l.kind === "lesson" ? l.lesson.durationSeconds : 0), 0);
  const watchedSeconds = Object.values(progress?.lessons ?? {}).reduce((acc, lp) => acc + lp.watchedSeconds, 0);

  const completedItems = items.filter((i) => isItemComplete(i, ctx)).length;
  const percent = items.length ? Math.round((completedItems / items.length) * 100) : 0;

  const finalModule = course.modules.find((m) => m.isFinalAssessment);
  const finalQuiz = finalModule?.quizId ? bestAttempt(finalModule.quizId, attempts) : undefined;

  return {
    totalLessons: lessons.length,
    completedLessons,
    totalQuizzes: quizItems.length,
    passedQuizzes,
    attemptedQuizzes,
    averageQuizScore,
    totalAssignments: assignmentItems.length,
    submittedAssignments,
    totalModules: course.modules.length,
    completedModules,
    totalVideoSeconds,
    watchedSeconds,
    percent,
    finalAssessmentScore: finalQuiz?.scorePercent,
    allRequirementsMet: items.length > 0 && completedItems === items.length,
    lastLessonId: progress?.lastLessonId,
  };
}

export function gradeFromScore(score) {
  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  return "D";
}
