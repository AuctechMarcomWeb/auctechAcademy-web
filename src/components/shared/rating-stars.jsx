import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function RatingStars({ rating, count, size = "sm", className, showValue = true }) {
  const px = size === "xs" ? "h-3 w-3" : size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  return (
    <div className={cn("inline-flex items-center gap-1", className)} aria-label={`Rated ${rating} out of 5`}>
      {showValue && <span className="text-sm font-semibold text-amber-600 tabular-nums">{rating.toFixed(1)}</span>}
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => {
          const fill = Math.min(1, Math.max(0, rating - (i - 1)));
          return (
            <span key={i} className={cn("relative inline-block", px)}>
              <Star className={cn("absolute inset-0 text-slate-300", px)} fill="currentColor" strokeWidth={0} />
              <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <Star className={cn("text-amber-500", px)} fill="currentColor" strokeWidth={0} />
              </span>
            </span>
          );
        })}
      </div>
      {typeof count === "number" && <span className="text-xs text-muted-foreground">({count.toLocaleString("en-IN")})</span>}
    </div>
  );
}
