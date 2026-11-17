"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { DynamicIcon } from "@/components/shared/dynamic-icon";
import { SectionHeading } from "@/components/shared/page-header";
import { useDb } from "@/store/db.store";
import { ROUTES } from "@/lib/constants";
import { Skeleton } from "@/components/ui/skeleton";

export function CategoriesGrid() {
  const categories = useDb((s) => s.categories);
  const courses = useDb((s) => s.courses);
  const ready = useDb((s) => s.hydrated);
  return (
    <section className="container-x py-14 lg:py-20">
      <SectionHeading title="Popular categories" description="Pick a track and start with the fundamentals." />
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        {!ready && Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-[132px] rounded-xl" />)}
        {categories.map((c) => {
          const count = courses.filter((x) => x.categoryId === c.id && x.status === "published").length;
          return (
            <Link
              key={c.id}
              href={`${ROUTES.explore}?categories=${c.id}`}
              className="group rounded-xl border border-border bg-card p-5 transition-all hover:shadow-card-hover hover:border-secondary/40"
            >
              <div className="flex items-start justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-secondary/10 text-secondary group-hover:bg-secondary group-hover:text-white transition-colors">
                  <DynamicIcon name={c.icon} className="h-5 w-5" />
                </span>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h3 className="mt-4 font-semibold">{c.name}</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {count} course{count === 1 ? "" : "s"}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
