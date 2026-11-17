"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartTooltip } from "./chart-tooltip";

/** Horizontal bars of completion % per enrolled course. */
export function LearningProgressChart({ data }) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }} barSize={16}>
          <CartesianGrid horizontal={false} stroke="var(--border)" />
          <XAxis
            type="number"
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis type="category" dataKey="label" width={140} tick={{ fontSize: 11, fill: "var(--foreground)" }} axisLine={false} tickLine={false} />
          <Tooltip cursor={{ fill: "var(--muted)" }} content={<ChartTooltip formatter={(v) => `${v}%`} />} />
          <Bar animationDuration={500} dataKey="percent" name="Completed" fill="var(--chart-1)" radius={[0, 4, 4, 0]} background={{ fill: "var(--muted)", radius: 4 }} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
