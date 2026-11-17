import { formatDate } from "@/lib/format";

export function LegalPage({ title, intro, sections, updated = "2026-10-01" }) {
  return (
    <div className="container-x py-8 lg:py-12 max-w-3xl">
      <p className="text-xs font-semibold uppercase tracking-wider text-secondary">Legal</p>
      <h1 className="mt-1 text-3xl font-bold">{title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">Last updated {formatDate(updated)}</p>
      <p className="mt-6 text-muted-foreground leading-relaxed">{intro}</p>
      <div className="mt-8 space-y-8">
        {sections.map((s, i) => (
          <section key={s.title}>
            <h2 className="text-lg font-semibold">
              {i + 1}. {s.title}
            </h2>
            {s.body.map((p, j) => (
              <p key={j} className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {p}
              </p>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
