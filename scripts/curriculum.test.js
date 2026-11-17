/* Pure-logic tests for the sequential unlock state machine. Run: npx tsx scripts/curriculum.test.ts */
import assert from "node:assert/strict";
import fixture from "./fixtures/fullstack-course.json";
import { computeLockStates, flattenCurriculum, summarizeCourse, hasReachedThreshold, canRetake } from "../src/lib/curriculum";

// Fixture: the seeded "Full Stack Web Development" course (same data the backend seeds).
const course = fixture.course;
const qs = fixture.quizzes;
const as = fixture.assignments;
const items = flattenCurriculum(course, qs, as);

function ctx(progress, attempts = []) {
  return { course, quizzes: qs, assignments: as, progress, attempts, submissions: [] };
}
function done(lessonId, dur = 100) {
  return { lessonId, maxPosition: dur, watchedSeconds: dur, lastPosition: dur, completed: true, updatedAt: "x" };
}
function attempt(quizId, score) {
  const q = qs.find((x) => x.id === quizId);
  return {
    id: quizId + score,
    quizId,
    courseId: course.id,
    startedAt: "x",
    submittedAt: "x",
    answers: {},
    correct: 0,
    total: q.questions.length,
    scorePercent: score,
    passed: score >= q.passingScore,
    timeTakenSeconds: 1,
  };
}

// 1. Fresh learner: only first lesson available, everything else locked.
let locks = computeLockStates(ctx());
assert.equal(locks.get(items[0].id), "available");
assert.ok(
  items.slice(1).every((i) => locks.get(i.id) === "locked"),
  "all later items locked",
);

// 2. Sequence order: lessons, then assignment, then quiz per module.
assert.deepEqual(
  items.slice(0, 4).map((i) => i.kind),
  ["lesson", "lesson", "lesson", "quiz"],
);
const m5 = items.filter((i) => i.moduleId === "crs_fullstack_m5").map((i) => i.kind);
assert.deepEqual(m5, ["lesson", "assignment"]);

// 3. Completing lessons 1-3 unlocks the module quiz, not the next module.
const l = course.modules[0].lessons;
const progress = {
  courseId: course.id,
  lessons: { [l[0].id]: done(l[0].id), [l[1].id]: done(l[1].id), [l[2].id]: done(l[2].id) },
  startedAt: "x",
  updatedAt: "x",
};
locks = computeLockStates(ctx(progress));
assert.equal(locks.get(course.modules[0].quizId), "available");
assert.equal(locks.get(course.modules[1].lessons[0].id), "locked");

// 4. Failing the quiz (65%) keeps the next module locked; passing (85%) unlocks it.
locks = computeLockStates(ctx(progress, [attempt(course.modules[0].quizId, 65)]));
assert.equal(locks.get(course.modules[0].quizId), "in_progress");
assert.equal(locks.get(course.modules[1].lessons[0].id), "locked");
locks = computeLockStates(ctx(progress, [attempt(course.modules[0].quizId, 65), attempt(course.modules[0].quizId, 85)]));
assert.equal(locks.get(course.modules[0].quizId), "completed");
assert.equal(locks.get(course.modules[1].lessons[0].id), "available");

// 5. Watch threshold.
assert.equal(hasReachedThreshold(89, 100), false);
assert.equal(hasReachedThreshold(90, 100), true);

// 6. Retake rules.
const quiz = qs[0];
assert.equal(canRetake(quiz, [attempt(quiz.id, 60)]), true);
assert.equal(canRetake(quiz, [attempt(quiz.id, 90)]), false);
assert.equal(canRetake({ ...quiz, maxAttempts: 1 }, [attempt(quiz.id, 60)]), false);

// 7. Certificate eligibility requires every item.
let summary = summarizeCourse(ctx(progress, [attempt(course.modules[0].quizId, 85)]));
assert.equal(summary.allRequirementsMet, false);
assert.equal(summary.completedModules, 1);
const all = {
  courseId: course.id,
  lessons: Object.fromEntries(items.filter((i) => i.kind === "lesson").map((i) => [i.id, done(i.id)])),
  startedAt: "x",
  updatedAt: "x",
};
const allAttempts = qs.map((q) => attempt(q.id, 80));
summary = summarizeCourse({
  ...ctx(all, allAttempts),
  submissions: [{ id: "s", assignmentId: as[0].id, userId: "u", status: "submitted", attempt: 1 }],
});
assert.equal(summary.allRequirementsMet, true);
assert.equal(summary.percent, 100);
assert.equal(summary.finalAssessmentScore, 80);
// Without the assignment submission it must not be eligible.
summary = summarizeCourse(ctx(all, allAttempts));
assert.equal(summary.allRequirementsMet, false);

console.log(`✓ curriculum state machine: ${items.length} items, all assertions passed`);
