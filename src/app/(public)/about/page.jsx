import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ROUTES } from "@/lib/constants";

export const metadata = {
  title: "About",
  description: "Auctech Academy is the learning and certification arm of Auctech, built to turn structured study into verifiable, job-ready skills.",
};

const VALUES = [
  ["Proof over participation", "A certificate should mean something. Ours is only issued when the assessments say you are ready."],
  ["Practice, not just theory", "Every professional course includes a project reviewed by the instructor, and internships put those skills to work."],
  ["Transparent progress", "Learners always know where they stand: watch time, quiz scores, assignment status and what unlocks next."],
  ["Built for Indian learners", "Pricing in rupees, GST-compliant invoices, UPI payments and content designed around the local job market."],
];

const TEAM = [
  ["Arjun Mehta", "Head of Engineering Curriculum"],
  ["Priya Raghunathan", "Head of Marketing Curriculum"],
  ["Kabir Sethi", "Head of Data & AI"],
  ["Meera Krishnan", "Head of Design"],
  ["Rohan Desai", "Cloud & Infrastructure Lead"],
  ["Vikram Nair", "Academy Operations"],
];

export default function AboutPage() {
  return (
    <div>
      <section className="bg-primary text-white">
        <div className="container-x py-12 lg:py-16 max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">About Auctech Academy</p>
          <h1 className="mt-2 text-3xl sm:text-4xl font-bold text-white">Learning that ends in proof</h1>
          <p className="mt-4 text-lg text-slate-300 leading-relaxed">
            Auctech Academy is the education arm of Auctech. We started by training our own interns and found that structured modules, mandatory
            assessments and real project reviews produced engineers and marketers who could contribute from day one. The academy makes that same
            system available to anyone.
          </p>
        </div>
      </section>
      <div className="container-x py-12 lg:py-16 space-y-14">
        <section className="grid gap-8 lg:grid-cols-2 items-start">
          <div>
            <h2 className="text-2xl font-semibold">What we believe</h2>
            <p className="mt-2 text-muted-foreground">Four principles shape every course, internship and certificate on the platform.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {VALUES.map(([t, d]) => (
              <Card key={t} className="p-5">
                <h3 className="font-semibold">{t}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{d}</p>
              </Card>
            ))}
          </div>
        </section>
        <section>
          <h2 className="text-2xl font-semibold">Curriculum leads</h2>
          <p className="mt-2 text-muted-foreground">Practitioners who still do the work they teach.</p>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TEAM.map(([n, r]) => (
              <li key={n} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary/10 text-secondary font-semibold">
                  {n
                    .split(" ")
                    .map((p) => p[0])
                    .join("")}
                </span>
                <div>
                  <p className="font-medium">{n}</p>
                  <p className="text-xs text-muted-foreground">{r}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-xl bg-secondary/5 border border-secondary/20 p-6 lg:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Partner with the academy</h2>
            <p className="mt-1 text-sm text-muted-foreground">Hire from our internship cohorts or sponsor a course for your team.</p>
          </div>
          <Button asChild>
            <Link href={ROUTES.contact}>Get in touch</Link>
          </Button>
        </section>
      </div>
    </div>
  );
}
