import { LeadTimes, PaceMonth, Reservation } from "./models";
import { dayKey } from "./dates";
import { isActive, stayNights } from "./calculations";

/**
 * Looking forward instead of back: how full the coming months are compared
 * with the same point last year, and how far ahead guests book.
 *
 * Both need the "Booked" date from Airbnb's reservations export. Cancelled
 * stays are left out on both sides — we don't know when they were cancelled,
 * so counting them would make last year look fuller than it really was.
 */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

function yearEarlier(d: Date): Date {
  return new Date(d.getFullYear() - 1, d.getMonth(), d.getDate());
}

/**
 * Nights booked in a month, counted once per listing per night. `bookedBy`
 * limits it to stays booked on or before that day; a stay with no booking
 * date only counts when `assumeBooked` says it must already have been.
 */
function nightsInMonth(
  reservations: Reservation[],
  year: number,
  month: number,
  bookedBy?: Date,
  assumeBooked = true
): { nights: number; unknown: number } {
  const seen = new Set<string>();
  let unknown = 0;
  for (const r of reservations) {
    if (!isActive(r)) continue;
    if (bookedBy) {
      if (r.bookedAt === undefined) {
        if (!assumeBooked) {
          const overlaps =
            r.checkIn < new Date(year, month + 1, 1) && r.checkOut > new Date(year, month, 1);
          if (overlaps) unknown++;
          continue;
        }
      } else if (r.bookedAt > bookedBy) continue;
    }
    for (const night of stayNights(r.checkIn, r.checkOut)) {
      if (night.getFullYear() === year && night.getMonth() === month) {
        seen.add(`${r.listingName ?? ""}|${dayKey(night)}`);
      }
    }
  }
  return { nights: seen.size, unknown };
}

/**
 * The next `months` months (starting with the one `asOf` falls in), each
 * compared with the same month last year as it stood on the same day.
 */
export function calcPace(reservations: Reservation[], asOf: Date, months = 3): PaceMonth[] {
  const asOfDay = new Date(asOf.getFullYear(), asOf.getMonth(), asOf.getDate(), 23, 59, 59);
  const lastYearDay = yearEarlier(asOfDay);
  lastYearDay.setHours(23, 59, 59);

  const out: PaceMonth[] = [];
  for (let i = 0; i < months; i++) {
    const ref = new Date(asOf.getFullYear(), asOf.getMonth() + i, 1);
    const y = ref.getFullYear();
    const m = ref.getMonth();

    // This year: anything in the data with no booking date (a calendar feed,
    // say) is on the books by definition when asOf is today.
    const now = nightsInMonth(reservations, y, m, asOfDay, true).nights;

    const finalLastYear = nightsInMonth(reservations, y - 1, m).nights;
    const sameLastYear = nightsInMonth(reservations, y - 1, m, lastYearDay, false);
    const hasLastYear = finalLastYear > 0;

    out.push({
      month: `${y}-${String(m + 1).padStart(2, "0")}`,
      label: `${MONTHS[m]} ${y}`,
      daysInMonth: new Date(y, m + 1, 0).getDate(),
      nightsNow: now,
      // Without booking dates for last year's stays, the comparison is a guess. Say nothing.
      lastYearSamePoint: hasLastYear && sameLastYear.unknown === 0 ? sameLastYear.nights : null,
      lastYearFinal: hasLastYear ? finalLastYear : null,
    });
  }
  return out;
}

/** How far ahead guests book, overall and by check-in month. */
export function calcLeadTimes(reservations: Reservation[]): LeadTimes | null {
  const leads: { month: number; days: number }[] = [];
  for (const r of reservations) {
    if (!isActive(r) || !r.bookedAt) continue;
    const days = daysBetween(r.bookedAt, r.checkIn);
    if (days < 0) continue; // a booked date after check-in is bad data
    leads.push({ month: r.checkIn.getMonth(), days });
  }
  if (leads.length === 0) return null;

  return {
    stays: leads.length,
    medianDays: median(leads.map((l) => l.days)),
    lastMinuteShare: leads.filter((l) => l.days <= 7).length / leads.length,
    byMonth: MONTHS.map((label, month) => {
      const days = leads.filter((l) => l.month === month).map((l) => l.days);
      return { month, label, medianDays: days.length ? median(days) : null, stays: days.length };
    }),
  };
}

/**
 * "Stays in July book a median 88 days ahead, so set July prices by early
 * April." Picks the month guests book furthest ahead (with at least two
 * stays, so one odd booking can't decide it).
 */
export function pricingDeadline(
  lead: LeadTimes,
  today: Date = new Date()
): { month: string; medianDays: number; setBy: string } | null {
  const candidates = lead.byMonth.filter((m) => m.medianDays !== null && m.stays >= 2);
  if (candidates.length === 0) return null;
  const top = candidates.reduce((a, b) => (b.medianDays! > a.medianDays! ? b : a));

  // The next time that month comes round.
  let year = today.getFullYear();
  if (new Date(year, top.month, 1) <= today) year++;
  const deadline = new Date(year, top.month, 1);
  deadline.setDate(deadline.getDate() - top.medianDays!);

  const day = deadline.getDate();
  const part = day <= 10 ? "early" : day <= 20 ? "mid" : "late";
  return {
    month: MONTHS_LONG[top.month],
    medianDays: top.medianDays!,
    setBy: `${part} ${MONTHS_LONG[deadline.getMonth()]}`,
  };
}

const MONTHS_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
