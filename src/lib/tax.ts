import { Costs, Payout, Reservation, TaxStayRow, TaxYear } from "./models";
import { calcMonthlyProfit, isActive, stayNights } from "./calculations";

/**
 * Year-by-year totals for tax season.
 *
 * This is bookkeeping, not tax advice: it adds up what the exports contain
 * and flags the two thresholds US hosts most often ask about. Income and
 * costs come from calcMonthlyProfit so the numbers here always agree with the
 * profit chart.
 */
interface YearNights {
  stays: number;
  stayNights: number;
  rentalDays: number;
  listings: Set<string>;
}

// Walking every night of every stay is the slow part, and it doesn't depend
// on costs. Cache it per reservations array (state arrays are replaced, never
// mutated) so typing in the costs form doesn't redo it on each keystroke.
const nightsCache = new WeakMap<Reservation[], Map<number, YearNights>>();

function countNights(reservations: Reservation[]): Map<number, YearNights> {
  const cached = nightsCache.get(reservations);
  if (cached) return cached;

  const byYear = new Map<number, YearNights>();
  const year = (y: number) => {
    if (!byYear.has(y))
      byYear.set(y, { stays: 0, stayNights: 0, rentalDays: 0, listings: new Set() });
    return byYear.get(y)!;
  };
  // Count each calendar night once per listing, so overlapping imports of
  // the same stay can't inflate rental days.
  const nightsSeen = new Set<string>();
  for (const r of reservations) {
    if (!isActive(r)) continue;
    const start = year(r.checkIn.getFullYear());
    start.stays += 1;
    start.stayNights += r.nights;
    for (const night of stayNights(r.checkIn, r.checkOut)) {
      const key = `${r.listingName ?? ""}|${night.getFullYear()}-${night.getMonth()}-${night.getDate()}`;
      if (nightsSeen.has(key)) continue;
      nightsSeen.add(key);
      const y = year(night.getFullYear());
      y.rentalDays += 1;
      y.listings.add(r.listingName ?? "");
    }
  }
  nightsCache.set(reservations, byYear);
  return byYear;
}

export function calcTaxYears(
  reservations: Reservation[],
  payouts: Payout[],
  costs: Costs,
  today: Date = new Date()
): TaxYear[] {
  const months = calcMonthlyProfit(reservations, payouts, costs);
  const hasCosts = costs.monthlyFixed > 0 || costs.perStay > 0;
  const hasStayPayouts = reservations.some((r) => isActive(r) && (r.payoutAmount ?? 0) > 0);
  const incomeSource: TaxYear["incomeSource"] =
    payouts.length > 0 ? "earnings" : hasStayPayouts ? "reservations" : "none";

  const years = new Map<number, TaxYear>();
  const stayNightsByYear = new Map<number, number>();
  const listingsByYear = new Map<number, Set<string>>();
  const get = (year: number): TaxYear => {
    if (!years.has(year)) {
      years.set(year, {
        year,
        rentsReceived: 0,
        incomeSource,
        rentalDays: 0,
        stays: 0,
        avgStay: 0,
        estimatedExpenses: hasCosts ? 0 : null,
        inProgress: year >= today.getFullYear(),
        listings: 0,
      });
      listingsByYear.set(year, new Set());
    }
    return years.get(year)!;
  };

  for (const m of months) {
    const y = get(Number(m.month.slice(0, 4)));
    y.rentsReceived += m.income;
    if (y.estimatedExpenses !== null) y.estimatedExpenses += m.costs;
  }

  const nights = countNights(reservations);
  for (const [year, n] of nights) {
    const y = get(year);
    y.stays = n.stays;
    y.rentalDays = n.rentalDays;
    stayNightsByYear.set(year, n.stayNights);
    listingsByYear.set(year, n.listings);
  }

  return [...years.values()]
    .map((y) => ({
      ...y,
      rentsReceived: Math.round(y.rentsReceived * 100) / 100,
      estimatedExpenses:
        y.estimatedExpenses === null ? null : Math.round(y.estimatedExpenses * 100) / 100,
      avgStay:
        y.stays > 0 ? Math.round(((stayNightsByYear.get(y.year) ?? 0) / y.stays) * 10) / 10 : 0,
      listings: listingsByYear.get(y.year)?.size ?? 0,
    }))
    .sort((a, b) => a.year - b.year);
}

/** The stays behind one year's numbers, for the downloadable detail. */
export function taxStayRows(reservations: Reservation[], year: number): TaxStayRow[] {
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year + 1, 0, 1);
  return reservations
    .filter((r) => isActive(r) && r.checkIn < yearEnd && r.checkOut > yearStart)
    .map((r) => ({
      id: r.id,
      listingName: r.listingName,
      checkIn: r.checkIn,
      checkOut: r.checkOut,
      nightsInYear: stayNights(r.checkIn, r.checkOut).filter((n) => n.getFullYear() === year)
        .length,
      payoutAmount: r.payoutAmount,
    }))
    .filter((row) => row.nightsInYear > 0)
    .sort((a, b) => a.checkIn.getTime() - b.checkIn.getTime());
}

function csvCell(value: string | number | undefined): string {
  if (value === undefined) return "";
  const s = String(value);
  // Quote anything with a comma, quote or newline; neutralise spreadsheet
  // formulas so a crafted listing name can't run in Excel.
  const numeric = /^-?\d+(\.\d+)?$/.test(s);
  const safe = !numeric && /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

function isoDay(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

/** A spreadsheet a host can hand to their accountant. */
export function taxYearCsv(summary: TaxYear, rows: TaxStayRow[]): string {
  const lines: (string | number | undefined)[][] = [
    [`HostStats tax summary ${summary.year}${summary.inProgress ? " (year in progress)" : ""}`],
    ["Not tax advice. Check every figure against your Airbnb tax documents."],
    [],
    ["Rents received (Schedule E line 3)", summary.rentsReceived.toFixed(2)],
    [
      "Income source",
      summary.incomeSource === "earnings"
        ? "Airbnb earnings export (payout dates)"
        : summary.incomeSource === "reservations"
          ? "Estimated from reservation payouts"
          : "None loaded",
    ],
    ["Fair rental days (Schedule E line 2)", summary.rentalDays],
    ["Stays checked in", summary.stays],
    ["Average stay (nights)", summary.avgStay],
    [
      "Your estimated expenses",
      summary.estimatedExpenses === null ? "not entered" : summary.estimatedExpenses.toFixed(2),
    ],
    [],
    [
      "Confirmation code",
      "Listing",
      "Check-in",
      "Check-out",
      `Nights in ${summary.year}`,
      "Payout",
    ],
    ...rows.map((r) => [
      r.id,
      r.listingName,
      isoDay(r.checkIn),
      isoDay(r.checkOut),
      r.nightsInYear,
      r.payoutAmount?.toFixed(2),
    ]),
  ];
  return lines.map((cells) => cells.map(csvCell).join(",")).join("\r\n") + "\r\n";
}
