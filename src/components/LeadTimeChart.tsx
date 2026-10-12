"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LabelList,
} from "recharts";
import { LeadTimeMonth } from "@/lib/models";
import { CHART_SERIES, axisTick, gridStroke, tooltipStyle } from "./chartTheme";

interface Props {
  data: LeadTimeMonth[];
}

export default function LeadTimeChart({ data }: Props) {
  // Twelve three-letter months don't fit on a phone. Rendered client-side only
  // (the dashboard is never prerendered), so reading the width here is safe.
  const narrow = typeof window !== "undefined" && window.innerWidth < 640;

  return (
    <div className="bg-card rounded border border-line shadow-1 p-s5">
      <h3 className="text-base font-medium text-ink mb-s1">How Far Ahead Guests Book</h3>
      <p className="text-xs text-slate mb-s4">
        Median days between booking and check-in, by check-in month.
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 18, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
          <XAxis
            dataKey="label"
            tick={axisTick}
            stroke={gridStroke}
            interval={0}
            tickFormatter={(v: string) => (narrow ? v.slice(0, 1) : v)}
          />
          <YAxis allowDecimals={false} tick={axisTick} stroke={gridStroke} width={32} />
          <Tooltip formatter={(v: number) => [`${v} days`, "Median lead time"]} {...tooltipStyle} />
          <Bar dataKey="medianDays" fill={CHART_SERIES.leadTime} radius={[4, 4, 0, 0]}>
            <LabelList dataKey="medianDays" position="top" style={axisTick} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
