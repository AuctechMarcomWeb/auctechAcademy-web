"use client";

import { Star } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { useDb } from "@/store/db.store";
import { cn } from "@/lib/utils";

const LEVELS = ["Beginner", "Intermediate", "Advanced"];
const PRICES = [
  { value: "all", label: "Any price" },
  { value: "under_2000", label: "Under ₹2,000" },
  { value: "2000_5000", label: "₹2,000 – ₹5,000" },
  { value: "above_5000", label: "Above ₹5,000" },
];
const DURATIONS = [
  { value: "all", label: "Any duration" },
  { value: "short", label: "Under 3 hours" },
  { value: "medium", label: "3 – 6 hours" },
  { value: "long", label: "Over 6 hours" },
];

function Section({ title, children }) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-semibold mb-2">{title}</legend>
      {children}
    </fieldset>
  );
}

export function CourseFiltersPanel({ filters, onChange, onReset, className }) {
  const categories = useDb((s) => s.categories);
  const courses = useDb((s) => s.courses);
  const selectedCats = filters.categories ?? [];
  const selectedLevels = filters.levels ?? [];

  const toggle = (list, v) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  return (
    <div className={cn("space-y-6", className)}>
      <Section title="Category">
        {categories.map((c) => {
          const count = courses.filter((x) => x.categoryId === c.id && x.status === "published").length;
          return (
            <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox checked={selectedCats.includes(c.id)} onCheckedChange={() => onChange({ categories: toggle(selectedCats, c.id), page: 1 })} />
              <span className="flex-1">{c.name}</span>
              <span className="text-xs text-muted-foreground">{count}</span>
            </label>
          );
        })}
      </Section>
      <Section title="Level">
        {LEVELS.map((l) => (
          <label key={l} className="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox checked={selectedLevels.includes(l)} onCheckedChange={() => onChange({ levels: toggle(selectedLevels, l), page: 1 })} />
            {l}
          </label>
        ))}
      </Section>
      <Section title="Price">
        <RadioGroup value={filters.price ?? "all"} onValueChange={(v) => onChange({ price: v, page: 1 })}>
          {PRICES.map((p) => (
            <label key={p.value} className="flex items-center gap-2 text-sm cursor-pointer">
              <RadioGroupItem value={p.value} /> {p.label}
            </label>
          ))}
        </RadioGroup>
      </Section>
      <Section title="Duration">
        <RadioGroup value={filters.duration ?? "all"} onValueChange={(v) => onChange({ duration: v, page: 1 })}>
          {DURATIONS.map((d) => (
            <label key={d.value} className="flex items-center gap-2 text-sm cursor-pointer">
              <RadioGroupItem value={d.value} /> {d.label}
            </label>
          ))}
        </RadioGroup>
      </Section>
      <Section title="Rating">
        <RadioGroup value={String(filters.minRating ?? 0)} onValueChange={(v) => onChange({ minRating: Number(v), page: 1 })}>
          {[0, 4, 4.5, 4.8].map((r) => (
            <label key={r} className="flex items-center gap-2 text-sm cursor-pointer">
              <RadioGroupItem value={String(r)} />
              {r === 0 ? (
                "Any rating"
              ) : (
                <span className="inline-flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 text-amber-500" fill="currentColor" /> {r} &amp; up
                </span>
              )}
            </label>
          ))}
        </RadioGroup>
      </Section>
      <Button variant="outline" size="sm" className="w-full" onClick={onReset}>
        Reset filters
      </Button>
    </div>
  );
}
