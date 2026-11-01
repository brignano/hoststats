/**
 * What the dashboard shows that Airbnb's doesn't. Each example line is the kind
 * of sentence the dashboard actually writes, so the pitch and the product say
 * the same thing.
 *
 * These are data, not decoration: `src/__tests__/landing.test.ts` recomputes
 * every number quoted below from the real sample CSVs in `public/samples/`,
 * through the same calculation functions the dashboard uses, and asserts the
 * whole formatted sentence. Change the sample data or the maths and the test
 * fails rather than the copy going quietly stale. Keep the titles stable — the
 * test looks each feature up by `title`.
 */

export type Feature = {
  title: string;
  body: string;
  example: string;
};

export const FEATURES: Feature[] = [
  {
    title: "Profit, not payouts",
    body: "Add two rough costs and see what you actually keep, and the nights a month you need to break even.",
    example: "Profit / night: $38 of $226 earned",
  },
  {
    title: "Gap nights",
    body: "One- and two-night holes between stays rarely sell. See them, priced, while you can still fill them.",
    example: "Aug 25–26 · 2 nights stuck between stays, worth about $453",
  },
  {
    title: "Pace",
    body: "Is next month filling as fast as last year? And how far ahead do guests book each season?",
    example: "August is 15 nights behind last year",
  },
  {
    title: "Tax season",
    body: "Rents received and rental days per year, with the rules that change how US hosts are taxed.",
    example: "Download 2024 for your accountant (CSV)",
  },
];
