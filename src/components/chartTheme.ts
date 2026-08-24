/**
 * Shared chart theming, pulled from the design system's validated palette.
 *
 * Every value here is a `var(--…)` reference, never a literal. SVG `fill` and
 * `stroke` resolve custom properties, so the charts follow the light/dark
 * switch the same way the rest of the page does.
 *
 * SLOT ASSIGNMENT — fixed, never cycled.
 * tokens.chart.css is explicit that the ORDER is the colourblind-safety
 * mechanism: the palette's adjacent-pair separation is measured in slot order,
 * so reassigning slots silently breaks it. Each of the three charts here shows
 * a single series, and each series is a distinct entity, so each gets one slot
 * mapped once by name — not by position on the page, and not by rank.
 *
 * Slots 3/4/5 fall below 3:1 on light mode and are legal only with a visible
 * direct label. `earnings` uses slot 3, and satisfies that: the chart carries a
 * heading, a labelled Y axis, and a tooltip, so the colour is never the only
 * thing identifying the mark.
 */

export const CHART_SERIES = {
  occupancy: "var(--chart-1)",
  bookedNights: "var(--chart-2)",
  earnings: "var(--chart-3)",
} as const;

/** Axes and gridlines are recessive by design — the data is the ink. */
export const gridStroke = "var(--chart-grid)";

/** Axis text wears a text token, never the series colour. */
export const axisTick = {
  fontSize: 12,
  fill: "var(--chart-axis)",
} as const;

export const tooltipStyle = {
  contentStyle: {
    background: "var(--card)",
    border: "1px solid var(--line-strong)",
    borderRadius: "var(--radius-sm)",
    color: "var(--ink)",
    fontSize: "var(--text-sm)",
    boxShadow: "var(--shadow-2)",
  },
  labelStyle: { color: "var(--ink-soft)" },
  itemStyle: { color: "var(--ink)" },
  cursor: { fill: "var(--surface-hover)" },
} as const;
