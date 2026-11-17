"use client";

import Image from "next/image";
import Link from "next/link";
import { Award, CheckCircle2, Clock, Globe, Layers, ListChecks, PlayCircle, ShieldCheck, Signal, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RatingStars } from "@/components/shared/rating-stars";
import { EmptyState } from "@/components/shared/empty-state";
import { CurriculumAccordion } from "./curriculum-accordion";
import { InstructorCard } from "./instructor-card";
import { FaqAccordion } from "./faq-accordion";
import { useDb } from "@/store/db.store";
import { useAuth } from "@/store/auth.store";
import { useHydrated } from "@/hooks/use-hydrated";
import { courseDiscountPercent, courseDurationSeconds, courseLessonCount } from "@/data/builders";
import { formatDuration, formatINR } from "@/lib/format";
import { ROUTES, SITE } from "@/lib/constants";
import { PageSkeleton } from "@/components/shared/loading";

export function CourseDetail({ slug }) {
  const course = useDb((s) => s.courses.find((c) => c.slug === slug));
  const instructor = useDb((s) => s.instructors.find((i) => i.id === course?.instructorId));
  const category = useDb((s) => s.categories.find((c) => c.id === course?.categoryId));
  const userId = useAuth((s) => s.userId);
  const enrolled = useDb((s) =>
    Boolean(userId && course && s.enrollments.some((e) => e.userId === userId && e.courseId === course.id && e.status !== "refunded")),
  );
  const hydrated = useHydrated();
  const catalogReady = useDb((s) => s.hydrated);

  if (!course && !catalogReady) return <PageSkeleton />;
  if (!course || course.status !== "published") {
    return (
      <div className="container-x py-16">
        <EmptyState
          title="Course not available"
          description="This course is not published or does not exist."
          action={
            <Button asChild>
              <Link href={ROUTES.explore}>Browse courses</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const discount = courseDiscountPercent(course);
  const duration = courseDurationSeconds(course);
  const lessons = courseLessonCount(course);
  const quizCount = course.modules.filter((m) => m.quizId).length;
  const checkoutHref = ROUTES.checkout(course.id);
  const buyHref = hydrated && userId ? checkoutHref : `${ROUTES.login}?next=${encodeURIComponent(checkoutHref)}`;

  const purchaseCard = (
    <Card className="overflow-hidden">
      <div className="relative aspect-video">
        <Image src={course.thumbnail} alt={course.title} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 380px" priority />
      </div>
      <div className="p-5 space-y-4">
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-bold text-primary">{formatINR(course.price)}</span>
          {discount > 0 && (
            <>
              <span className="text-base text-muted-foreground line-through">{formatINR(course.originalPrice)}</span>
              <Badge variant="accent">{discount}% off</Badge>
            </>
          )}
        </div>
        <p className="text-xs text-muted-foreground">Price includes 18% GST. Lifetime access.</p>
        {hydrated && enrolled ? (
          <Button asChild size="lg" className="w-full" variant="success">
            <Link href={ROUTES.student.learn(course.id)}>
              <PlayCircle /> Continue learning
            </Link>
          </Button>
        ) : (
          <Button asChild size="lg" className="w-full" variant="accent">
            <Link href={buyHref}>Buy now</Link>
          </Button>
        )}
        <ul className="space-y-2 text-sm">
          <li className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-secondary" /> {formatDuration(duration)} of video
          </li>
          <li className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-secondary" /> {course.modules.length} modules · {lessons} lessons
          </li>
          <li className="flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-secondary" /> {quizCount} graded quizzes
          </li>
          <li className="flex items-center gap-2">
            <Signal className="h-4 w-4 text-secondary" /> {course.level} level
          </li>
          <li className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-secondary" /> {course.language}
          </li>
          <li className="flex items-center gap-2">
            <Award className="h-4 w-4 text-secondary" /> Verifiable certificate
          </li>
        </ul>
      </div>
    </Card>
  );

  return (
    <div>
      <section className="bg-primary text-white">
        <div className="container-x py-10 lg:py-14 lg:min-h-[300px] grid gap-8 lg:grid-cols-[1fr_380px]">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Link
                href={`${ROUTES.explore}?categories=${course.categoryId}`}
                className="rounded-full bg-white/10 px-2.5 py-1 font-medium hover:bg-white/20"
              >
                {category?.name}
              </Link>
              <span className="rounded-full bg-white/10 px-2.5 py-1 font-medium">{course.level}</span>
            </div>
            <h1 className="mt-4 text-3xl sm:text-4xl font-bold text-white text-balance">{course.title}</h1>
            <p className="mt-3 text-lg text-slate-300 max-w-2xl">{course.subtitle}</p>
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-300">
              <RatingStars rating={course.rating} count={course.ratingCount} className="[&_span:first-child]:text-accent" />
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-4 w-4" /> {course.enrolledCount.toLocaleString("en-IN")} enrolled
              </span>
              {instructor && (
                <span>
                  Taught by <span className="font-medium text-white">{instructor.name}</span>
                </span>
              )}
            </div>
          </div>
          <div className="hidden lg:block" />
        </div>
      </section>

      <div className="container-x py-8 lg:py-10 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-10 min-w-0">
          <div className="lg:hidden">{purchaseCard}</div>

          <section>
            <h2 className="text-xl font-semibold mb-4">What you&apos;ll learn</h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {course.outcomes.map((o) => (
                <li key={o} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" /> {o}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">About this course</h2>
            <p className="text-muted-foreground leading-relaxed">{course.description}</p>
          </section>

          <section className="grid gap-6 sm:grid-cols-2">
            <div>
              <h3 className="font-semibold mb-3">Skills you&apos;ll gain</h3>
              <div className="flex flex-wrap gap-2">
                {course.skills.map((s) => (
                  <Badge key={s} variant="secondary">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Prerequisites</h3>
              <ul className="space-y-1.5 text-sm text-muted-foreground list-disc pl-5">
                {course.prerequisites.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-1">Curriculum</h2>
            <p className="text-sm text-muted-foreground mb-4">
              {course.modules.length} modules · {lessons} lessons · {formatDuration(duration)}. Lessons unlock in order; preview lessons are open to
              everyone.
            </p>
            <CurriculumAccordion course={course} unlocked={hydrated && enrolled} />
          </section>

          <section className="rounded-xl border border-secondary/20 bg-secondary/5 p-5 flex gap-4">
            <ShieldCheck className="h-8 w-8 text-secondary shrink-0" />
            <div>
              <h3 className="font-semibold">Assessment-based certificate</h3>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                A certificate is issued only after you complete every lesson, pass each module quiz and the final assessment, and submit any required
                assignment. Each certificate carries a unique ID in the format{" "}
                <code className="font-mono text-xs bg-card px-1 py-0.5 rounded border border-border">AUC-{course.certificateCode}-YYYY-000000</code>{" "}
                and a QR code that resolves to{" "}
                <Link href={ROUTES.verify} className="text-secondary hover:underline">
                  {SITE.domain}/verify
                </Link>{" "}
                for public verification.
              </p>
            </div>
          </section>

          {instructor && (
            <section>
              <h2 className="text-xl font-semibold mb-4">Your instructor</h2>
              <InstructorCard instructor={instructor} />
            </section>
          )}

          <section>
            <h2 className="text-xl font-semibold mb-2">Frequently asked questions</h2>
            <FaqAccordion items={course.faqs} />
          </section>
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-24 -mt-[232px]">{purchaseCard}</div>
        </aside>
      </div>
    </div>
  );
}
