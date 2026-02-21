import {
  Reservation,
  Payout,
  MonthlyOccupancy,
  WeekdayOccupancy,
  MonthlyRevenue,
} from "./models";

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

/** Return "YYYY-MM" key */
function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

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
      bookedByMonth.get(key)!.add(night.toISOString().slice(0, 10));
    }
  }

  if (bookedByMonth.size === 0) return [];

  // Sort months
  const sortedKeys = Array.from(bookedByMonth.keys()).sort();

  return sortedKeys.map((key) => {
    const [year, monthIdx] = key.split("-").map(Number);
    const total = daysInMonth(year, monthIdx - 1);
    const booked = bookedByMonth.get(key)!.size;
    const ref = new Date(year, monthIdx - 1, 1);
    return {
      month: key,
      label: monthLabel(ref),
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
