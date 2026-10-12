"use client";

import { useState } from "react";
import { TaxStayRow, TaxYear } from "@/lib/models";
import { formatCount, formatMoney } from "@/lib/format";
import { taxYearCsv } from "@/lib/tax";
import MetricCard from "./MetricCard";
import { AlertTriangleIcon, InfoIcon } from "./icons";

interface Props {
  years: TaxYear[];
  rowsFor: (year: number) => TaxStayRow[];
}

const tabClass = (active: boolean) =>
  `px-s3 py-s1 text-sm rounded-sm border font-mono tabular-nums transition-colors duration-fast ease-brand ${
    active
      ? "border-line-strong bg-card text-ink font-semibold"
      : "border-transparent text-slate hover:text-ink hover:bg-surface-hover"
  }`;

/**
 * Default to the most recent finished year with stays — that's the one being
 * filed. A year holding only the tail of a New Year stay isn't it.
 */
function defaultYear(years: TaxYear[]): number {
  const finished = years.filter((y) => !y.inProgress && y.stays > 0);
  return (finished.at(-1) ?? years.at(-1))!.year;
}

function download(summary: TaxYear, rows: TaxStayRow[]) {
  const blob = new Blob([taxYearCsv(summary, rows)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `hoststats-tax-${summary.year}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * The numbers a US host retypes into a spreadsheet every spring, plus the two
 * thresholds that change how rental income is taxed. Flags, not advice.
 */
export default function TaxSummary({ years, rowsFor }: Props) {
  const [selected, setSelected] = useState(() => defaultYear(years));
  const y = years.find((t) => t.year === selected) ?? years[years.length - 1];
  const soFar = y.inProgress ? " so far" : "";

  return (
    <div className="space-y-s4">
      {years.length > 1 && (
        <div role="tablist" aria-label="Tax year" className="flex flex-wrap gap-s1">
          {years.map((t) => (
            <button
              key={t.year}
              role="tab"
              aria-selected={t.year === y.year}
              onClick={() => setSelected(t.year)}
              className={tabClass(t.year === y.year)}
            >
              {t.year}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-s3">
        <MetricCard
          label="Rents Received"
          value={y.incomeSource === "none" ? "—" : formatMoney(y.rentsReceived)}
          sub={`Schedule E line 3${soFar}`}
          highlight
        />
        <MetricCard
          label="Rental Days"
          value={formatCount(y.rentalDays)}
          sub={`Schedule E line 2${soFar}`}
        />
        <MetricCard label="Stays" value={formatCount(y.stays)} sub="checked in" />
        <MetricCard label="Avg Stay" value={formatCount(y.avgStay)} sub="nights" />
      </div>

      {y.incomeSource === "reservations" && (
        <div className="state state-info">
          <InfoIcon className="state-icon" />
          <span>
            <strong className="font-semibold">Rents are estimated</strong> from reservation payouts.
            Add your Earnings CSV for exact amounts by payout date.
          </span>
        </div>
      )}

      {y.rentalDays > 0 && y.rentalDays <= 14 && (
        <div className="state state-attention">
          <AlertTriangleIcon className="state-icon" />
          <span>
            <strong className="font-semibold">Rented 14 days or fewer{soFar}.</strong> If this is
            also your home, US tax rules may let you leave this income off your return entirely —
            and in that case you can&rsquo;t deduct rental expenses either.
          </span>
        </div>
      )}

      {y.stays > 0 && y.avgStay <= 7 && (
        <div className="state state-attention">
          <AlertTriangleIcon className="state-icon" />
          <span>
            <strong className="font-semibold">Average stay is 7 nights or less.</strong> The IRS
            then doesn&rsquo;t treat this as a &ldquo;rental activity&rdquo; under its passive loss
            rules, which changes whether a loss can offset your other income. Worth raising with
            whoever does your taxes.
          </span>
        </div>
      )}

      {y.listings > 1 && (
        <div className="state state-info">
          <InfoIcon className="state-icon" />
          <span>
            <strong className="font-semibold">These totals combine {y.listings} listings.</strong>{" "}
            Schedule E needs each property in its own column; the download lists each stay with its
            listing.
          </span>
        </div>
      )}

      <div className="bg-card rounded border border-line shadow-1 p-s5 text-sm text-ink-soft">
        {y.estimatedExpenses !== null ? (
          <p>
            Your cost estimates come to{" "}
            <strong className="font-mono text-ink">{formatMoney(y.estimatedExpenses)}</strong> for{" "}
            {y.year}
            {soFar}. Schedule E wants them split by type — mortgage <em>interest</em> only, not
            principal — so treat this as a sanity check, not a figure to file.
          </p>
        ) : (
          <p>Enter your costs above to see an expense estimate for the year.</p>
        )}
        <p className="mt-s3">
          Also check: Airbnb&rsquo;s 1099-K shows gross earnings before its host fee, so it&rsquo;s
          usually higher than your payouts. The fee itself is deductible. Not tax advice.
        </p>
        <button
          type="button"
          onClick={() => download(y, rowsFor(y.year))}
          className="mt-s4 inline-flex items-center gap-s2 text-sm px-s3 py-s2 rounded-sm border border-line-strong bg-card text-ink-soft transition-colors duration-fast ease-brand hover:bg-surface-hover hover:text-ink"
        >
          Download {y.year} for your accountant (CSV)
        </button>
      </div>
    </div>
  );
}
