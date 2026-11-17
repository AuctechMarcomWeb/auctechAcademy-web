import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { FaqAccordion } from "@/components/course/faq-accordion";
import { ROUTES } from "@/lib/constants";

export const metadata = { title: "Pricing", description: "Simple per-course pricing with lifetime access. Internship applications are free." };

const TIERS = [
  {
    name: "Foundation courses",
    price: "₹1,499 – ₹2,999",
    note: "Beginner tracks",
    features: ["Lifetime access", "Module quizzes and final assessment", "Verifiable certificate", "Community Q&A"],
  },
  {
    name: "Professional courses",
    price: "₹3,499 – ₹5,999",
    note: "Most popular",
    highlight: true,
    features: [
      "Everything in Foundation",
      "Graded project with instructor feedback",
      "Downloadable resources and starter files",
      "Internship eligibility",
    ],
  },
  {
    name: "Advanced courses",
    price: "₹6,499 – ₹7,999",
    note: "Specialisations",
    features: ["Everything in Professional", "Capstone deployed to a public URL", "Priority assignment review (48 hrs)", "Mentor office hours"],
  },
];

const BUNDLES = [
  { name: "Web Developer Path", courses: "Full Stack Web Development + Java & DSA + AWS Essentials", list: "₹15,997", price: "₹11,999" },
  { name: "Growth Marketer Path", courses: "Digital Marketing Mastery + SEO + Social Media Marketing", list: "₹8,497", price: "₹6,499" },
  { name: "Data Path", courses: "Python for Data Analytics + Machine Learning with Python", list: "₹13,998", price: "₹10,999" },
];

const FAQS = [
  {
    question: "Are prices inclusive of GST?",
    answer: "Course prices shown on the site are exclusive of GST. 18% GST is added at checkout and shown clearly on your invoice.",
  },
  {
    question: "Do internships cost anything?",
    answer: "No. Applying to an internship is free. Some internships are paid and the stipend is listed on the internship page.",
  },
  {
    question: "Can I pay in instalments?",
    answer: "Razorpay offers EMI options on eligible credit cards at checkout. Auctech does not charge extra for EMI.",
  },
  {
    question: "What if I need a refund?",
    answer: "You can request a full refund within 7 days of purchase if you have completed less than 20% of the course. See the Refund Policy.",
  },
  {
    question: "How do bundles work?",
    answer: "Bundles are purchased as individual course enrollments at the discounted total. Each course still has its own certificate.",
  },
];

export default function PricingPage() {
  return (
    <div className="container-x py-8 lg:py-12 space-y-14">
      <PageHeader
        eyebrow="Pricing"
        title="Pay per course. Keep it for life."
        description="No subscriptions. Each course is a one-time purchase with lifetime access, assessments and a verifiable certificate included."
      />
      <section className="grid gap-5 lg:grid-cols-3">
        {TIERS.map((t) => (
          <Card key={t.name} className={t.highlight ? "p-6 border-secondary ring-2 ring-secondary/20 relative" : "p-6"}>
            {t.highlight && (
              <Badge variant="secondary" className="absolute -top-3 left-6">
                Most popular
              </Badge>
            )}
            <h2 className="font-semibold">{t.name}</h2>
            <p className="text-xs text-muted-foreground">{t.note}</p>
            <p className="mt-4 text-2xl font-bold text-primary">{t.price}</p>
            <p className="text-xs text-muted-foreground">per course + 18% GST</p>
            <ul className="mt-5 space-y-2 text-sm">
              {t.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-success mt-0.5 shrink-0" /> {f}
                </li>
              ))}
            </ul>
            <Button asChild className="mt-6 w-full" variant={t.highlight ? "accent" : "outline"}>
              <Link href={ROUTES.explore}>Browse courses</Link>
            </Button>
          </Card>
        ))}
      </section>
      <section>
        <h2 className="text-xl font-semibold mb-4">Career path bundles</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {BUNDLES.map((b) => (
            <Card key={b.name} className="p-5">
              <h3 className="font-semibold">{b.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{b.courses}</p>
              <p className="mt-4">
                <span className="text-xl font-bold text-primary">{b.price}</span>{" "}
                <span className="text-sm text-muted-foreground line-through ml-2">{b.list}</span>
              </p>
              <Button asChild variant="outline" size="sm" className="mt-4">
                <Link href={ROUTES.contact}>Ask about this bundle</Link>
              </Button>
            </Card>
          ))}
        </div>
      </section>
      <section className="rounded-xl border border-border bg-card p-6 grid gap-6 md:grid-cols-[1fr_1fr]">
        <div>
          <h2 className="text-xl font-semibold">Internships</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Free to apply. Selection is based on your application and a short interview. Completing the related course makes you eligible and
            strengthens your application.
          </p>
        </div>
        <div className="flex items-center md:justify-end">
          <Button asChild>
            <Link href={ROUTES.internships}>See open internships</Link>
          </Button>
        </div>
      </section>
      <section className="max-w-3xl">
        <h2 className="text-xl font-semibold mb-2">Pricing FAQs</h2>
        <FaqAccordion items={FAQS} />
      </section>
    </div>
  );
}
