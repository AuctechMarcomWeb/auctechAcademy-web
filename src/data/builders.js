/**
 * Publicly hosted sample clips (Google's open test bucket). They are short so
 * that sequential unlocking can be exercised quickly in the demo. Replace with
 * signed CDN URLs from the backend in production.
 */
export const SAMPLE_VIDEOS = [
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",
];

let videoCursor = 0;
function nextVideo() {
  const url = SAMPLE_VIDEOS[videoCursor % SAMPLE_VIDEOS.length];
  videoCursor += 1;
  return url;
}

const GENERIC_QUESTIONS = [
  [
    "Which statement best describes the purpose of this module?",
    [
      "To introduce the core concepts covered in the lessons",
      "To replace the final assessment",
      "To cover unrelated material",
      "To test typing speed",
    ],
    0,
    "Module quizzes check understanding of the lessons you just completed.",
  ],
  [
    "What should you do if a concept from the videos is unclear?",
    ["Skip ahead to the next module", "Rewatch the lesson and review the resources", "Guess on the quiz", "Ignore it"],
    1,
  ],
  [
    "Assessment-based certification means a certificate is issued when…",
    ["You purchase the course", "You watch the first lesson", "You complete all lessons and pass every required assessment", "You log in daily"],
    2,
  ],
  [
    "Which of the following is a good study practice recommended in this course?",
    ["Taking notes while watching", "Watching at 5x speed only", "Never revisiting content", "Skipping assignments"],
    0,
  ],
  [
    "Where can you download lesson attachments?",
    ["From the Resources panel of the lesson", "Only by emailing support", "They are not available", "From the certificate page"],
    0,
  ],
];

export function buildQuiz(courseId, moduleId, title, spec) {
  const qspecs = spec?.questions?.length ? spec.questions : GENERIC_QUESTIONS;
  const questions = qspecs.map(([prompt, options, correctIndex, explanation], qi) => {
    const opts = options.map((text, oi) => ({ id: `${moduleId}_q${qi + 1}_o${oi + 1}`, text }));
    return {
      id: `${moduleId}_q${qi + 1}`,
      prompt,
      options: opts,
      correctOptionId: opts[correctIndex].id,
      explanation,
    };
  });
  return {
    id: `${moduleId}_quiz`,
    courseId,
    moduleId,
    title,
    description: `Check your understanding of ${title.replace(/ Quiz$/, "")}. You need ${spec?.passingScore ?? 70}% to pass.`,
    passingScore: spec?.passingScore ?? 70,
    timeLimitSeconds: spec?.timeLimitMinutes ? spec.timeLimitMinutes * 60 : undefined,
    questions,
  };
}

export function buildCourse(spec) {
  const quizzes = [];
  const assignments = [];
  const modules = spec.modules.map((m, mi) => {
    const moduleId = `${spec.id}_m${mi + 1}`;
    const lessons = m.lessons.map((l, li) => {
      const ls = typeof l === "string" ? { title: l } : l;
      const minutes = ls.minutes ?? 8 + ((mi * 7 + li * 3) % 9);
      return {
        id: `${moduleId}_l${li + 1}`,
        moduleId,
        title: ls.title,
        description:
          ls.description ??
          `In this lesson you will work through ${ls.title.toLowerCase()} with a guided walkthrough, practical examples and a short recap you can refer back to later.`,
        videoUrl: nextVideo(),
        durationSeconds: minutes * 60,
        order: li + 1,
        isPreview: ls.preview ?? (mi === 0 && li === 0),
        resources: [
          { id: `${moduleId}_l${li + 1}_r1`, title: `${ls.title} — slides (PDF)`, type: "pdf", url: "#", size: "1.2 MB" },
          ...(li === 0 ? [{ id: `${moduleId}_l${li + 1}_r2`, title: "Starter files", type: "zip", url: "#", size: "340 KB" }] : []),
        ],
      };
    });

    let quizId;
    if (m.quiz) {
      const quiz = buildQuiz(spec.id, moduleId, `${m.title} Quiz`, typeof m.quiz === "object" ? m.quiz : undefined);
      quizzes.push(quiz);
      quizId = quiz.id;
    }
    let assignmentId;
    if (m.assignment) {
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + (m.assignment.deadlineDaysFromNow ?? 21));
      const a = {
        id: `${moduleId}_assignment`,
        courseId: spec.id,
        moduleId,
        title: m.assignment.title,
        instructions: m.assignment.instructions,
        deadline: deadline.toISOString(),
        maxMarks: m.assignment.maxMarks ?? 100,
        allowResubmission: true,
      };
      assignments.push(a);
      assignmentId = a.id;
    }
    return {
      id: moduleId,
      courseId: spec.id,
      title: m.title,
      description: m.description ?? `Build a solid foundation in ${m.title.toLowerCase()}.`,
      order: mi + 1,
      lessons,
      quizId,
      assignmentId,
      isFinalAssessment: m.isFinalAssessment,
    };
  });

  const course = {
    id: spec.id,
    slug: spec.slug,
    title: spec.title,
    subtitle: spec.subtitle,
    description: spec.description,
    categoryId: spec.categoryId,
    instructorId: spec.instructorId,
    thumbnail: `/thumbnails/${spec.slug}.svg`,
    level: spec.level,
    language: "English",
    price: spec.price,
    originalPrice: spec.originalPrice,
    rating: spec.rating,
    ratingCount: spec.ratingCount,
    enrolledCount: spec.enrolledCount,
    modules,
    outcomes: spec.outcomes,
    skills: spec.skills,
    prerequisites: spec.prerequisites,
    faqs: spec.faqs ?? [
      {
        question: "Do I get lifetime access?",
        answer: "Yes. Once enrolled you can revisit every lesson, quiz and resource for as long as the course is published.",
      },
      {
        question: "Is the certificate verifiable?",
        answer: "Every certificate carries a unique ID and QR code that resolves to a public verification page on certify.auctech.in.",
      },
      {
        question: "Can I skip ahead?",
        answer: "Lessons unlock sequentially. You need to watch each video and pass the module quiz before the next module opens.",
      },
    ],
    certificateCode: spec.certificateCode,
    status: spec.status ?? "published",
    isFeatured: spec.isFeatured,
    createdAt: spec.createdAt,
    updatedAt: spec.createdAt,
  };
  return { course, quizzes, assignments };
}

/* ---------- Derived course helpers (pure, reusable anywhere) ---------- */

export function courseLessons(course) {
  return course.modules.flatMap((m) => m.lessons);
}

export function courseLessonCount(course) {
  return courseLessons(course).length;
}

export function courseDurationSeconds(course) {
  return courseLessons(course).reduce((acc, l) => acc + l.durationSeconds, 0);
}

export function courseDiscountPercent(course) {
  if (!course.originalPrice || course.originalPrice <= course.price) return 0;
  return Math.round(((course.originalPrice - course.price) / course.originalPrice) * 100);
}
