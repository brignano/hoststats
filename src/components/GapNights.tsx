"use client";

import { GapReport } from "@/lib/models";
import { formatCount, formatMoney, formatNightRange } from "@/lib/format";
import MetricCard from "./MetricCard";
import { AlertTriangleIcon, CheckCircleIcon } from "./icons";

interface Props {
  report: GapReport;
  /** Average income per booked night, for the "worth" line. 0 if unknown. */
  nightValue: number;
}

function gapLine(g: GapReport["gaps"][number], showListing: boolean) {
  const nights = `${g.nights} night${g.nights === 1 ? "" : "s"}`;
  return `${formatNightRange(g.start, g.nights)} · ${nights}${
    showListing && g.listingName ? ` · ${g.listingName}` : ""
  }`;
}

/**
 * Empty nights stranded between two stays. Airbnb's calendar shows them one
 * at a time; nobody adds them up or prices them.
 */
export default function GapNights({ report, nightValue }: Props) {
  const { gaps, pastNights, pastValue, upcomingNights, upcomingValue } = report;
  const past = gaps.filter((g) => !g.upcoming);
  const upcoming = gaps.filter((g) => g.upcoming);
  const showListing = new Set(gaps.map((g) => g.listingName)).size > 1;
  const blockedByMinimum = report.shortestStay > report.maxGapNights;

  if (gaps.length === 0) {
    return (
      <div className="state state-success">
        <CheckCircleIcon className="state-icon" />
        <span>
          <strong className="font-semibold">No stranded gap nights.</strong> Your stays pack
          together with no 1–{report.maxGapNights} night holes between them.
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-s4">
      {upcoming.length > 0 && (
        <div role="status" className="state state-attention">
          <AlertTriangleIcon className="state-icon" />
          <div>
            <strong className="font-semibold">
              {formatCount(upcomingNights)} upcoming gap night{upcomingNights === 1 ? "" : "s"}
              {nightValue > 0 && <> worth about {formatMoney(upcomingValue)}</>} you can still sell.
            </strong>
            <ul className="mt-s2 space-y-s1 font-mono text-sm">
              {upcoming.map((g) => (
                <li key={g.start.getTime() + (g.listingName ?? "")}>{gapLine(g, showListing)}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {past.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-s3">
            <MetricCard
              label="Gap nights"
              value={formatCount(pastNights)}
              sub={`across ${past.length} gap${past.length === 1 ? "" : "s"}`}
            />
            {nightValue > 0 && (
              <MetricCard
                label="Est. income lost"
                value={formatMoney(pastValue)}
                sub={`at ${formatMoney(nightValue)} a night`}
                highlight
              />
            )}
          </div>

          <p className="text-sm text-ink-soft">
            {blockedByMinimum ? (
              <>
                Every one of these gaps is shorter than the shortest stay you&rsquo;ve ever taken (
                {report.shortestStay} nights), so your minimum stay most likely blocked them. Set a
                shorter minimum on just the gap dates in your calendar and they become bookable.
              </>
            ) : (
              <>
                One- and two-night gaps between stays rarely book on their own. A discount on just
                those dates, or a shorter minimum stay next to existing bookings, gives them a
                chance.
              </>
            )}
          </p>

          <details className="bg-card rounded border border-line p-s4 text-sm text-ink-soft shadow-1">
            <summary className="cursor-pointer font-medium text-ink rounded-sm">
              See every gap
            </summary>
            <ul className="mt-s3 space-y-s1 font-mono">
              {past.map((g) => (
                <li key={g.start.getTime() + (g.listingName ?? "")}>{gapLine(g, showListing)}</li>
              ))}
            </ul>
          </details>
        </>
      )}
    </div>
  );
}
