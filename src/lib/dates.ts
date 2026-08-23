/**
 * Date helpers.
 *
 * Airbnb exports calendar dates ("2024-01-12") with no timezone. `new Date()`
 * parses that shape as UTC midnight, but every stat we compute reads the date
 * back with local getters (`getDate`, `getMonth`, `getDay`). West of UTC that
 * combination shifts every night one day earlier, which quietly moves nights
 * between months and weekdays. So we parse calendar dates as *local* midnight
 * and keep every key local too.
 */

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Parse a CSV date cell. Calendar dates become local midnight. */
export function parseDate(raw: string): Date {
  const trimmed = raw?.trim() ?? "";
  if (!trimmed) throw new Error(`Cannot parse date: "${raw}"`);

  const isoDateOnly = DATE_ONLY.exec(trimmed);
  if (isoDateOnly) {
    const [, year, month, day] = isoDateOnly;
    const d = new Date(Number(year), Number(month) - 1, Number(day));
    if (isNaN(d.getTime())) throw new Error(`Cannot parse date: "${raw}"`);
    return d;
  }

  const d = new Date(trimmed);
  if (isNaN(d.getTime())) throw new Error(`Cannot parse date: "${raw}"`);
  return d;
}

/** "YYYY-MM-DD" in local time — safe as a Set key for a calendar day. */
export function dayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

/** "YYYY-MM" in local time. */
export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}
