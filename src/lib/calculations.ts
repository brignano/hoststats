import {
  Reservation,
  Payout,
  MonthlyOccupancy,
  WeekdayOccupancy,
  MonthlyRevenue,
  Costs,
  MonthlyProfit,
  BreakEven,
  GapReport,
  GapStretch,
} from "./models";
import { dayKey, monthKey } from "./dates";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function monthLabel(date: Date): string {
  return `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** Enumerate every night of a stay (check-in to check-out, exclusive of check-out) */
function stayNights(checkIn: Date, checkOut: Date): Date[] {
  const nights: Date[] = [];
  const cur = new Date(checkIn);
  while (cur < checkOut) {
    nights.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return nights;
}

/** Every "YYYY-MM" from `first` to `last` inclusive, so empty months show up as empty. */
function monthRange(first: string, last: string): string[] {
  const [y0, m0] = first.split("-").map(Number);
  const [y1, m1] = last.split("-").map(Number);
  const keys: string[] = [];
  for (let y = y0, m = m0; y < y1 || (y === y1 && m <= m1); m === 12 ? (y++, (m = 1)) : m++) {
    keys.push(`${y}-${String(m).padStart(2, "0")}`);
  }
  return keys;
}

function labelForKey(key: string): string {
  const [year, month] = key.split("-").map(Number);
  return monthLabel(new Date(year, month - 1, 1));
}

/** Whole calendar days from `a` to `b`. Rounded, so a DST shift can't make it 4.96. */
function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

/** Only count reservations that are not explicitly cancelled */
function isActive(r: Reservation): boolean {
  const s = r.status.toLowerCase();
  return !s.includes("cancel");
}

export function calcMonthlyOccupancy(
  reservations: Reservation[]
): MonthlyOccupancy[] {
  // Collect all booked nights per month
  const bookedByMonth = new Map<string, Set<string>>();

  for (const r of reservations) {
    if (!isActive(r)) continue;
    for (const night of stayNights(r.checkIn, r.checkOut)) {
      const key = monthKey(night);
      if (!bookedByMonth.has(key)) bookedByMonth.set(key, new Set());
      bookedByMonth.get(key)!.add(dayKey(night));
    }
  }

  if (bookedByMonth.size === 0) return [];

  // Include the months in between that had no bookings at all. Leaving them
  // out made the average describe only the good months.
  const sortedKeys = Array.from(bookedByMonth.keys()).sort();
  const allKeys = monthRange(sortedKeys[0], sortedKeys[sortedKeys.length - 1]);

  return allKeys.map((key) => {
    const [year, monthIdx] = key.split("-").map(Number);
    const total = daysInMonth(year, monthIdx - 1);
    const booked = bookedByMonth.get(key)?.size ?? 0;
    return {
      month: key,
      label: labelForKey(key),
      bookedNights: booked,
      totalNights: total,
      occupancyPct: Math.round((booked / total) * 100),
    };
  });
}

export function calcWeekdayOccupancy(
  reservations: Reservation[]
): WeekdayOccupancy[] {
  const counts = new Array(7).fill(0);

  for (const r of reservations) {
    if (!isActive(r)) continue;
    for (const night of stayNights(r.checkIn, r.checkOut)) {
      counts[night.getDay()]++;
    }
  }

  return WEEKDAYS.map((weekday, i) => ({
    weekday,
    bookedNights: counts[i],
  }));
}

export function calcMonthlyRevenue(payouts: Payout[]): MonthlyRevenue[] {
  const revenueByMonth = new Map<string, number>();
  const labelByMonth = new Map<string, string>();

  for (const p of payouts) {
    if (p.amount <= 0) continue; // skip fees / adjustments
    const key = monthKey(p.date);
    revenueByMonth.set(key, (revenueByMonth.get(key) ?? 0) + p.amount);
    labelByMonth.set(key, monthLabel(p.date));
  }

  return Array.from(revenueByMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, revenue]) => ({
      month,
      label: labelByMonth.get(month)!,
      revenue: Math.round(revenue * 100) / 100,
    }));
}

export function totalRevenue(payouts: Payout[]): number {
  return payouts
    .filter((p) => p.amount > 0)
    .reduce((sum, p) => sum + p.amount, 0);
}

export function totalBookedNights(reservations: Reservation[]): number {
  return reservations
    .filter(isActive)
    .reduce((sum, r) => sum + r.nights, 0);
}

export function avgOccupancyPct(monthlyData: MonthlyOccupancy[]): number {
  if (monthlyData.length === 0) return 0;
  return Math.round(
    monthlyData.reduce((sum, m) => sum + m.occupancyPct, 0) /
      monthlyData.length
  );
}

/**
 * Income by month. The earnings export is the real money, so it wins when
 * present. Without it, fall back to the payout column of the reservations
 * export, spread evenly across the nights of each stay.
 */
export function calcMonthlyIncome(
  reservations: Reservation[],
  payouts: Payout[]
): Map<string, number> {
  const byMonth = new Map<string, number>();
  if (payouts.length > 0) {
    for (const m of calcMonthlyRevenue(payouts)) byMonth.set(m.month, m.revenue);
    return byMonth;
  }
  for (const r of reservations) {
    if (!isActive(r) || !r.payoutAmount) continue;
    const nights = stayNights(r.checkIn, r.checkOut);
    if (nights.length === 0) continue;
    const perNight = r.payoutAmount / nights.length;
    for (const night of nights) {
      const key = monthKey(night);
      byMonth.set(key, (byMonth.get(key) ?? 0) + perNight);
    }
  }
  return byMonth;
}

/** Average income per booked night, after Airbnb's fees. 0 if we can't tell. */
export function incomePerNight(reservations: Reservation[], payouts: Payout[]): number {
  const active = reservations.filter(isActive);
  const nights = active.reduce((sum, r) => sum + r.nights, 0);
  if (payouts.length > 0) {
    return nights > 0 ? totalRevenue(payouts) / nights : 0;
  }
  const paid = active.filter((r) => (r.payoutAmount ?? 0) > 0);
  const paidNights = paid.reduce((sum, r) => sum + r.nights, 0);
  const paidTotal = paid.reduce((sum, r) => sum + (r.payoutAmount ?? 0), 0);
  return paidNights > 0 ? paidTotal / paidNights : 0;
}

/**
 * Income minus costs, month by month. Fixed costs land on every month in the
 * span, booked or not — that is the whole point of showing them. Per-stay
 * costs land on the month the guest checks in.
 */
export function calcMonthlyProfit(
  reservations: Reservation[],
  payouts: Payout[],
  costs: Costs
): MonthlyProfit[] {
  const income = calcMonthlyIncome(reservations, payouts);
  const staysByMonth = new Map<string, number>();
  for (const r of reservations) {
    if (!isActive(r)) continue;
    const key = monthKey(r.checkIn);
    staysByMonth.set(key, (staysByMonth.get(key) ?? 0) + 1);
  }

  const keys = [...income.keys(), ...staysByMonth.keys()].sort();
  if (keys.length === 0) return [];

  return monthRange(keys[0], keys[keys.length - 1]).map((key) => {
    const monthIncome = Math.round((income.get(key) ?? 0) * 100) / 100;
    const monthCosts = costs.monthlyFixed + costs.perStay * (staysByMonth.get(key) ?? 0);
    return {
      month: key,
      label: labelForKey(key),
      income: monthIncome,
      costs: monthCosts,
      profit: Math.round((monthIncome - monthCosts) * 100) / 100,
    };
  });
}

const AVG_DAYS_PER_MONTH = 365.25 / 12;

/** How many booked nights a month it takes to cover the bills. */
export function calcBreakEven(
  reservations: Reservation[],
  payouts: Payout[],
  costs: Costs
): BreakEven {
  const active = reservations.filter(isActive);
  const nights = active.reduce((sum, r) => sum + r.nights, 0);
  const perNight = incomePerNight(reservations, payouts);
  const avgStay = active.length > 0 ? nights / active.length : 0;
  const contribution = avgStay > 0 ? perNight - costs.perStay / avgStay : perNight;

  let needed: number | null;
  if (costs.monthlyFixed <= 0) needed = 0;
  else if (contribution <= 0) needed = null;
  else needed = Math.ceil(costs.monthlyFixed / contribution);

  const months = calcMonthlyOccupancy(reservations).length;

  return {
    incomePerNight: perNight,
    contributionPerNight: contribution,
    nightsPerMonth: needed,
    occupancyPct: needed === null ? null : Math.round((needed / AVG_DAYS_PER_MONTH) * 100),
    actualNightsPerMonth: months > 0 ? Math.round((nights / months) * 10) / 10 : 0,
  };
}

/**
 * Short empty stretches wedged between two stays.
 *
 * A gap shorter than the listing's minimum stay can't be booked at all, and a
 * one- or two-night gap rarely books even when it can. We don't know the
 * minimum stay setting, so we use the shortest stay the listing has ever
 * taken as a stand-in, and always count gaps of up to two nights.
 *
 * `today` splits the gaps into money already lost and nights that can still
 * be sold.
 */
export function calcGapNights(
  reservations: Reservation[],
  nightValue: number,
  today: Date = new Date()
): GapReport {
  const active = reservations.filter(isActive).filter((r) => r.nights > 0);
  const shortestStay = active.length > 0 ? Math.min(...active.map((r) => r.nights)) : 0;
  const maxGapNights = Math.max(2, shortestStay - 1);
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  // Each listing has its own calendar.
  const byListing = new Map<string, Reservation[]>();
  for (const r of active) {
    const key = r.listingName ?? "";
    if (!byListing.has(key)) byListing.set(key, []);
    byListing.get(key)!.push(r);
  }

  const gaps: GapStretch[] = [];
  for (const [listing, stays] of byListing) {
    stays.sort((a, b) => a.checkIn.getTime() - b.checkIn.getTime());
    let lastOut = stays[0].checkOut;
    for (const stay of stays.slice(1)) {
      const gap = daysBetween(lastOut, stay.checkIn);
      if (gap >= 1 && gap <= maxGapNights) {
        gaps.push({
          listingName: listing || undefined,
          start: new Date(lastOut),
          nights: gap,
          upcoming: lastOut >= startOfToday,
        });
      }
      if (stay.checkOut > lastOut) lastOut = stay.checkOut;
    }
  }
  gaps.sort((a, b) => a.start.getTime() - b.start.getTime());

  const pastNights = gaps.filter((g) => !g.upcoming).reduce((s, g) => s + g.nights, 0);
  const upcomingNights = gaps.filter((g) => g.upcoming).reduce((s, g) => s + g.nights, 0);

  return {
    maxGapNights,
    shortestStay,
    gaps,
    pastNights,
    pastValue: pastNights * nightValue,
    upcomingNights,
    upcomingValue: upcomingNights * nightValue,
  };
}
