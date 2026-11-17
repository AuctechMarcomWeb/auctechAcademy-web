"use client";

import Image from "next/image";
import Link from "next/link";
import { Clock, Layers, Signal } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RatingStars } from "@/components/shared/rating-stars";
import { useDb } from "@/store/db.store";
import { courseDiscountPercent, courseDurationSeconds, courseLessonCount } from "@/data/builders";
import { formatDuration, formatINR } from "@/lib/format";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function CourseCard({ course, layout = "grid", className }) {
  const instructor = useDb((s) => s.instructors.find((i) => i.id === course.instructorId));
  const category = useDb((s) => s.categories.find((c) => c.id === course.categoryId));
  const discount = courseDiscountPercent(course);
  const duration = courseDurationSeconds(course);
  const href = ROUTES.course(course.slug);

  if (layout === "list") {
    return (
      <Card className={cn("flex flex-col sm:flex-row overflow-hidden transition-shadow hover:shadow-card-hover", className)}>
        <Link href={href} className="relative sm:w-64 shrink-0 aspect-video sm:aspect-auto">
          <Image src={course.thumbnail} alt={course.title} fill loading="eager" className="object-cover" sizes="(max-width: 640px) 100vw, 256px" />
          {discount > 0 && (
            <Badge variant="accent" className="absolute left-3 top-3">
              {discount}% off
            </Badge>
          )}
        </Link>
        <div className="flex flex-1 flex-col p-4 sm:p-5 gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium text-secondary">{category?.name}</p>
              <Link href={href} className="block">
                <h3 className="text-lg font-semibold leading-snug hover:text-secondary line-clamp-2">{course.title}</h3>
              </Link>
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{course.subtitle}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-lg font-bold text-primary">{formatINR(course.price)}</p>
              {discount > 0 && <p className="text-xs text-muted-foreground line-through">{formatINR(course.originalPrice)}</p>}
            </div>
          </div>
          <p className="text-sm text-muted-foreground">By {instructor?.name}</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Layers className="h-3.5 w-3.5" /> {course.modules.length} modules · {courseLessonCount(course)} lessons
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> {formatDuration(duration)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Signal className="h-3.5 w-3.5" /> {course.level}
            </span>
          </div>
          <div className="mt-auto flex items-center justify-between gap-3 pt-1">
            <RatingStars rating={course.rating} count={course.ratingCount} />
            <Button asChild size="sm">
              <Link href={href}>View Course</Link>
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn("group flex flex-col overflow-hidden transition-all hover:shadow-card-hover hover:-translate-y-0.5", className)}>
      <Link href={href} className="relative block aspect-video overflow-hidden">
        <Image
          src={course.thumbnail}
          alt={course.title}
          fill
          loading="eager"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div className="absolute left-3 top-3 flex gap-2">
          <Badge variant="outline" className="bg-white/90 backdrop-blur border-transparent text-foreground">
            {course.level}
          </Badge>
          {discount > 0 && (
            <Badge variant="accent" className="bg-accent text-accent-foreground">
              {discount}% off
            </Badge>
          )}
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-4 gap-2">
        <p className="text-xs font-medium text-secondary">{category?.name}</p>
        <Link href={href}>
          <h3 className="font-semibold leading-snug line-clamp-2 min-h-[2.6em] hover:text-secondary">{course.title}</h3>
        </Link>
        <p className="text-sm text-muted-foreground line-clamp-2">{course.subtitle}</p>
        <p className="text-xs text-muted-foreground">{instructor?.name}</p>
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
          <span className="inline-flex items-center gap-1">
            <Layers className="h-3.5 w-3.5" /> {course.modules.length} modules
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> {formatDuration(duration)}
          </span>
        </div>
        <RatingStars rating={course.rating} count={course.ratingCount} size="xs" />
        <div className="mt-auto flex items-center justify-between pt-3 border-t border-border">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-primary">{formatINR(course.price)}</span>
            {discount > 0 && <span className="text-xs text-muted-foreground line-through">{formatINR(course.originalPrice)}</span>}
          </div>
          <Button asChild size="sm" variant="outline">
            <Link href={href}>Explore</Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}
