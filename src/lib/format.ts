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
