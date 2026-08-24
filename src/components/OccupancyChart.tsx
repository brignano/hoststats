"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { MonthlyOccupancy } from "@/lib/models";
import { CHART_SERIES, axisTick, gridStroke, tooltipStyle } from "./chartTheme";

interface Props {
  data: MonthlyOccupancy[];
}

export default function OccupancyChart({ data }: Props) {
  return (
    <div className="bg-card rounded border border-line shadow-1 p-s5">
      <h3 className="text-base font-medium text-ink mb-s4">Occupancy % by Month</h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
          <XAxis dataKey="label" tick={axisTick} stroke={gridStroke} />
          <YAxis
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
            tick={axisTick}
            stroke={gridStroke}
          />
          <Tooltip formatter={(v: number) => [`${v}%`, "Occupancy"]} {...tooltipStyle} />
          <Bar dataKey="occupancyPct" fill={CHART_SERIES.occupancy} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
