"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FaqAccordion } from "@/components/course/faq-accordion";
import { siteFaqs } from "@/data/people";
import { ROUTES } from "@/lib/constants";

export function HomeFaq() {
  return (
    <section className="bg-white border-t border-border">
      <div className="container-x py-14 lg:py-20 grid gap-10 lg:grid-cols-[1fr_2fr]">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold">Frequently asked questions</h2>
          <p className="mt-2 text-muted-foreground">Still unsure? Our team replies within one working day.</p>
          <Button asChild variant="outline" className="mt-5">
            <Link href={ROUTES.contact}>Contact us</Link>
          </Button>
        </div>
        <FaqAccordion items={siteFaqs} />
      </div>
    </section>
  );
}
