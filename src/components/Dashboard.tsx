"use client";

import { useMemo } from "react";
import { Costs, ParsedData } from "@/lib/models";
import {
  calcMonthlyOccupancy,
  calcWeekdayOccupancy,
  calcMonthlyRevenue,
  calcMonthlyProfit,
  calcBreakEven,
  calcGapNights,
  incomePerNight,
  totalRevenue,
  totalBookedNights,
  avgOccupancyPct,
} from "@/lib/calculations";
import { formatCount, formatMoney } from "@/lib/format";
import MetricCard from "./MetricCard";
import OccupancyChart from "./OccupancyChart";
import WeekdayChart from "./WeekdayChart";
import RevenueChart from "./RevenueChart";
import ProfitChart from "./ProfitChart";
import CostsForm from "./CostsForm";
import GapNights from "./GapNights";
import TaxSummary from "./TaxSummary";
import Pace from "./Pace";
import NextActions from "./NextActions";
import { buildActions } from "@/lib/actions";
import { calcLeadTimes, calcPace } from "@/lib/pace";
import { calcTaxYears, taxStayRows } from "@/lib/tax";
import {
  AlertCircleIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  InfoIcon,
  PlusIcon,
  ResetIcon,
} from "./icons";

interface Props {
  data: ParsedData;
  costs: Costs;
  onCostsChange: (costs: Costs) => void;
  rememberCosts?: boolean;
  onRememberCostsChange?: (remember: boolean) => void;
  onReset: () => void;
  onAddMore: () => void;
  disableAddMore?: boolean;
  isDemo?: boolean;
  /** "Today" for the forward-looking section. The demo pins it inside the sample. */
  asOf?: Date;
}

const buttonClass =
  "inline-flex items-center gap-s2 text-sm px-s3 py-s2 rounded-sm border border-line-strong bg-card text-ink-soft transition-colors duration-fast ease-brand hover:bg-surface-hover hover:text-ink disabled:bg-interactive-disabled-bg disabled:text-interactive-disabled-ink disabled:border-line disabled:cursor-not-allowed";

function SectionHeading({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mb-s4">
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      <p className="text-sm text-slate">{sub}</p>
    </div>
  );
}

function BreakEvenVerdict({
  needed,
  actual,
  losingMonths,
  totalMonths,
}: {
  needed: number | null;
  actual: number;
  losingMonths: number;
  totalMonths: number;
}) {
  // An average can clear break-even while most months lose money — a strong
  // summer carrying a long winter. Say so rather than let the average hide it.
  const seasonal =
    losingMonths > 0 ? (
      <>
        {" "}
        But {losingMonths} of {totalMonths} months lost money — see which below.
      </>
    ) : null;
  if (needed === null) {
    return (
      <div className="state state-danger">
        <AlertCircleIcon className="state-icon" />
        <span>
          <strong className="font-semibold">Each stay costs more than it earns.</strong> More
          bookings won&rsquo;t fix this — raise the nightly price, the cleaning fee, or the minimum
          stay.
        </span>
      </div>
    );
  }
  const n = (x: number) => `${formatCount(x)} night${x === 1 ? "" : "s"}`;
  if (actual >= needed) {
    const mostlyLosing = losingMonths * 2 > totalMonths;
    return (
      <div className={`state ${mostlyLosing ? "state-attention" : "state-success"}`}>
        {mostlyLosing ? (
          <AlertTriangleIcon className="state-icon" />
        ) : (
          <CheckCircleIcon className="state-icon" />
        )}
        <span>
          <strong className="font-semibold">
            You need {n(needed)} a month to cover your costs.
          </strong>{" "}
          You&rsquo;ve averaged {formatCount(actual)}, a cushion of{" "}
          {formatCount(Math.round((actual - needed) * 10) / 10)}.{seasonal}
        </span>
      </div>
    );
  }
  return (
    <div className="state state-attention">
      <AlertTriangleIcon className="state-icon" />
      <span>
        <strong className="font-semibold">You need {n(needed)} a month to cover your costs.</strong>{" "}
        You&rsquo;ve averaged {formatCount(actual)}, about{" "}
        {formatCount(Math.round((needed - actual) * 10) / 10)} short.{seasonal}
      </span>
    </div>
  );
}

export default function Dashboard({
  data,
  costs,
  onCostsChange,
  rememberCosts,
  onRememberCostsChange,
  onReset,
  onAddMore,
  disableAddMore,
  isDemo,
  asOf,
}: Props) {
  const { reservations, payouts } = data;

  const monthlyOccupancy = useMemo(() => calcMonthlyOccupancy(reservations), [reservations]);
  const weekdayOccupancy = useMemo(() => calcWeekdayOccupancy(reservations), [reservations]);
  const monthlyRevenue = useMemo(() => calcMonthlyRevenue(payouts), [payouts]);

  const totalNights = totalBookedNights(reservations);
  const avgOcc = avgOccupancyPct(monthlyOccupancy);
  const revenue = totalRevenue(payouts);
  const hasRevenue = payouts.length > 0;

  // "Today" for everything forward-looking. The demo pins it inside the
  // sample so upcoming gaps and pace have a future to show.
  const paceAsOf = useMemo(() => asOf ?? new Date(), [asOf]);

  const nightValue = useMemo(() => incomePerNight(reservations, payouts), [reservations, payouts]);
  const gapReport = useMemo(
    () => calcGapNights(reservations, nightValue, paceAsOf, data.blocked),
    [reservations, nightValue, paceAsOf, data.blocked]
  );
  const monthlyProfit = useMemo(
    () => calcMonthlyProfit(reservations, payouts, costs),
    [reservations, payouts, costs]
  );
  const breakEven = useMemo(
    () => calcBreakEven(reservations, payouts, costs),
    [reservations, payouts, costs]
  );

  const pace = useMemo(() => calcPace(reservations, paceAsOf), [reservations, paceAsOf]);
  const leadTimes = useMemo(() => calcLeadTimes(reservations), [reservations]);

  const taxYears = useMemo(
    () => calcTaxYears(reservations, payouts, costs),
    [reservations, payouts, costs]
  );

  const hasIncome = nightValue > 0;
  const hasCosts = costs.monthlyFixed > 0 || costs.perStay > 0;
  const actions = useMemo(
    () =>
      buildActions({
        asOf: paceAsOf,
        gaps: gapReport,
        pace,
        lead: leadTimes,
        breakEven,
        hasIncome,
        hasCosts,
        hasReservations: reservations.length > 0,
        nightValue,
        taxYears,
      }),
    [
      paceAsOf,
      gapReport,
      pace,
      leadTimes,
      breakEven,
      hasIncome,
      hasCosts,
      reservations.length,
      nightValue,
      taxYears,
    ]
  );

  const netProfit = monthlyProfit.reduce((sum, m) => sum + m.profit, 0);
  const profitSpan =
    monthlyProfit.length > 0
      ? `${monthlyProfit[0].label} – ${monthlyProfit[monthlyProfit.length - 1].label}`
      : undefined;

  return (
    <main className="min-h-screen px-s4 py-s6">
      <div className="max-w-measure mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-s6 flex-wrap gap-s3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink">HostStats</h1>
            <p className="text-sm text-slate mt-s1">
              What your Airbnb actually earns, and where it&rsquo;s leaking money
            </p>
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
              listing. It pretends today is{" "}
              {paceAsOf.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}{" "}
              so there&rsquo;s a future to look at. Press <em>Start over</em> to upload your own
              Airbnb export.
            </span>
          </div>
        )}

        <NextActions actions={actions} />

        {/* Profit — the part Airbnb can't show, because it doesn't know your costs */}
        <section id="profit" className="mb-s7 scroll-mt-s5">
          <SectionHeading title="Profit" sub="Payouts minus what the place costs to run" />
          <div className="space-y-s4">
            <CostsForm
              costs={costs}
              onChange={onCostsChange}
              remember={rememberCosts}
              onRememberChange={onRememberCostsChange}
            />
            {!hasIncome ? (
              <div className="state state-info">
                <InfoIcon className="state-icon" />
                <span>
                  <strong className="font-semibold">Add an Earnings CSV</strong> to see profit.
                </span>
              </div>
            ) : !hasCosts ? (
              <div className="state state-info">
                <InfoIcon className="state-icon" />
                <span>
                  <strong className="font-semibold">Enter your costs above</strong> to see your
                  profit and how many nights a month you need to break even. You earn about{" "}
                  {formatMoney(nightValue)} per booked night after Airbnb&rsquo;s fees.
                </span>
              </div>
            ) : (
              <>
                {reservations.length > 0 && (
                  <BreakEvenVerdict
                    needed={breakEven.nightsPerMonth}
                    actual={breakEven.actualNightsPerMonth}
                    losingMonths={monthlyProfit.filter((m) => m.profit < 0).length}
                    totalMonths={monthlyProfit.length}
                  />
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-s3">
                  <MetricCard
                    label="Net Profit"
                    value={formatMoney(netProfit)}
                    sub={profitSpan}
                    highlight
                  />
                  {totalNights > 0 && (
                    <MetricCard
                      label="Profit / Night"
                      value={formatMoney(netProfit / totalNights)}
                      sub={`of ${formatMoney(nightValue)} earned`}
                    />
                  )}
                  {breakEven.nightsPerMonth !== null && reservations.length > 0 && (
                    <MetricCard
                      label="Break-even Nights"
                      value={formatCount(breakEven.nightsPerMonth)}
                      sub={`a month · ${breakEven.occupancyPct}% occupancy`}
                    />
                  )}
                </div>
                {monthlyProfit.length > 0 && <ProfitChart data={monthlyProfit} />}
              </>
            )}
          </div>
        </section>

        {reservations.length > 0 && (
          <section id="gaps" className="mb-s7 scroll-mt-s5">
            <SectionHeading
              title="Gap nights"
              sub="Short empty stretches stuck between two stays"
            />
            <GapNights report={gapReport} nightValue={nightValue} />
          </section>
        )}

        {reservations.length > 0 && (
          <section id="pace" className="mb-s7 scroll-mt-s5">
            <SectionHeading
              title="Pace"
              sub="How the coming months are filling, and when guests book"
            />
            <Pace pace={pace} lead={leadTimes} asOf={paceAsOf} />
          </section>
        )}

        {taxYears.length > 0 && (
          <section id="tax" className="mb-s7 scroll-mt-s5">
            <SectionHeading
              title="Tax season"
              sub="Year totals for a US return — checked against your Airbnb tax forms, not instead of them"
            />
            <TaxSummary years={taxYears} rowsFor={(year) => taxStayRows(reservations, year)} />
          </section>
        )}

        <SectionHeading title="Bookings" sub="Occupancy and earnings over time" />

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
