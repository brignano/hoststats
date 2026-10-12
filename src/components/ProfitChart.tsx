"use client";

import { memo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { MonthlyProfit } from "@/lib/models";
import { formatMoneyAxis, formatMoneyExact } from "@/lib/format";
import { CHART_SERIES, axisTick, gridStroke, tooltipStyle } from "./chartTheme";

interface Props {
  data: MonthlyProfit[];
}

function ProfitChart({ data }: Props) {
  return (
    <div className="bg-card rounded border border-line shadow-1 p-s5">
      <h3 className="text-base font-medium text-ink mb-s1">Profit by Month</h3>
      <p className="text-xs text-muted mb-s4">
        Income minus your costs. Bars below the line lost money.
      </p>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
          <XAxis dataKey="label" tick={axisTick} stroke={gridStroke} />
          <YAxis tickFormatter={formatMoneyAxis} tick={axisTick} stroke={gridStroke} />
          <ReferenceLine y={0} stroke="var(--line-strong)" />
          <Tooltip
            formatter={(v: number, name: string) => [
              formatMoneyExact(v),
              name === "profit" ? "Profit" : name,
            ]}
            {...tooltipStyle}
          />
          {/* No animation: this redraws as the host types their costs. */}
          <Bar
            dataKey="profit"
            fill={CHART_SERIES.profit}
            radius={[4, 4, 0, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Memoised: the dashboard re-renders on every keystroke in the costs form,
// and this only needs to redraw when its own data changes.
export default memo(ProfitChart);
