/**
 * Display formatting.
 *
 * These numbers get read on a phone by people who are not looking at a
 * spreadsheet, so prefer "$38,898" over "$38898.00".
 */

const money0 = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const money2 = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const plain = new Intl.NumberFormat("en-US");

/** Headline currency, no cents: "$38,898". */
export function formatMoney(value: number): string {
  return money0.format(value);
}

/** Exact currency for tooltips: "$1,234.56". */
export function formatMoneyExact(value: number): string {
  return money2.format(value);
}

/** Compact currency for chart axes: "$39k". */
export function formatMoneyAxis(value: number): string {
  if (Math.abs(value) >= 1000) {
    const k = value / 1000;
    return `$${Number.isInteger(k) ? k : k.toFixed(1)}k`;
  }
  return `$${value}`;
}

/** Thousands separators: "1,234". */
export function formatCount(value: number): string {
  return plain.format(value);
}

const shortDate = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
const shortDateYear = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

/** The empty nights of a gap: "Apr 15, 2024" or "Mar 11 – Mar 12, 2024". */
export function formatNightRange(start: Date, nights: number): string {
  if (nights <= 1) return shortDateYear.format(start);
  const last = new Date(start);
  last.setDate(last.getDate() + nights - 1);
  return last.getFullYear() === start.getFullYear()
    ? `${shortDate.format(start)} – ${shortDateYear.format(last)}`
    : `${shortDateYear.format(start)} – ${shortDateYear.format(last)}`;
}
