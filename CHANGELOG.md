# Changelog

Notable changes per release. Each `## vX.Y.Z` section becomes the body of the
matching GitHub release — `.github/workflows/release.yml` reads it out of this
file when the tag is pushed, so this is the copy people actually see.

## v0.1.0 — 2026-08-24

The first tagged point in HostStats' history — the MVP that's live at
[hoststats.brignano.io](https://hoststats.brignano.io).

HostStats takes the CSV exports from your Airbnb hosting dashboard and turns them into occupancy, booking-trend and earnings charts. Every file is parsed in the browser. There is no account, no upload, and no server that could leak a year of someone's bookings.

**Not affiliated with Airbnb.** HostStats is an independent open-source tool.

### What works

- Occupancy % by month, booked nights by day of week, earnings by month
- Multiple CSVs uploaded at once, with more added later from the dashboard
- "See it with example data" — watch it work before hunting down your own exports
- Mobile-friendly, large-print layout; installable to a phone home screen
- Light and dark, following the system setting

### What went into it

**Correctness.** Calendar dates were parsed as UTC midnight but read back with local getters, so west of UTC every night shifted a day — a March 1 booking counted as February 29, and weekday stats were off by one. Date-only values now parse as local midnight, and the test suite runs under UTC, `America/New_York` and `Pacific/Auckland` on every commit so a hemisphere-specific regression can't pass CI.

**Weight.** Recharts (473 KB) and PapaParse both loaded on first paint despite being unreachable until a file is dropped. Both are imported on demand: initial JS went from 1013 KB to 607 KB raw, 289 KB to 183 KB gzipped.

**Hosting.** Static export on Cloudflare Workers, deployed from `main`. Access is gated by Cloudflare Access — a one-time emailed code, or Google sign-in. Immutable caching for static assets, plus CSP, `nosniff`, frame-deny and a locked-down `Permissions-Policy`.

**Presentation.** Styled with the shared `@brignano/design` system, so colour, type, space and motion come from tokens rather than hardcoded values. Chart series use a validated colourblind-safe palette assigned in fixed slot order. State messages carry an icon and a word, so colour is never the only signal.

**A privacy page** at `/privacy` describing what the app actually does: no collection, no transmission, no storage, no analytics, no cookies.

### Known limits

- Dark mode follows `prefers-color-scheme` only — there's no manual toggle yet
- The design system is pinned to a git SHA rather than an npm range, pending a published `0.2.0`
- Node 22 or newer is required to build (Wrangler 4 requires it)
- Parsing is built around Airbnb's current CSV shape; a change on their end will need a change here

### Deploying

Pushes to `main` deploy automatically. Full walkthrough — custom domain, sign-in options, and the gotchas — is in [docs/DEPLOYING.md](https://github.com/brignano/hoststats/blob/main/docs/DEPLOYING.md).
