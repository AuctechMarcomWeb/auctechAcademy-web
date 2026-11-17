export const SITE = {
  name: "Auctech Academy",
  shortName: "Auctech",
  tagline: "Learn. Practice. Intern. Get Certified.",
  domain: "certify.auctech.in",
  /** Public website (student frontend). Certificate QR codes point here. */
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://certify.auctech.in").replace(/\/$/, ""),
  supportEmail: "academy@auctech.in",
  phone: "+91 98765 43210",
  address: "Auctech, Tech Park Phase II, Hyderabad, Telangana 500081, India",
  description:
    "Auctech Academy is an online learning, internship and professional certification platform. Learn job-ready skills through structured courses, practical assignments and assessment-based certificates.",
};

/** Which app this build is: the student-facing "frontend" or the "admin" portal. */
export const APP_KIND = "frontend";

/** Admin portal URL (separate app). */
export const ADMIN_URL = (process.env.NEXT_PUBLIC_ADMIN_URL ?? "http://localhost:3001").replace(/\/$/, "");
/** Student website URL (separate app) — used by the admin app for "view on site" links. */
export const FRONTEND_URL = (process.env.NEXT_PUBLIC_FRONTEND_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

/** Link to a page of the public website from either app (absolute when used inside the admin app). */
export const siteHref = (path) => (APP_KIND === "frontend" ? path : `${FRONTEND_URL}${path}`);

/** Fraction of a lesson's video that must be watched before it counts as complete. */
export const WATCH_THRESHOLD = 0.9;

/** Seconds of forward tolerance allowed when a learner drags the scrubber. */
export const SEEK_TOLERANCE_SECONDS = 1.5;

export const GST_RATE = 0.18;

export const DEMO_ACCOUNTS = [
  { role: "student", email: "student@auctech.in", password: "password123" },
  { role: "admin", email: "admin@auctech.in", password: "password123" },
];

export const ROUTES = {
  home: "/",
  explore: "/explore",
  courses: "/courses",
  course: (slug) => `/courses/${slug}`,
  internships: "/internships",
  internship: (slug) => `/internships/${slug}`,
  certifications: "/certifications",
  about: "/about",
  contact: "/contact",
  pricing: "/pricing",
  login: "/login",
  register: "/register",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  authCallback: "/auth/callback",
  verify: "/verify",
  verifyCertificate: (id) => `/verify/${id}`,
  checkout: (courseId) => `/checkout/${courseId}`,
  student: {
    dashboard: "/student/dashboard",
    myCourses: "/student/my-courses",
    learn: (courseId) => `/student/learn/${courseId}`,
    internships: "/student/internships",
    progress: "/student/progress",
    quizzes: "/student/quizzes",
    assignments: "/student/assignments",
    certificates: "/student/certificates",
    payments: "/student/payments",
    profile: "/student/profile",
    settings: "/student/settings",
  },
  admin: {
    dashboard: "/admin/dashboard",
    courses: "/admin/courses",
    createCourse: "/admin/courses/create",
    editCourse: (id) => `/admin/courses/${id}`,
    categories: "/admin/categories",
    modules: "/admin/modules",
    lessons: "/admin/lessons",
    videos: "/admin/videos",
    students: "/admin/students",
    enrollments: "/admin/enrollments",
    orders: "/admin/orders",
    quizzes: "/admin/quizzes",
    assignments: "/admin/assignments",
    internships: "/admin/internships",
    certificates: "/admin/certificates",
    analytics: "/admin/analytics",
    settings: "/admin/settings",
  },
};
