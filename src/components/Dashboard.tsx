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

interface Props {
  data: ParsedData;
  onReset: () => void;
  onAddMore: () => void;
  disableAddMore?: boolean;
  isDemo?: boolean;
}

export default function Dashboard({
  data,
  onReset,
  onAddMore,
  disableAddMore,
  isDemo,
}: Props) {
  const { reservations, payouts } = data;

  const monthlyOccupancy = useMemo(
    () => calcMonthlyOccupancy(reservations),
    [reservations]
  );
  const weekdayOccupancy = useMemo(
    () => calcWeekdayOccupancy(reservations),
    [reservations]
  );
  const monthlyRevenue = useMemo(() => calcMonthlyRevenue(payouts), [payouts]);

  const totalNights = totalBookedNights(reservations);
  const avgOcc = avgOccupancyPct(monthlyOccupancy);
  const revenue = totalRevenue(payouts);
  const hasRevenue = payouts.length > 0;

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">🏡 HostStats</h1>
            <p className="text-gray-500 text-sm mt-1">Your Airbnb at a glance</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={onAddMore}
              disabled={disableAddMore}
              className="text-sm px-4 py-2 rounded-xl border border-gray-300 hover:border-brand hover:text-brand transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-300 disabled:hover:text-gray-600"
            >
              ➕ Add more files
            </button>
            <button
              onClick={onReset}
              className="text-sm px-4 py-2 rounded-xl border border-gray-300 hover:border-red-400 hover:text-red-500 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            >
              ↩ Start over
            </button>
          </div>
        </div>

        {isDemo && (
          <div
            role="status"
            className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm"
          >
            👀 <strong>This is example data</strong> — it is not your listing.
            Press <em>Start over</em> to upload your own Airbnb export.
          </div>
        )}

        {/* Summary cards */}
        {reservations.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
            <MetricCard
              label="Total Bookings"
              value={formatCount(reservations.length)}
              highlight
            />
            <MetricCard label="Nights Booked" value={formatCount(totalNights)} />
            <MetricCard
              label="Avg Occupancy"
              value={`${avgOcc}%`}
              sub="per month"
            />
          </div>
        )}

        {hasRevenue && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <MetricCard
              label="Total Earnings"
              value={formatMoney(revenue)}
              highlight
            />
          </div>
        )}

        {/* Charts */}
        <div className="space-y-6">
          {monthlyOccupancy.length > 0 && (
            <OccupancyChart data={monthlyOccupancy} />
          )}
          {weekdayOccupancy.some((w) => w.bookedNights > 0) && (
            <WeekdayChart data={weekdayOccupancy} />
          )}
          {hasRevenue && monthlyRevenue.length > 0 && (
            <RevenueChart data={monthlyRevenue} />
          )}
        </div>

        {/* Prompts for missing data */}
        {!hasRevenue && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-700 text-sm">
            💡 <strong>Add an Earnings CSV</strong> to enable revenue charts.
          </div>
        )}
        {reservations.length === 0 && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 text-sm">
            💡 <strong>Add a Reservations CSV</strong> to see occupancy charts.
          </div>
        )}

        <p className="mt-8 text-center text-xs text-gray-400">
          HostStats is not affiliated with Airbnb.{" "}
          <a
            href="/privacy/"
            className="underline hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded"
          >
            Privacy
          </a>
        </p>
      </div>
    </main>
  );
}
