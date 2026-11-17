import { serverGet } from "@/lib/server-api";
import { CourseDetail } from "@/components/course/course-detail";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const course = await serverGet(`/courses/slug/${encodeURIComponent(slug)}`);
  if (!course) return { title: "Course not found" };
  return {
    title: course.title,
    description: course.subtitle,
    openGraph: { title: course.title, description: course.subtitle, images: [{ url: course.thumbnail }] },
  };
}

export default async function CoursePage({ params }) {
  const { slug } = await params;
  return <CourseDetail slug={slug} />;
}
