import { courseDurationSeconds } from "@/data/builders";
import { useDb } from "@/store/db.store";
import { api } from "./api-client";

export const DEFAULT_PAGE_SIZE = 9;

/**
 * Pure filter function — the explore page filters the cached catalogue
 * synchronously for instant results. The same rules run on the server for
 * GET /api/courses (used by `courseService.list`).
 */
export function applyCourseFilters(all, filters) {
  const {
    q,
    categories = [],
    levels = [],
    price = "all",
    duration = "all",
    minRating = 0,
    sort = "popular",
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE,
  } = filters;

  let list = all.filter((c) => c.status === "published");

  if (q?.trim()) {
    const needle = q.trim().toLowerCase();
    list = list.filter(
      (c) =>
        c.title.toLowerCase().includes(needle) || c.subtitle.toLowerCase().includes(needle) || c.skills.some((s) => s.toLowerCase().includes(needle)),
    );
  }
  if (categories.length) list = list.filter((c) => categories.includes(c.categoryId));
  if (levels.length) list = list.filter((c) => levels.includes(c.level));
  if (price !== "all") {
    list = list.filter((c) => {
      switch (price) {
        case "free":
          return c.price === 0;
        case "paid":
          return c.price > 0;
        case "under_2000":
          return c.price < 2000;
        case "2000_5000":
          return c.price >= 2000 && c.price <= 5000;
        case "above_5000":
          return c.price > 5000;
      }
    });
  }
  if (duration !== "all") {
    list = list.filter((c) => {
      const hours = courseDurationSeconds(c) / 3600;
      if (duration === "short") return hours < 3;
      if (duration === "medium") return hours >= 3 && hours <= 6;
      return hours > 6;
    });
  }
  if (minRating > 0) list = list.filter((c) => c.rating >= minRating);

  list = [...list].sort((a, b) => {
    switch (sort) {
      case "newest":
        return b.createdAt.localeCompare(a.createdAt);
      case "price_asc":
        return a.price - b.price;
      case "price_desc":
        return b.price - a.price;
      case "rating":
        return b.rating - a.rating || b.ratingCount - a.ratingCount;
      case "popular":
      default:
        return b.enrolledCount - a.enrolledCount;
    }
  });

  const total = list.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const items = list.slice((safePage - 1) * pageSize, safePage * pageSize);
  return { items, total, page: safePage, pageSize, totalPages };
}

export const courseService = {
  async list(filters = {}) {
    return api.get("/courses", {
      q: filters.q,
      categories: filters.categories,
      levels: filters.levels,
      price: filters.price,
      duration: filters.duration,
      minRating: filters.minRating,
      sort: filters.sort,
      page: filters.page,
      pageSize: filters.pageSize,
    });
  },

  async getBySlug(slug) {
    return api.get(`/courses/slug/${encodeURIComponent(slug)}`);
  },

  async getById(id) {
    return api.get(`/courses/${encodeURIComponent(id)}`);
  },

  async featured(limit = 4) {
    return api.get("/courses/featured", { limit });
  },

  async quizzesFor(courseId) {
    const { quizzes } = await api.get(`/courses/${encodeURIComponent(courseId)}/curriculum`);
    return quizzes;
  },

  /* ---------- Admin ---------- */

  async save(course) {
    const { course: saved } = await api.put(`/admin/courses/${encodeURIComponent(course.id)}`, course);
    useDb.getState().upsertCourse(saved);
    return saved;
  },

  async remove(courseId) {
    await api.delete(`/admin/courses/${encodeURIComponent(courseId)}`);
    const db = useDb.getState();
    db.deleteCourse(courseId);
    useDb.setState((s) => ({
      quizzes: s.quizzes.filter((q) => q.courseId !== courseId),
      assignments: s.assignments.filter((a) => a.courseId !== courseId),
    }));
  },

  async setStatus(courseId, status) {
    const { course } = await api.patch(`/admin/courses/${encodeURIComponent(courseId)}/status`, { status });
    useDb.getState().upsertCourse(course);
    return course;
  },

  async saveQuiz(quiz) {
    const { quiz: saved } = await api.put(`/admin/quizzes/${encodeURIComponent(quiz.id)}`, quiz);
    useDb.getState().upsertQuiz(saved);
    return saved;
  },

  async removeQuiz(quizId) {
    await api.delete(`/admin/quizzes/${encodeURIComponent(quizId)}`);
    useDb.getState().deleteQuiz(quizId);
  },
};
