import type { Config } from "tailwindcss";

/**
 * Tailwind v3 bridge for @brignano/design.
 *
 * The design system ships `tailwind.css`, but that uses v4's `@theme inline`
 * and this repo is on Tailwind 3.4. This config is the v3 equivalent: every
 * utility resolves to `var(--token)` rather than a literal, so colours follow
 * the light/dark switch instead of freezing one theme's value.
 *
 * Keep the names aligned with the v4 bridge — if this repo moves to Tailwind
 * v4, delete this mapping and import `@brignano/design/tailwind.css` instead.
 */
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Neutral ramp
        ink: "var(--ink)",
        "ink-soft": "var(--ink-soft)",
        slate: "var(--slate)",
        bg: "var(--bg)",
        card: "var(--card)",
        line: "var(--line)",
        "line-soft": "var(--line-soft)",
        "line-strong": "var(--line-strong)",
        "surface-hover": "var(--surface-hover)",
        "surface-active": "var(--surface-active)",

        // Interactive — "you can act on this"
        interactive: "var(--i)",
        "interactive-ink": "var(--i-ink)",
        "interactive-hover": "var(--i-hover)",
        "interactive-pressed": "var(--i-pressed)",
        "interactive-surface": "var(--i-surface)",
        "interactive-line": "var(--i-line)",
        "on-interactive": "var(--on-i)",
        "interactive-disabled-bg": "var(--i-disabled-bg)",
        "interactive-disabled-ink": "var(--i-disabled-ink)",

        // State
        success: "var(--success)",
        "success-ink": "var(--success-ink)",
        "success-surface": "var(--success-surface)",
        "success-line": "var(--success-line)",
        attention: "var(--attention)",
        "attention-ink": "var(--attention-ink)",
        "attention-surface": "var(--attention-surface)",
        "attention-line": "var(--attention-line)",
        danger: "var(--danger)",
        "danger-ink": "var(--danger-ink)",
        "danger-surface": "var(--danger-surface)",
        "danger-line": "var(--danger-line)",

        // Identity — inks a graphic only, never a control. DESIGN.md §3.
        mark: "var(--mark)",
        "mark-ink": "var(--mark-ink)",
      },
      // Tailwind's preflight hardcodes gray-200 as the default border colour
      // and gray-400 for placeholders. Both are frozen light greys that would
      // stay light in dark mode — the exact failure DESIGN.md §11 describes.
      borderColor: {
        DEFAULT: "var(--line)",
      },
      placeholderColor: {
        DEFAULT: "var(--slate)",
      },
      fontFamily: {
        sans: "var(--sans)",
        mono: "var(--mono)",
      },
      // Tool-tier scale: compact, because scanning beats reading.
      fontSize: {
        xs: "var(--text-xs)",
        sm: "var(--text-sm)",
        base: "var(--text-base)",
        lg: "var(--text-lg)",
        xl: "var(--text-xl)",
        "2xl": "var(--text-2xl)",
        "3xl": "var(--text-3xl)",
        "4xl": "var(--text-4xl)",
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        DEFAULT: "var(--radius)",
        lg: "var(--radius-lg)",
      },
      boxShadow: {
        1: "var(--shadow-1)",
        2: "var(--shadow-2)",
        3: "var(--shadow-3)",
      },
      spacing: {
        s1: "var(--s1)",
        s2: "var(--s2)",
        s3: "var(--s3)",
        s4: "var(--s4)",
        s5: "var(--s5)",
        s6: "var(--s6)",
        s7: "var(--s7)",
        s8: "var(--s8)",
        s9: "var(--s9)",
      },
      maxWidth: {
        measure: "var(--measure)",
      },
      transitionTimingFunction: {
        brand: "var(--ease)",
      },
      transitionDuration: {
        fast: "150ms",
        DEFAULT: "250ms",
        slow: "600ms",
      },
    },
  },
  plugins: [],
};
export default config;
