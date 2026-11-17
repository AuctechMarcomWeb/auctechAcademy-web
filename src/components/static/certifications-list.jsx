"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useShallow } from "zustand/react/shallow";
import { useDb } from "@/store/db.store";
import { ROUTES } from "@/lib/constants";
import { CardGridSkeleton } from "@/components/shared/loading";

export function CertificationsList() {
  const courses = useDb(useShallow((s) => s.courses.filter((c) => c.status === "published")));
  const categories = useDb((s) => s.categories);
  const ready = useDb((s) => s.hydrated);
  const prefix = useDb((s) => s.settings.certificatePrefix);
  if (!ready) return <CardGridSkeleton count={6} />;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {courses.map((c) => (
        <Card key={c.id} className="p-5 flex flex-col">
          <p className="text-xs text-secondary font-medium">{categories.find((x) => x.id === c.categoryId)?.name}</p>
          <h3 className="mt-1 font-semibold leading-snug">{c.title}</h3>
          <p className="mt-2 text-xs text-muted-foreground">Certificate ID format</p>
          <code className="mt-1 inline-block w-fit rounded bg-muted px-2 py-1 font-mono text-xs">
            {prefix}-{c.certificateCode}-YYYY-000000
          </code>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Badge variant="outline">{c.modules.filter((m) => m.quizId).length} quizzes</Badge>
            <Badge variant="outline">Final assessment</Badge>
            {c.modules.some((m) => m.assignmentId) && <Badge variant="outline">Project</Badge>}
          </div>
          <Link
            href={ROUTES.course(c.slug)}
            className="mt-auto pt-4 text-sm font-medium text-secondary inline-flex items-center gap-1 hover:underline"
          >
            View course <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Card>
      ))}
    </div>
  );
}
