"use client";

import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartTooltip } from "./chart-tooltip";

export function QuizScoresChart({ data, height = 200 }) {
  const passing = data[0]?.passing ?? 70;
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: -16, right: 8, top: 8, bottom: 0 }} barSize={28}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} interval={0} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
          <Tooltip cursor={{ fill: "var(--muted)" }} content={<ChartTooltip formatter={(v) => `${v}%`} />} />
          <ReferenceLine
            y={passing}
            stroke="var(--chart-3)"
            strokeDasharray="4 4"
            label={{ value: `Pass ${passing}%`, position: "insideTopRight", fontSize: 10, fill: "var(--muted-foreground)" }}
          />
          <Bar animationDuration={500} dataKey="score" name="Best score" radius={[4, 4, 0, 0]}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.score >= d.passing ? "var(--chart-4)" : "var(--destructive)"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
