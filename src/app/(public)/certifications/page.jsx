import Link from "next/link";
import { Award, FileCheck2, QrCode, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { CertificationsList } from "@/components/static/certifications-list";
import { ROUTES, SITE } from "@/lib/constants";

export const metadata = {
  title: "Certifications",
  description: "How Auctech Academy's assessment-based certificates work, what they contain and how anyone can verify them.",
};

const PILLARS = [
  {
    icon: FileCheck2,
    title: "Earned, not attended",
    text: "Every lesson must be watched, every module quiz passed at the required score, the project submitted and the final assessment cleared before a certificate is generated.",
  },
  {
    icon: QrCode,
    title: "Unique ID and QR code",
    text: `Each certificate carries an ID such as AUC-DM-2026-000124 and a QR code pointing to ${SITE.domain}/verify/[id].`,
  },
  {
    icon: ShieldCheck,
    title: "Publicly verifiable",
    text: "Employers and institutions can confirm the holder, course, completion date and current status without an account.",
  },
  {
    icon: Award,
    title: "Revocable",
    text: "Certificates found to breach academic-integrity rules are revoked, and the verification page states the reason.",
  },
];

export default function CertificationsPage() {
  return (
    <div>
      <section className="bg-primary text-white">
        <div className="container-x py-12 lg:py-16">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">Professional certification</p>
          <h1 className="mt-2 text-3xl sm:text-4xl font-bold text-white max-w-2xl">Certificates that stand up to scrutiny</h1>
          <p className="mt-3 text-lg text-slate-300 max-w-2xl">
            An Auctech certificate records what you proved you can do. Here is how it is earned and how anyone can check it.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild variant="accent" size="lg">
              <Link href={ROUTES.verify}>Verify a certificate</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-white/25 bg-transparent text-white hover:bg-white/10">
              <Link href={ROUTES.explore}>Browse courses</Link>
            </Button>
          </div>
        </div>
      </section>
      <div className="container-x py-12 lg:py-16 space-y-14">
        <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map((p) => (
            <div key={p.title} className="rounded-xl border border-border bg-card p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                <p.icon className="h-5 w-5" />
              </span>
              <h2 className="mt-4 font-semibold">{p.title}</h2>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{p.text}</p>
            </div>
          ))}
        </section>
        <section>
          <PageHeader
            title="Certification tracks"
            description="Every published course leads to a certificate. The code in the ID identifies the course."
            className="mb-6"
          />
          <CertificationsList />
        </section>
        <section className="rounded-xl border border-border bg-card p-6 lg:p-8 grid gap-6 lg:grid-cols-2">
          <div>
            <h2 className="text-xl font-semibold">Anatomy of a certificate ID</h2>
            <p className="mt-2 text-sm text-muted-foreground">IDs are deterministic and never reused.</p>
          </div>
          <dl className="grid grid-cols-4 gap-2 font-mono text-center text-sm">
            {[
              ["AUC", "Issuer"],
              ["DM", "Course code"],
              ["2026", "Year"],
              ["000124", "Sequence"],
            ].map(([v, l]) => (
              <div key={l} className="rounded-md bg-muted p-3">
                <dt className="text-xs text-muted-foreground font-sans">{l}</dt>
                <dd className="mt-1 font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </div>
  );
}
