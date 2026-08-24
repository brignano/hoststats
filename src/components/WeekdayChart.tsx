"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { WeekdayOccupancy } from "@/lib/models";
import { formatCount } from "@/lib/format";
import { CHART_SERIES, axisTick, gridStroke, tooltipStyle } from "./chartTheme";

interface Props {
  data: WeekdayOccupancy[];
}

export default function WeekdayChart({ data }: Props) {
  return (
    <div className="bg-card rounded border border-line shadow-1 p-s5">
      <h3 className="text-base font-medium text-ink mb-s4">Booked Nights by Day of Week</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
          <XAxis dataKey="weekday" tick={axisTick} stroke={gridStroke} />
          <YAxis allowDecimals={false} tick={axisTick} stroke={gridStroke} />
          <Tooltip formatter={(v: number) => [formatCount(v), "Booked nights"]} {...tooltipStyle} />
          <Bar dataKey="bookedNights" fill={CHART_SERIES.bookedNights} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
