"use client";

import * as React from "react";
import Link from "next/link";
import { use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Award, ListTree, PanelLeftClose, PanelLeftOpen, StickyNote } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/shared/logo";
import { Spinner } from "@/components/shared/loading";
import { EmptyState } from "@/components/shared/empty-state";
import { DemoBanner } from "@/components/shared/demo-banner";
import { LessonSidebar } from "@/components/learn/lesson-sidebar";
import { LessonContent } from "@/components/learn/lesson-content";
import { LockedOverlay } from "@/components/learn/locked-overlay";
import { NotesPanel } from "@/components/learn/notes-panel";
import { QuizRunner } from "@/components/learn/quiz-runner";
import { AssignmentPanel } from "@/components/learn/assignment-panel";
import { CompletionReport } from "@/components/learn/completion-report";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useHydrated } from "@/hooks/use-hydrated";
import { useCourseContext } from "@/hooks/use-course-context";
import { useDb } from "@/store/db.store";
import { learningService } from "@/services/learning.service";
import { syncService } from "@/services/sync.service";
import { ApiError } from "@/services/api-client";
import { firstAvailableItem, nextItem, previousItem } from "@/lib/curriculum";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export default function CoursePlayerPage({ params }) {
  const { courseId } = use(params);
  return (
    <React.Suspense fallback={<Spinner label="Loading course…" />}>
      <CoursePlayer courseId={courseId} />
    </React.Suspense>
  );
}

function CoursePlayer({ courseId }) {
  const router = useRouter();
  const search = useSearchParams();
  const hydrated = useHydrated();
  const user = useCurrentUser();
  const course = useDb((s) => s.courses.find((c) => c.id === courseId));
  const enrolled = useDb((s) =>
    Boolean(user && s.enrollments.some((e) => e.userId === user.id && e.courseId === courseId && e.status !== "refunded")),
  );
  const submissions = useDb((s) => s.assignmentSubmissions);
  const data = useCourseContext(user?.id, course);

  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [mobileCurriculum, setMobileCurriculum] = React.useState(false);
  const [reportOpen, setReportOpen] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);

  const requestedId = search.get("item");
  const items = React.useMemo(() => data?.items ?? [], [data]);
  const current = React.useMemo(() => {
    if (!data) return undefined;
    const found = requestedId ? items.find((i) => i.id === requestedId) : undefined;
    return found ?? firstAvailableItem(data.ctx);
  }, [data, items, requestedId]);

  const go = React.useCallback(
    (item) => {
      router.replace(`${ROUTES.student.learn(courseId)}?item=${item.id}`, { scroll: false });
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [router, courseId],
  );

  // Track the last opened lesson and make sure a progress record exists.
  React.useEffect(() => {
    if (!user || !course || !enrolled) return;
    if (current?.kind === "lesson") learningService.setLastLesson(user.id, course.id, current.lesson.id);
  }, [user, course, current, enrolled]);

  // Enrolled, but the cached course still has its videos hidden (bought or granted elsewhere): reload once.
  const needsContent = Boolean(enrolled && course?.modules.some((m) => m.lessons.some((l) => !l.videoUrl && !l.isPreview)));
  React.useEffect(() => {
    if (needsContent) syncService.refresh();
  }, [needsContent]);

  // Send any buffered playback before leaving the player.
  React.useEffect(() => () => void learningService.flushPlayback(courseId), [courseId]);

  if (!hydrated || !user) return <Spinner label="Loading course…" />;
  if (!course || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <EmptyState
          title="Course not found"
          description="This course does not exist or is no longer published."
          action={
            <Button asChild>
              <Link href={ROUTES.student.myCourses}>Back to my courses</Link>
            </Button>
          }
        />
      </div>
    );
  }
  if (!enrolled) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <EmptyState
          title="You are not enrolled in this course"
          description="Purchase the course to unlock the full curriculum. Access is granted only after your payment is verified."
          action={
            <Button asChild>
              <Link href={ROUTES.course(course.slug)}>View course</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const { ctx, locks, summary } = data;
  const currentState = current ? (locks.get(current.id) ?? "locked") : "locked";
  const prev = current ? previousItem(items, current.id) : undefined;
  const next = current ? nextItem(items, current.id) : undefined;
  const nextLocked = next ? locks.get(next.id) === "locked" : true;
  const lessonTitleById = Object.fromEntries(course.modules.flatMap((m) => m.lessons.map((l) => [l.id, l.title])));
  const currentModule = current ? course.modules.find((m) => m.id === current.moduleId) : undefined;

  const handleNavigate = (item) => {
    if (locks.get(item.id) === "locked") {
      toast.info("That step is still locked.");
      return;
    }
    go(item);
  };

  const renderMain = () => {
    if (!current) return <EmptyState title="Nothing to show" description="This course has no curriculum yet." />;
    if (currentState === "locked") return <LockedOverlay item={current} previous={prev} />;
    if (current.kind === "lesson") {
      return (
        <LessonContent
          key={current.lesson.id}
          lesson={current.lesson}
          progress={ctx.progress?.lessons[current.lesson.id]}
          prev={prev}
          next={next}
          nextLocked={nextLocked}
          onPlayback={(e) => learningService.recordPlayback(user.id, course.id, current.lesson.id, e)}
          onTimeChange={setCurrentTime}
          onMarkComplete={async () => {
            try {
              await learningService.completeLesson(user.id, course.id, current.lesson.id, current.lesson.title);
              toast.success("Lesson marked as completed");
            } catch (e) {
              toast.error(e instanceof ApiError ? e.message : "Could not mark the lesson as completed");
            }
          }}
          onNavigate={handleNavigate}
        />
      );
    }
    if (current.kind === "quiz") {
      return (
        <QuizRunner
          key={current.quiz.id}
          userId={user.id}
          quiz={current.quiz}
          attempts={ctx.attempts}
          locked={false}
          hasNext={Boolean(next)}
          onContinue={() => next && handleNavigate(next)}
        />
      );
    }
    return (
      <AssignmentPanel
        userId={user.id}
        assignment={current.assignment}
        submission={submissions.find((s) => s.assignmentId === current.assignment.id && s.userId === user.id)}
        courseTitle={course.title}
        moduleTitle={currentModule?.title}
      />
    );
  };

  const rightPanel = (
    <div className="space-y-4">
      <Card className="p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Course progress</p>
        <div className="mt-2 flex items-center gap-3">
          <div className="relative h-14 w-14 shrink-0">
            <svg viewBox="0 0 36 36" className="h-14 w-14 -rotate-90">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--muted)" strokeWidth="3" />
              <circle
                cx="18"
                cy="18"
                r="15.5"
                fill="none"
                stroke={summary.allRequirementsMet ? "var(--success)" : "var(--secondary)"}
                strokeWidth="3"
                strokeDasharray={`${summary.percent} 100`}
                strokeLinecap="round"
                pathLength={100}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">{summary.percent}%</span>
          </div>
          <div className="text-xs text-muted-foreground space-y-0.5">
            <p>
              {summary.completedLessons}/{summary.totalLessons} lessons
            </p>
            <p>
              {summary.passedQuizzes}/{summary.totalQuizzes} quizzes passed
            </p>
            <p>
              {summary.submittedAssignments}/{summary.totalAssignments} assignments
            </p>
          </div>
        </div>
        {summary.allRequirementsMet && (
          <Button data-testid="complete-course" className="mt-3 w-full" variant="accent" onClick={() => setReportOpen(true)}>
            <Award /> Course complete — report & certificate
          </Button>
        )}
      </Card>
      {current && (
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Current step</p>
          <p className="mt-1 text-sm font-medium leading-snug">
            {current.kind === "lesson" ? current.lesson.title : current.kind === "quiz" ? current.quiz.title : current.assignment.title}
          </p>
          <Badge className="mt-2" variant={currentState === "completed" ? "success" : currentState === "locked" ? "muted" : "secondary"}>
            {currentState.replace("_", " ")}
          </Badge>
        </Card>
      )}
      <Card className="p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 inline-flex items-center gap-1">
          <StickyNote className="h-3.5 w-3.5" /> Notes
        </p>
        <NotesPanel
          userId={user.id}
          courseId={course.id}
          lessonId={current?.kind === "lesson" ? current.lesson.id : undefined}
          lessonTitleById={lessonTitleById}
          currentTime={current?.kind === "lesson" ? currentTime : undefined}
        />
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DemoBanner compact />
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-white/95 backdrop-blur px-3 sm:px-4">
        <Button variant="ghost" size="icon-sm" asChild aria-label="Back to dashboard">
          <Link href={ROUTES.student.myCourses}>
            <ArrowLeft />
          </Link>
        </Button>
        <Logo size="sm" withWordmark={false} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold leading-tight">{course.title}</p>
          <div className="hidden sm:flex items-center gap-2">
            <Progress value={summary.percent} className="h-1 w-40" indicatorClassName={summary.allRequirementsMet ? "bg-success" : undefined} />
            <span className="text-[11px] text-muted-foreground">{summary.percent}% complete</span>
          </div>
        </div>
        <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setMobileCurriculum(true)}>
          <ListTree /> Curriculum
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          className="hidden lg:inline-flex"
          onClick={() => setSidebarOpen((o) => !o)}
          aria-label={sidebarOpen ? "Hide curriculum" : "Show curriculum"}
        >
          {sidebarOpen ? <PanelLeftClose /> : <PanelLeftOpen />}
        </Button>
      </header>

      <div className="flex flex-1">
        <aside
          className={cn(
            "hidden lg:block w-80 shrink-0 border-r border-border bg-card overflow-y-auto scrollbar-thin sticky top-14 h-[calc(100vh-3.5rem)]",
            !sidebarOpen && "lg:hidden",
          )}
        >
          <div className="px-4 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Curriculum</p>
          </div>
          <LessonSidebar course={course} items={items} locks={locks} currentId={current?.id} onSelect={go} />
        </aside>

        <Sheet open={mobileCurriculum} onOpenChange={setMobileCurriculum}>
          <SheetContent side="left" className="p-0 max-w-sm">
            <SheetTitle className="px-4 pt-4 text-sm font-semibold">Curriculum</SheetTitle>
            <div className="overflow-y-auto flex-1">
              <LessonSidebar
                course={course}
                items={items}
                locks={locks}
                currentId={current?.id}
                onSelect={(i) => {
                  setMobileCurriculum(false);
                  go(i);
                }}
              />
            </div>
          </SheetContent>
        </Sheet>

        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
            <div className="min-w-0">{renderMain()}</div>
            <div className="hidden xl:block">{rightPanel}</div>
            <div className="xl:hidden">
              <Tabs defaultValue="progress">
                <TabsList>
                  <TabsTrigger value="progress">Progress & notes</TabsTrigger>
                  <TabsTrigger value="curriculum" className="lg:hidden">
                    Curriculum
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="progress">{rightPanel}</TabsContent>
                <TabsContent value="curriculum" className="lg:hidden">
                  <Card className="overflow-hidden">
                    <LessonSidebar course={course} items={items} locks={locks} currentId={current?.id} onSelect={go} />
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </main>
      </div>

      <CompletionReport
        open={reportOpen}
        onOpenChange={setReportOpen}
        userId={user.id}
        studentName={user.name}
        course={course}
        ctx={ctx}
        summary={summary}
      />
    </div>
  );
}
