interface Props {
  label: string;
  value: string | number;
  sub?: string;
  /** Typographic emphasis only — never a colour fill. See the note below. */
  highlight?: boolean;
}

/**
 * A stat tile.
 *
 * `highlight` used to paint the card in the brand colour. The design system
 * rules that out twice over: identity inks a graphic and is never a fill
 * (DESIGN.md §3), and a tool-tier screen should show one or two coloured
 * things, not a row of them. Emphasis is carried by size and border weight
 * instead, which survives greyscale and dark mode.
 */
export default function MetricCard({ label, value, sub, highlight }: Props) {
  return (
    <div
      className={`rounded bg-card p-s5 shadow-1 border ${
        highlight ? "border-line-strong" : "border-line"
      }`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-slate mb-s2 font-mono">
        {label}
      </p>
      {/* Mono for data that must read precise — DESIGN.md §5. */}
      <p
        className={`font-mono font-semibold text-ink tabular-nums ${
          highlight ? "text-3xl" : "text-2xl"
        }`}
      >
        {value}
      </p>
      {sub && <p className="text-xs text-slate mt-s1">{sub}</p>}
    </div>
  );
}
