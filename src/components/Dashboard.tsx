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
import MetricCard from "./MetricCard";
import OccupancyChart from "./OccupancyChart";
import WeekdayChart from "./WeekdayChart";
import RevenueChart from "./RevenueChart";

interface Props {
  data: ParsedData;
  onReset: () => void;
  onAddMore: () => void;
}

export default function Dashboard({ data, onReset, onAddMore }: Props) {
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
              className="text-sm px-4 py-2 rounded-xl border border-gray-300 hover:border-brand hover:text-brand transition-colors"
            >
              ➕ Add more files
            </button>
            <button
              onClick={onReset}
              className="text-sm px-4 py-2 rounded-xl border border-gray-300 hover:border-red-400 hover:text-red-500 transition-colors"
            >
              ↩ Start over
            </button>
          </div>
        </div>

        {/* Summary cards */}
        {reservations.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
            <MetricCard
              label="Total Bookings"
              value={reservations.length}
              highlight
            />
            <MetricCard label="Nights Booked" value={totalNights} />
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
              value={`$${revenue.toFixed(2)}`}
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

        <p className="mt-8 text-center text-xs text-gray-300">
          HostStats is not affiliated with Airbnb.
        </p>
      </div>
    </main>
  );
}
