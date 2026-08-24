"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { MonthlyRevenue } from "@/lib/models";
import { formatMoneyAxis, formatMoneyExact } from "@/lib/format";
import { CHART_SERIES, axisTick, gridStroke, tooltipStyle } from "./chartTheme";

interface Props {
  data: MonthlyRevenue[];
}

export default function RevenueChart({ data }: Props) {
  return (
    <div className="bg-card rounded border border-line shadow-1 p-s5">
      <h3 className="text-base font-medium text-ink mb-s4">Earnings by Month</h3>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={CHART_SERIES.earnings} stopOpacity={0.3} />
              <stop offset="95%" stopColor={CHART_SERIES.earnings} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
          <XAxis dataKey="label" tick={axisTick} stroke={gridStroke} />
          <YAxis tickFormatter={formatMoneyAxis} tick={axisTick} stroke={gridStroke} />
          <Tooltip formatter={(v: number) => [formatMoneyExact(v), "Earnings"]} {...tooltipStyle} />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke={CHART_SERIES.earnings}
            fill="url(#revenueGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
