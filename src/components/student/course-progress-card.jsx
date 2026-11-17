"use client";

import Image from "next/image";
import Link from "next/link";
import { Calendar, Layers, PlayCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useDb } from "@/store/db.store";
import { ROUTES } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export function resumeHref(sc) {
  const last = sc.summary.lastLessonId;
  return last ? `${ROUTES.student.learn(sc.course.id)}?item=${last}` : ROUTES.student.learn(sc.course.id);
}

export function CourseProgressCard({ sc, className }) {
  const { course, enrollment, summary } = sc;
  const instructor = useDb((s) => s.instructors.find((i) => i.id === course.instructorId));
  const lastLesson = course.modules.flatMap((m) => m.lessons).find((l) => l.id === summary.lastLessonId);
  const complete = summary.allRequirementsMet;
  return (
    <Card className={cn("flex flex-col sm:flex-row overflow-hidden", className)}>
      <Link href={resumeHref(sc)} className="relative sm:w-52 shrink-0 aspect-video sm:aspect-auto">
        <Image src={course.thumbnail} alt={course.title} fill loading="eager" className="object-cover object-left" sizes="208px" />
      </Link>
      <div className="flex-1 p-4 flex flex-col gap-2 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold leading-snug line-clamp-2">{course.title}</h3>
            <p className="text-xs text-muted-foreground">{instructor?.name}</p>
          </div>
          <Badge variant={complete ? "success" : "secondary"}>{complete ? "Completed" : "In progress"}</Badge>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" /> Enrolled {formatDate(enrollment.enrolledAt)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Layers className="h-3.5 w-3.5" /> {summary.completedModules}/{summary.totalModules} modules
          </span>
        </div>
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">
              {summary.completedLessons}/{summary.totalLessons} lessons
            </span>
            <span className="font-semibold">{summary.percent}%</span>
          </div>
          <Progress value={summary.percent} indicatorClassName={complete ? "bg-success" : undefined} />
        </div>
        <div className="mt-auto flex items-center justify-between gap-3 pt-1">
          <p className="text-xs text-muted-foreground truncate">{lastLesson ? `Last: ${lastLesson.title}` : "Not started yet"}</p>
          <Button asChild size="sm">
            <Link href={resumeHref(sc)}>
              <PlayCircle /> {complete ? "Review" : summary.lastLessonId ? "Continue" : "Start"}
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}
