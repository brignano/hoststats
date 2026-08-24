"use client";

import { useMemo } from "react";
import { ParsedData } from "@/lib/models";
import {
  calcMonthlyOccupancy,
  calcWeekdayOccupancy,
  calcMonthlyRevenue,
  totalRevenue,
  totalBookedNights,
  avgOccupancyPct,
} from "@/lib/calculations";
import { formatCount, formatMoney } from "@/lib/format";
import MetricCard from "./MetricCard";
import OccupancyChart from "./OccupancyChart";
import WeekdayChart from "./WeekdayChart";
import RevenueChart from "./RevenueChart";
import { AlertTriangleIcon, InfoIcon, PlusIcon, ResetIcon } from "./icons";

interface Props {
  data: ParsedData;
  onReset: () => void;
  onAddMore: () => void;
  disableAddMore?: boolean;
  isDemo?: boolean;
}

const buttonClass =
  "inline-flex items-center gap-s2 text-sm px-s3 py-s2 rounded-sm border border-line-strong bg-card text-ink-soft transition-colors duration-fast ease-brand hover:bg-surface-hover hover:text-ink disabled:bg-interactive-disabled-bg disabled:text-interactive-disabled-ink disabled:border-line disabled:cursor-not-allowed";

export default function Dashboard({ data, onReset, onAddMore, disableAddMore, isDemo }: Props) {
  const { reservations, payouts } = data;

  const monthlyOccupancy = useMemo(() => calcMonthlyOccupancy(reservations), [reservations]);
  const weekdayOccupancy = useMemo(() => calcWeekdayOccupancy(reservations), [reservations]);
  const monthlyRevenue = useMemo(() => calcMonthlyRevenue(payouts), [payouts]);

  const totalNights = totalBookedNights(reservations);
  const avgOcc = avgOccupancyPct(monthlyOccupancy);
  const revenue = totalRevenue(payouts);
  const hasRevenue = payouts.length > 0;

  return (
    <main className="min-h-screen px-s4 py-s6">
      <div className="max-w-measure mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-s6 flex-wrap gap-s3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink">HostStats</h1>
            <p className="text-sm text-slate mt-s1">Your Airbnb at a glance</p>
          </div>
          <div className="flex items-center gap-s2 flex-wrap">
            <button onClick={onAddMore} disabled={disableAddMore} className={buttonClass}>
              <PlusIcon className="w-4 h-4" />
              Add more files
            </button>
            <button onClick={onReset} className={buttonClass}>
              <ResetIcon className="w-4 h-4" />
              Start over
            </button>
          </div>
        </div>

        {isDemo && (
          <div role="status" className="state state-attention mb-s5">
            <AlertTriangleIcon className="state-icon" />
            <span>
              <strong className="font-semibold">This is example data</strong> — it is not your
              listing. Press <em>Start over</em> to upload your own Airbnb export.
            </span>
          </div>
        )}

        {/* Summary cards */}
        {reservations.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-s3 mb-s6">
            <MetricCard label="Total Bookings" value={formatCount(reservations.length)} highlight />
            <MetricCard label="Nights Booked" value={formatCount(totalNights)} />
            <MetricCard label="Avg Occupancy" value={`${avgOcc}%`} sub="per month" />
          </div>
        )}

        {hasRevenue && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-s3 mb-s6">
            <MetricCard label="Total Earnings" value={formatMoney(revenue)} highlight />
          </div>
        )}

        {/* Charts */}
        <div className="space-y-s5">
          {monthlyOccupancy.length > 0 && <OccupancyChart data={monthlyOccupancy} />}
          {weekdayOccupancy.some((w) => w.bookedNights > 0) && (
            <WeekdayChart data={weekdayOccupancy} />
          )}
          {hasRevenue && monthlyRevenue.length > 0 && <RevenueChart data={monthlyRevenue} />}
        </div>

        {/* Prompts for missing data */}
        {!hasRevenue && (
          <div className="state state-info mt-s5">
            <InfoIcon className="state-icon" />
            <span>
              <strong className="font-semibold">Add an Earnings CSV</strong> to enable revenue
              charts.
            </span>
          </div>
        )}
        {reservations.length === 0 && (
          <div className="state state-info mt-s5">
            <InfoIcon className="state-icon" />
            <span>
              <strong className="font-semibold">Add a Reservations CSV</strong> to see occupancy
              charts.
            </span>
          </div>
        )}

        <p className="mt-s7 text-center text-xs text-slate">
          HostStats is not affiliated with Airbnb.{" "}
          <a href="/privacy/" className="underline hover:text-ink-soft rounded-sm">
            Privacy
          </a>
        </p>
      </div>
    </main>
  );
}
