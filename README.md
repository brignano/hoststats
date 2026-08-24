# 🏡 HostStats

> **Not affiliated with Airbnb.** HostStats is an independent open-source tool.

A simple, privacy-first dashboard for Airbnb hosts to understand their listing performance. Upload your Airbnb CSV exports and instantly see occupancy rates, booking trends, and earnings — all processed locally in your browser with no data sent to any server.

**Live:** [https://hoststats.brignano.io](https://hoststats.brignano.io)

---

## ✨ Features

- 📊 Occupancy % by month
- 📅 Booked nights by day of week
- 💰 Earnings by month (when earnings CSV is uploaded)
- 📱 Mobile-friendly, large-print dashboard
- 🔒 Privacy-first: all processing happens in your browser
- 📁 Upload multiple files at once
- 👀 Try it with example data before hunting down your exports
- 📲 Installable on a phone home screen

---

## 📥 Which Files to Download from Airbnb

You'll need to export CSVs from your Airbnb hosting dashboard. Here's how:

### Reservations CSV (required for occupancy stats)

1. Go to [airbnb.com/hosting/reservations](https://www.airbnb.com/hosting/reservations)
2. Click **"Export to CSV"** (usually a download icon near the top right)
3. Save the file — it will be named something like `reservations.csv`

### Earnings / Transactions CSV (optional, for revenue charts)

1. Go to [airbnb.com/hosting/payments](https://www.airbnb.com/hosting/payments)
2. Select **"Transaction History"** or **"Earnings"**
3. Click **"Export"** or **"Download CSV"**
4. Save the file

> **Tip:** Airbnb's export formats may change. HostStats uses flexible column detection to handle variations.

---

## 🖥️ Running Locally

### Prerequisites

- [Node.js 22+](https://nodejs.org/) (see `.nvmrc`) — Wrangler requires Node 22
- npm (comes with Node.js)

### Setup

```bash
# Clone the repo
git clone https://github.com/brignano/hoststats.git
cd hoststats

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Other Commands

```bash
npm run build      # Static export to ./out
npm run lint       # Run ESLint
npm run typecheck  # tsc --noEmit
npm test           # Run Jest unit tests
npm run format     # Format with Prettier
npm run preview    # Build, then serve via Wrangler locally
npm run deploy     # Build, then deploy to Cloudflare
```

---

## 🚀 Deploying

HostStats is hosted on **Cloudflare Workers** static assets, and family access is
gated by **Cloudflare Access** — a one-time emailed code, or Google sign-in.

```bash
npx wrangler login
npm run deploy
```

Pushes to `main` deploy automatically via `.github/workflows/deploy.yml` (needs
the `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` repository secrets).

Full walkthrough — custom domain, sign-in options, and the gotchas — is in
**[docs/DEPLOYING.md](docs/DEPLOYING.md)**.

---

## 🏷️ Cutting a Release

Deploying and releasing are separate: `main` goes live on every merge, while a
tag marks a named point you can come back to.

```bash
# 1. Bump the version in package.json, commit it on main
# 2. Tag that commit and push the tag
git tag v0.2.0
git push origin v0.2.0
```

`.github/workflows/release.yml` picks up any `v*` tag, re-runs the full check
suite against the tagged tree, and publishes a GitHub release with generated
notes. It refuses to publish if the tag and `package.json` version disagree —
that mismatch is invisible once a release page exists, so it fails first.

---

## 🗂️ Project Structure

```
src/
├── app/              # Next.js App Router pages
├── components/       # UI components (charts, cards, upload)
├── lib/
│   ├── models.ts        # Canonical data types
│   ├── dates.ts         # Timezone-safe date parsing
│   ├── format.ts        # Human-readable number formatting
│   ├── calculations.ts  # Stats computations
│   └── importers/       # CSV parsers (reservations + earnings)
└── __tests__/        # Jest unit tests

public/samples/       # Example CSVs powering the in-app demo
fixtures/             # Sample CSV files for testing
docs/DEPLOYING.md     # Cloudflare hosting + Access sign-in guide
wrangler.jsonc        # Cloudflare Workers config
```

---

## 🧪 Tests

```bash
npm test
```

Tests cover:

- CSV format detection (reservations vs. earnings)
- CSV parsing with the sample fixture files
- Calculation logic (occupancy %, weekday distribution, revenue)
- Timezone-safe date parsing
- Display formatting

CI runs the suite under `UTC`, `America/New_York` and `Pacific/Auckland`,
because the CSVs carry calendar dates with no timezone and the stats must not
drift either side of UTC.

---

## 🛡️ Privacy

All CSV processing happens **locally in your browser**. No files are uploaded to any server. No analytics or tracking.

The deployed instance additionally sits behind Cloudflare Access, so only
invited family members can reach it. Access authenticates the visitor before
the page loads — it never sees the CSVs, which are still parsed entirely
client-side.

---

## 📝 License

MIT — see [LICENSE](LICENSE).

> HostStats is not affiliated with, endorsed by, or sponsored by Airbnb, Inc.
