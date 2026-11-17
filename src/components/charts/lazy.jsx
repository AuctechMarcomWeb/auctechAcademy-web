"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Charts use Recharts (~360 KB). Loading them on demand lets the page show
 * immediately; the chart appears a moment later in place of a placeholder.
 */
const placeholder = (height) => {
  function ChartPlaceholder() {
    return <Skeleton className="w-full rounded-lg" style={{ height }} />;
  }
  return ChartPlaceholder;
};

export const LearningProgressChart = dynamic(() => import("./learning-progress-chart").then((m) => m.LearningProgressChart), {
  ssr: false,
  loading: placeholder(240),
});
export const WeeklyActivityChart = dynamic(() => import("./weekly-activity-chart").then((m) => m.WeeklyActivityChart), {
  ssr: false,
  loading: placeholder(220),
});
export const QuizScoresChart = dynamic(() => import("./quiz-scores-chart").then((m) => m.QuizScoresChart), { ssr: false, loading: placeholder(200) });
