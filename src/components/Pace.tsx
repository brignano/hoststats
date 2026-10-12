"use client";

import { memo } from "react";
import { LeadTimes, PaceMonth } from "@/lib/models";
import { formatCount } from "@/lib/format";
import { pricingDeadline } from "@/lib/pace";
import MetricCard from "./MetricCard";
import LeadTimeChart from "./LeadTimeChart";
import { AlertTriangleIcon, CheckCircleIcon, InfoIcon } from "./icons";

interface Props {
  pace: PaceMonth[];
  lead: LeadTimes | null;
  asOf: Date;
}

const nights = (n: number) => `${formatCount(n)} night${n === 1 ? "" : "s"}`;

function Meter({
  value,
  max,
  label,
  color,
}: {
  value: number;
  max: number;
  label: string;
  color: string;
}) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="flex items-center gap-s2 text-xs text-muted">
      <span className="w-24 shrink-0">{label}</span>
      <span className="relative flex-1 h-2 rounded-sm bg-surface-hover overflow-hidden">
        <span
          className="absolute inset-y-0 left-0 rounded-sm"
          style={{ width: `${pct}%`, background: color }}
        />
      </span>
      <span className="w-14 shrink-0 text-right font-mono tabular-nums text-ink-soft">
        {formatCount(value)}
      </span>
    </div>
  );
}

function PaceRows({ pace }: { pace: PaceMonth[] }) {
  return (
    <div className="bg-card rounded border border-line shadow-1 p-s5 space-y-s4">
      {pace.map((m) => (
        <div key={m.month}>
          <div className="flex items-baseline justify-between gap-s2 mb-s2">
            <h3 className="text-sm font-medium text-ink">{m.label}</h3>
            <span className="text-xs text-muted font-mono tabular-nums">
              {Math.round((m.nightsNow / (m.daysInMonth * m.listings)) * 100)}% booked
            </span>
          </div>
          <div className="space-y-s1">
            <Meter
              value={m.nightsNow}
              max={m.daysInMonth * m.listings}
              label="Booked now"
              color="var(--chart-1)"
            />
            {m.lastYearSamePoint !== null && (
              <Meter
                value={m.lastYearSamePoint}
                max={m.daysInMonth * m.listings}
                label="Last year by now"
                color="var(--slate)"
              />
            )}
          </div>
          {m.lastYearFinal !== null && (
            <p className="text-xs text-muted mt-s1">
              Last year this month finished at {nights(m.lastYearFinal)}.
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function PaceVerdict({ pace }: { pace: PaceMonth[] }) {
  const compared = pace.filter((m) => m.lastYearSamePoint !== null);
  if (compared.length === 0) {
    return (
      <div className="state state-info">
        <InfoIcon className="state-icon" />
        <span>
          <strong className="font-semibold">No comparison yet.</strong> Add last year&rsquo;s
          reservations export, with its &ldquo;Booked&rdquo; dates, to see whether you&rsquo;re
          ahead of or behind last year.
        </span>
      </div>
    );
  }

  const now = compared.reduce((s, m) => s + m.nightsNow, 0);
  const then = compared.reduce((s, m) => s + m.lastYearSamePoint!, 0);
  const lateLastYear = compared.reduce((s, m) => s + (m.lastYearFinal! - m.lastYearSamePoint!), 0);
  const diff = now - then;

  if (diff < 0) {
    return (
      <div className="state state-attention">
        <AlertTriangleIcon className="state-icon" />
        <span>
          <strong className="font-semibold">{nights(-diff)} behind last year&rsquo;s pace.</strong>{" "}
          {lateLastYear > 0 ? (
            <>
              Not final yet: last year {nights(lateLastYear)} for these months were booked after
              this date. If you stay behind, a small price cut on the emptiest dates usually works
              better than a big one later.
            </>
          ) : (
            <>Last year these months were already full by now, so this gap may not close.</>
          )}
        </span>
      </div>
    );
  }

  const wellAhead = then > 0 && diff / then >= 0.2;
  return (
    <div className="state state-success">
      <CheckCircleIcon className="state-icon" />
      <span>
        <strong className="font-semibold">
          {diff === 0 ? "On last year’s pace." : `${nights(diff)} ahead of last year’s pace.`}
        </strong>{" "}
        {wellAhead
          ? "Booking up this much faster than last year can mean your prices are too low for these dates."
          : "Keep an eye on the emptiest dates as they get closer."}
      </span>
    </div>
  );
}

/**
 * Forward-looking: are the next few months filling as fast as last year, and
 * how far ahead do guests book? Airbnb's dashboards look backwards; this is
 * what decides when to change prices.
 */
function Pace({ pace, lead, asOf }: Props) {
  const deadline = lead ? pricingDeadline(lead, asOf) : null;

  return (
    <div className="space-y-s4">
      {pace.some((m) => m.nightsNow > 0 || m.lastYearFinal) && (
        <>
          <PaceVerdict pace={pace} />
          <PaceRows pace={pace} />
        </>
      )}

      {lead ? (
        <>
          <div className="grid grid-cols-2 gap-s3">
            <MetricCard
              label="Typical Lead Time"
              value={`${formatCount(lead.medianDays)} days`}
              sub={`median of ${formatCount(lead.stays)} stays`}
            />
            <MetricCard
              label="Last-Minute"
              value={`${Math.round(lead.lastMinuteShare * 100)}%`}
              sub="of stays booked within a week"
            />
          </div>
          {deadline && (
            <div className="state state-info">
              <InfoIcon className="state-icon" />
              <span>
                <strong className="font-semibold">
                  {deadline.month} stays book a median {deadline.medianDays} days ahead.
                </strong>{" "}
                Have {deadline.month} prices right by {deadline.setBy} — after that most of the
                month is already sold at whatever price was showing.
              </span>
            </div>
          )}
          <LeadTimeChart data={lead.byMonth} />
        </>
      ) : (
        <div className="state state-info">
          <InfoIcon className="state-icon" />
          <span>
            <strong className="font-semibold">No booking dates found.</strong> Airbnb&rsquo;s
            reservations export has a &ldquo;Booked&rdquo; column; upload that file to see how far
            ahead guests book.
          </span>
        </div>
      )}
    </div>
  );
}

// Memoised: the dashboard re-renders on every keystroke in the costs form,
// and this only needs to redraw when its own data changes.
export default memo(Pace);
