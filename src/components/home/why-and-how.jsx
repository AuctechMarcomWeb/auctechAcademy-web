import { BarChart3, ClipboardCheck, Factory, Layers, ShieldCheck } from "lucide-react";
import { SectionHeading } from "@/components/shared/page-header";

const WHY = [
  {
    icon: Layers,
    title: "Structured learning",
    text: "Every course follows a fixed sequence of modules, so you build on what you already know instead of skipping ahead.",
  },
  {
    icon: ClipboardCheck,
    title: "Practical assignments",
    text: "Submit real deliverables — campaign plans, code repositories, design kits — reviewed by your instructor.",
  },
  { icon: Factory, title: "Industry-focused curriculum", text: "Designed with hiring managers around the tools and workflows teams use today." },
  {
    icon: ShieldCheck,
    title: "Assessment-based certification",
    text: "Certificates are issued only after you pass every quiz and the final assessment, and they can be verified publicly.",
  },
  { icon: BarChart3, title: "Progress tracking", text: "See watch time, quiz scores and completion percentages for every course on your dashboard." },
];

const STEPS = ["Explore", "Enrol", "Learn", "Pass Assessments", "Complete", "Get Certified"];

export function WhyChoose() {
  return (
    <section className="bg-white border-y border-border">
      <div className="container-x py-14 lg:py-20">
        <SectionHeading title="Why choose Auctech" description="A learning model built around proof of skill, not just hours watched." />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {WHY.map((w) => (
            <div key={w.title} className="rounded-xl border border-border p-5 bg-card">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-accent">
                <w.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-semibold">{w.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{w.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HowItWorks() {
  return (
    <section className="container-x py-14 lg:py-20">
      <SectionHeading title="How it works" description="Six steps from your first lesson to a verifiable certificate." />
      <ol className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {STEPS.map((s, i) => (
          <li key={s} className="relative rounded-xl border border-border bg-card p-4 text-center">
            <span className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-white text-sm font-bold">{i + 1}</span>
            <p className="mt-3 text-sm font-semibold">{s}</p>
            {i < STEPS.length - 1 && <span className="hidden lg:block absolute -right-2 top-1/2 h-px w-4 bg-border" aria-hidden />}
          </li>
        ))}
      </ol>
    </section>
  );
}
