/**
 * What the dashboard shows that Airbnb's doesn't, before anyone uploads a
 * thing. Each example line is the kind of sentence the dashboard actually
 * writes, so the pitch and the product say the same thing.
 */

export const FEATURES = [
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

export default function FeatureStrip() {
  return (
    <section aria-labelledby="features-heading">
      <h2 id="features-heading" className="sr-only">
        What you&rsquo;ll see
      </h2>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-s3">
        {FEATURES.map((f) => (
          <li key={f.title} className="bg-card rounded border border-line shadow-1 p-s4">
            <h3 className="text-sm font-semibold text-ink">{f.title}</h3>
            <p className="text-sm text-ink-soft mt-s1">{f.body}</p>
            <p className="text-xs text-muted font-mono mt-s2">{f.example}</p>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted mt-s2">Examples from the sample data.</p>
    </section>
  );
}
