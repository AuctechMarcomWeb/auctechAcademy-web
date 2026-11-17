"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, CalendarClock, CheckCircle2, Clock, GraduationCap, MapPin, Target, UserRound, Users, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { UserAvatar } from "@/components/shared/user-avatar";
import { InternshipApplicationForm } from "./internship-application-form";
import { stipendLabel } from "./internship-card";
import { useDb } from "@/store/db.store";
import { useAuth } from "@/store/auth.store";
import { useHydrated } from "@/hooks/use-hydrated";
import { useCurrentUser } from "@/hooks/use-current-user";
import { formatDate } from "@/lib/format";
import { ROUTES } from "@/lib/constants";
import { PageSkeleton } from "@/components/shared/loading";

function useCountdown(iso) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);
  const diff = new Date(iso).getTime() - now;
  if (diff <= 0) return "Closed";
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  return days > 0 ? `${days}d ${hours}h left` : `${hours}h left`;
}

export function InternshipDetail({ slug }) {
  const internship = useDb((s) => s.internships.find((i) => i.slug === slug));
  const userId = useAuth((s) => s.userId);
  const user = useCurrentUser();
  const hydrated = useHydrated();
  const catalogReady = useDb((s) => s.hydrated);
  const existing = useDb((s) =>
    userId && internship ? s.internshipApplications.find((a) => a.userId === userId && a.internshipId === internship.id) : undefined,
  );
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const countdown = useCountdown(internship?.applicationDeadline ?? new Date().toISOString());

  if (!internship && !catalogReady) return <PageSkeleton />;
  if (!internship) {
    return (
      <div className="container-x py-16">
        <EmptyState
          title="Internship not found"
          action={
            <Button asChild>
              <Link href={ROUTES.internships}>All internships</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const closed = internship.status !== "open" || new Date(internship.applicationDeadline) < new Date();
  const path = ROUTES.internship(internship.slug);

  const apply = () => {
    if (!userId) {
      router.push(`${ROUTES.login}?next=${encodeURIComponent(path)}`);
      return;
    }
    if (user?.role !== "student") return;
    setOpen(true);
  };

  const applyCard = (
    <Card className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <Badge variant={closed ? "muted" : "success"}>{closed ? "Applications closed" : "Accepting applications"}</Badge>
        {!closed && <span className="text-xs font-medium text-amber-700">{countdown}</span>}
      </div>
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-xs text-muted-foreground">Duration</dt>
          <dd className="font-medium">{internship.durationWeeks} weeks</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Work mode</dt>
          <dd className="font-medium">{internship.workMode}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Stipend</dt>
          <dd className="font-medium">{stipendLabel(internship)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Openings</dt>
          <dd className="font-medium">{internship.openings}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Deadline</dt>
          <dd className="font-medium">{formatDate(internship.applicationDeadline)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Starts</dt>
          <dd className="font-medium">{formatDate(internship.startDate)}</dd>
        </div>
      </dl>
      {hydrated && existing ? (
        <div className="rounded-md bg-secondary/5 border border-secondary/20 p-3 text-sm">
          <p className="font-medium flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-success" /> You applied on {formatDate(existing.appliedAt)}
          </p>
          <Button asChild variant="link" className="px-0 h-auto mt-1">
            <Link href={ROUTES.student.internships}>Track your application</Link>
          </Button>
        </div>
      ) : hydrated && user && user.role === "admin" ? (
        <p className="text-xs text-muted-foreground">Admins cannot apply. Switch to a student account to test the flow.</p>
      ) : (
        <Button size="lg" className="w-full" variant="accent" disabled={closed} onClick={apply}>
          {closed ? "Closed" : "Apply Now"}
        </Button>
      )}
      <p className="text-xs text-muted-foreground">Free to apply. Shortlisted candidates complete a short interview.</p>
    </Card>
  );

  return (
    <div>
      <section className="bg-primary text-white">
        <div className="container-x py-10 lg:py-14">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-white/10 px-2.5 py-1 inline-flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5" /> {internship.department}
            </span>
            <span className="rounded-full bg-white/10 px-2.5 py-1 inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {internship.workMode}
            </span>
            <span className="rounded-full bg-white/10 px-2.5 py-1 inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> {internship.durationWeeks} weeks
            </span>
          </div>
          <h1 className="mt-4 text-3xl sm:text-4xl font-bold text-white">{internship.title}</h1>
          <p className="mt-3 text-lg text-slate-300 max-w-2xl">{internship.description}</p>
        </div>
      </section>

      <div className="container-x py-8 lg:py-10 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-8 min-w-0">
          <div className="lg:hidden">{applyCard}</div>
          <div className="relative aspect-[2.4/1] rounded-xl overflow-hidden">
            <Image src={internship.thumbnail} alt="" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 800px" />
          </div>
          <section>
            <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-secondary" /> Eligibility
            </h2>
            <ul className="space-y-2 text-sm">
              {internship.eligibility.map((e) => (
                <li key={e} className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" /> {e}
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h2 className="text-xl font-semibold mb-3">Skills required</h2>
            <div className="flex flex-wrap gap-2">
              {internship.skillsRequired.map((s) => (
                <Badge key={s} variant="secondary">
                  {s}
                </Badge>
              ))}
            </div>
          </section>
          <section>
            <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
              <Target className="h-5 w-5 text-secondary" /> What you&apos;ll learn
            </h2>
            <ul className="grid gap-2 sm:grid-cols-2 text-sm">
              {internship.learningOutcomes.map((o) => (
                <li key={o} className="flex items-start gap-2 rounded-md border border-border bg-card p-3">
                  <CheckCircle2 className="h-4 w-4 text-secondary mt-0.5 shrink-0" /> {o}
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
              <UserRound className="h-5 w-5 text-secondary" /> Your mentor
            </h2>
            <Card className="p-5 flex items-center gap-4">
              <UserAvatar name={internship.mentorName} className="h-14 w-14 text-base" />
              <div>
                <p className="font-semibold">{internship.mentorName}</p>
                <p className="text-sm text-muted-foreground">{internship.mentorTitle}</p>
              </div>
            </Card>
          </section>
          <section className="rounded-xl border border-border bg-card p-5 grid gap-4 sm:grid-cols-3 text-sm">
            <div className="flex items-start gap-2">
              <Wallet className="h-4 w-4 text-secondary mt-0.5" />
              <div>
                <p className="font-medium">{stipendLabel(internship)}</p>
                <p className="text-xs text-muted-foreground">Stipend</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Users className="h-4 w-4 text-secondary mt-0.5" />
              <div>
                <p className="font-medium">{internship.openings} openings</p>
                <p className="text-xs text-muted-foreground">Cohort size</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CalendarClock className="h-4 w-4 text-secondary mt-0.5" />
              <div>
                <p className="font-medium">{formatDate(internship.applicationDeadline)}</p>
                <p className="text-xs text-muted-foreground">Application deadline</p>
              </div>
            </div>
          </section>
        </div>
        <aside className="hidden lg:block">
          <div className="sticky top-24">{applyCard}</div>
        </aside>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>Apply: {internship.title}</DialogTitle>
            <DialogDescription>
              Applications are reviewed by {internship.mentorName}. Deadline {formatDate(internship.applicationDeadline)}.
            </DialogDescription>
          </DialogHeader>
          {user && <InternshipApplicationForm internship={internship} user={user} onDone={() => setOpen(false)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
