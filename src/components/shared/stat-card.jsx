import * as React from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const tones = {
  primary: "bg-primary/10 text-primary",
  secondary: "bg-secondary/10 text-secondary",
  accent: "bg-accent/25 text-amber-700",
  success: "bg-success/10 text-success",
  muted: "bg-muted text-muted-foreground",
};

export function StatCard({ label, value, icon: Icon, hint, trend, tone = "secondary", className }) {
  return (
    <Card className={cn("p-5 flex items-start gap-4", className)}>
      <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-lg", tones[tone])}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground truncate">{label}</p>
        <p className="mt-1 text-2xl font-bold text-primary leading-tight tabular-nums">{value}</p>
        {(hint || trend) && (
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            {trend && (
              <span className={cn("inline-flex items-center gap-0.5 font-semibold", trend.value >= 0 ? "text-success" : "text-destructive")}>
                {trend.value >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {Math.abs(trend.value)}%
              </span>
            )}
            <span className="truncate">{trend?.label ?? hint}</span>
          </p>
        )}
      </div>
    </Card>
  );
}
