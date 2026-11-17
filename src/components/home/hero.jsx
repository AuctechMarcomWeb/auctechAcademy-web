import Link from "next/link";
import { ArrowRight, Award, Briefcase, PlayCircle, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-primary text-white">
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)", backgroundSize: "28px 28px" }}
        aria-hidden
      />
      <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-secondary/30 blur-3xl" aria-hidden />
      <div className="container-x relative py-16 sm:py-20 lg:py-28 grid gap-12 lg:grid-cols-2 lg:items-center">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Learn. Practice. Intern. Get Certified.
          </span>
          <h1 className="mt-5 text-4xl sm:text-5xl lg:text-[3.4rem] font-bold leading-[1.1] text-white text-balance">
            Learn Skills. Build Careers. <span className="text-accent">Get Certified.</span>
          </h1>
          <p className="mt-5 text-lg text-slate-300 max-w-xl leading-relaxed">
            Auctech Academy is an online learning, internship and certification platform. Follow structured courses, complete real assignments, pass
            assessments and earn certificates that employers can verify in seconds.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Button asChild size="xl" variant="accent">
              <Link href={ROUTES.explore}>
                Explore Courses <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="xl" variant="outline" className="border-white/25 bg-transparent text-white hover:bg-white/10">
              <Link href={ROUTES.internships}>Explore Internships</Link>
            </Button>
          </div>
          <dl className="mt-10 grid grid-cols-3 gap-4 max-w-md">
            {[
              { icon: Users, value: "60,000+", label: "Learners" },
              { icon: Award, value: "12,400+", label: "Certificates issued" },
              { icon: Briefcase, value: "900+", label: "Internships placed" },
            ].map((s) => (
              <div key={s.label}>
                <dt className="flex items-center gap-1.5 text-xs text-slate-400">
                  <s.icon className="h-3.5 w-3.5" /> {s.label}
                </dt>
                <dd className="mt-1 text-xl font-bold text-white">{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="relative hidden lg:block">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
            <div className="rounded-xl bg-white text-foreground p-5 shadow-panel">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Continue learning</p>
                <span className="text-xs font-medium text-success">72% complete</span>
              </div>
              <p className="mt-2 font-semibold text-primary">Full Stack Web Development</p>
              <p className="text-sm text-muted-foreground">Module 4 · Routing and Data Fetching</p>
              <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full w-[72%] rounded-full bg-secondary" />
              </div>
              <div className="mt-4 flex items-center gap-3 rounded-lg bg-muted p-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-white">
                  <PlayCircle className="h-5 w-5" />
                </span>
                <div className="text-sm">
                  <p className="font-medium">Next lesson unlocks after the React quiz</p>
                  <p className="text-xs text-muted-foreground">Passing score 70% · 5 questions</p>
                </div>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white/90 text-foreground p-4">
                <p className="text-xs text-muted-foreground">Certificate</p>
                <p className="mt-1 font-mono text-xs font-semibold text-primary">AUC-DM-2026-000124</p>
                <p className="mt-1 text-xs text-success font-medium">✓ Verified</p>
              </div>
              <div className="rounded-xl bg-white/90 text-foreground p-4">
                <p className="text-xs text-muted-foreground">Internship</p>
                <p className="mt-1 text-sm font-semibold text-primary">Frontend Dev</p>
                <p className="mt-1 text-xs text-muted-foreground">Week 3 of 12 · Active</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
