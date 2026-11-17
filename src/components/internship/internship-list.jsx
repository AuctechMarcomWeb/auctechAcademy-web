"use client";

import { useMemo, useState } from "react";
import { Briefcase } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { InternshipCard } from "./internship-card";
import { useDb } from "@/store/db.store";
import { CardGridSkeleton } from "@/components/shared/loading";

const ALL = "all";

function Filter({ label, value, onChange, options }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label={label} className="w-full sm:w-[170px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function InternshipList() {
  const internships = useDb((s) => s.internships);
  const catalogReady = useDb((s) => s.hydrated);
  const [department, setDepartment] = useState(ALL);
  const [mode, setMode] = useState(ALL);
  const [stipend, setStipend] = useState(ALL);
  const [status, setStatus] = useState("open");

  const departments = useMemo(() => Array.from(new Set(internships.map((i) => i.department))).sort(), [internships]);
  const modes = ["Remote", "Hybrid", "On-site"];
  const stipends = ["Paid", "Performance-based", "Unpaid"];

  const filtered = internships.filter(
    (i) =>
      (department === ALL || i.department === department) &&
      (mode === ALL || i.workMode === mode) &&
      (stipend === ALL || i.stipend === stipend) &&
      (status === ALL || i.status === status),
  );

  const reset = () => {
    setDepartment(ALL);
    setMode(ALL);
    setStipend(ALL);
    setStatus(ALL);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row flex-wrap gap-2">
        <Filter
          label="Department"
          value={department}
          onChange={setDepartment}
          options={[{ value: ALL, label: "All departments" }, ...departments.map((d) => ({ value: d, label: d }))]}
        />
        <Filter
          label="Work mode"
          value={mode}
          onChange={setMode}
          options={[{ value: ALL, label: "Any work mode" }, ...modes.map((m) => ({ value: m, label: m }))]}
        />
        <Filter
          label="Stipend"
          value={stipend}
          onChange={setStipend}
          options={[{ value: ALL, label: "Any stipend" }, ...stipends.map((s) => ({ value: s, label: s }))]}
        />
        <Filter
          label="Status"
          value={status}
          onChange={setStatus}
          options={[
            { value: "open", label: "Open" },
            { value: "closed", label: "Closed" },
            { value: ALL, label: "Open and closed" },
          ]}
        />
        <Button variant="ghost" onClick={reset} className="sm:ml-auto">
          Reset
        </Button>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        {filtered.length} internship{filtered.length === 1 ? "" : "s"}
      </p>
      {filtered.length === 0 && !catalogReady ? (
        <div className="mt-6">
          <CardGridSkeleton count={3} />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon={Briefcase}
          title="No internships match"
          description="Try widening your filters."
          action={
            <Button variant="outline" onClick={reset}>
              Reset filters
            </Button>
          }
        />
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((i) => (
            <InternshipCard key={i.id} internship={i} />
          ))}
        </div>
      )}
    </div>
  );
}
