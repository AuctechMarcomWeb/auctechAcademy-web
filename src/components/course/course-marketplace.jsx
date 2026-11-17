"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { LayoutGrid, List, Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Pagination } from "@/components/shared/pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { CourseCard } from "./course-card";
import { CourseFiltersPanel } from "./course-filters";
import { useDb } from "@/store/db.store";
import { applyCourseFilters, DEFAULT_PAGE_SIZE } from "@/services/course.service";
import { cn } from "@/lib/utils";
import { CardGridSkeleton } from "@/components/shared/loading";

const SORTS = [
  { value: "popular", label: "Most popular" },
  { value: "newest", label: "Newest" },
  { value: "rating", label: "Highest rated" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
];

function parse(params) {
  return {
    q: params.get("q") ?? "",
    categories: params.get("categories")?.split(",").filter(Boolean) ?? [],
    levels: params.get("levels")?.split(",").filter(Boolean) ?? [],
    price: params.get("price") ?? "all",
    duration: params.get("duration") ?? "all",
    minRating: Number(params.get("rating") ?? 0),
    sort: params.get("sort") ?? "popular",
    page: Number(params.get("page") ?? 1),
  };
}

function serialize(f) {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.categories?.length) p.set("categories", f.categories.join(","));
  if (f.levels?.length) p.set("levels", f.levels.join(","));
  if (f.price && f.price !== "all") p.set("price", f.price);
  if (f.duration && f.duration !== "all") p.set("duration", f.duration);
  if (f.minRating) p.set("rating", String(f.minRating));
  if (f.sort && f.sort !== "popular") p.set("sort", f.sort);
  if (f.page && f.page > 1) p.set("page", String(f.page));
  return p.toString();
}

/** Full course marketplace with URL-synced search, filters, sort, view toggle and pagination. */
export function CourseMarketplace() {
  const params = useSearchParams();
  const pathname = usePathname();
  const courses = useDb((s) => s.courses);
  const catalogReady = useDb((s) => s.hydrated);
  const categories = useDb((s) => s.categories);

  const filters = useMemo(() => parse(new URLSearchParams(params.toString())), [params]);
  const [query, setQuery] = useState(filters.q ?? "");
  const [view, setView] = useState("grid");
  const [mobileFilters, setMobileFilters] = useState(false);

  // Keep the input in sync when the URL changes externally (back/forward, header search).
  const [syncedQ, setSyncedQ] = useState(filters.q ?? "");
  if (syncedQ !== (filters.q ?? "")) {
    setSyncedQ(filters.q ?? "");
    setQuery(filters.q ?? "");
  }

  const update = useCallback(
    (patch) => {
      const next = { ...filters, ...patch };
      const qs = serialize(next);
      // Native history update: Next.js keeps useSearchParams in sync without re-requesting the page from the server.
      window.history.replaceState(null, "", qs ? `${pathname}?${qs}` : pathname);
    },
    [filters, pathname],
  );

  // Debounced search → URL
  useEffect(() => {
    const t = setTimeout(() => {
      if ((filters.q ?? "") !== query) update({ q: query, page: 1 });
    }, 300);
    return () => clearTimeout(t);
  }, [query, filters.q, update]);

  const reset = () => window.history.replaceState(null, "", pathname);
  const result = useMemo(() => applyCourseFilters(courses, { ...filters, pageSize: DEFAULT_PAGE_SIZE }), [courses, filters]);

  const activeChips = [
    ...(filters.categories ?? []).map((id) => ({
      key: `c-${id}`,
      label: categories.find((c) => c.id === id)?.name ?? id,
      remove: () => update({ categories: filters.categories.filter((x) => x !== id), page: 1 }),
    })),
    ...(filters.levels ?? []).map((l) => ({
      key: `l-${l}`,
      label: l,
      remove: () => update({ levels: filters.levels.filter((x) => x !== l), page: 1 }),
    })),
    ...(filters.price && filters.price !== "all" ? [{ key: "price", label: "Price filter", remove: () => update({ price: "all", page: 1 }) }] : []),
    ...(filters.duration && filters.duration !== "all"
      ? [{ key: "dur", label: "Duration filter", remove: () => update({ duration: "all", page: 1 }) }]
      : []),
    ...(filters.minRating ? [{ key: "rating", label: `${filters.minRating}★ & up`, remove: () => update({ minRating: 0, page: 1 }) }] : []),
  ];

  const filterPanel = <CourseFiltersPanel filters={filters} onChange={update} onReset={reset} />;

  return (
    <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
      <aside className="hidden lg:block">
        <div className="sticky top-24 rounded-xl border border-border bg-card p-5">
          <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4" /> Filters
          </h2>
          {filterPanel}
        </div>
      </aside>

      <div className="min-w-0">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              data-testid="course-search"
              placeholder="Search courses, skills or topics…"
              className="pl-9"
              aria-label="Search courses"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="lg:hidden" onClick={() => setMobileFilters(true)}>
              <SlidersHorizontal /> Filters{activeChips.length > 0 && ` (${activeChips.length})`}
            </Button>
            <Select value={filters.sort ?? "popular"} onValueChange={(v) => update({ sort: v, page: 1 })}>
              <SelectTrigger className="w-[180px]" aria-label="Sort courses">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORTS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="hidden sm:flex rounded-md border border-border overflow-hidden">
              <button
                onClick={() => setView("grid")}
                className={cn("p-2 cursor-pointer", view === "grid" ? "bg-primary text-white" : "bg-card hover:bg-muted")}
                aria-label="Grid view"
                aria-pressed={view === "grid"}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setView("list")}
                className={cn("p-2 cursor-pointer", view === "list" ? "bg-primary text-white" : "bg-card hover:bg-muted")}
                aria-label="List view"
                aria-pressed={view === "list"}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span>
            {result.total} course{result.total === 1 ? "" : "s"}
            {filters.q && <> for &ldquo;{filters.q}&rdquo;</>}
          </span>
          {activeChips.map((chip) => (
            <Badge key={chip.key} variant="outline" className="gap-1 pr-1">
              {chip.label}
              <button onClick={chip.remove} className="rounded-full p-0.5 hover:bg-muted cursor-pointer" aria-label={`Remove ${chip.label}`}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {activeChips.length > 0 && (
            <button onClick={reset} className="text-secondary hover:underline text-xs cursor-pointer">
              Clear all
            </button>
          )}
        </div>

        {result.items.length === 0 && !catalogReady ? (
          <div className="mt-6">
            <CardGridSkeleton count={6} />
          </div>
        ) : result.items.length === 0 ? (
          <EmptyState
            className="mt-6"
            icon={Search}
            title="No courses match your filters"
            description="Try a different search term or clear some filters."
            action={
              <Button variant="outline" onClick={reset}>
                Clear filters
              </Button>
            }
          />
        ) : (
          <div data-testid="course-grid" className={cn("mt-6", view === "grid" ? "grid gap-5 sm:grid-cols-2 xl:grid-cols-3" : "flex flex-col gap-4")}>
            {result.items.map((c) => (
              <div key={c.id} data-testid="course-card" className="flex">
                <CourseCard course={c} layout={view} className="flex-1" />
              </div>
            ))}
          </div>
        )}

        <Pagination page={result.page} totalPages={result.totalPages} onChange={(p) => update({ page: p })} className="mt-8" />
      </div>

      <Sheet open={mobileFilters} onOpenChange={setMobileFilters}>
        <SheetContent side="left" className="p-5 overflow-y-auto">
          <SheetTitle className="text-base font-semibold mb-4">Filters</SheetTitle>
          {filterPanel}
        </SheetContent>
      </Sheet>
    </div>
  );
}
