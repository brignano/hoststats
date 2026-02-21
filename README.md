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
- [Node.js 20+](https://nodejs.org/) (see `.nvmrc`)
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
npm run build    # Production build
npm run lint     # Run ESLint
npm test         # Run Jest unit tests
npm run format   # Format with Prettier
```

---

## 🚀 Deploying on Vercel

### 1. Import the Repository
1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **"Import Git Repository"**
3. Select `brignano/hoststats`
4. Leave all settings at defaults (Vercel auto-detects Next.js)
5. Click **"Deploy"**

### 2. Environment Variables
None required for MVP — the app is fully client-side.

### 3. Node Version
Vercel will use Node 20 (specified in `.nvmrc`). You can also set it in your Vercel project settings under **General → Node.js Version**.

---

## 🌐 Custom Domain: hoststats.brignano.io

### In Vercel
1. Go to your project → **Settings → Domains**
2. Click **"Add Domain"**
3. Enter `hoststats.brignano.io` and click **"Add"**
4. Vercel will show you a **CNAME record** to configure

### In Your DNS Provider
Add a CNAME record:

| Type  | Name        | Value                     | TTL  |
|-------|-------------|---------------------------|------|
| CNAME | `hoststats` | `cname.vercel-dns.com`    | 3600 |

> **Note:** DNS propagation can take up to 48 hours, but usually completes in minutes.

### Verify
Once Vercel shows a green checkmark next to the domain, your site is live at [https://hoststats.brignano.io](https://hoststats.brignano.io).

---

## 🗂️ Project Structure

```
src/
├── app/              # Next.js App Router pages
├── components/       # UI components (charts, cards, upload)
├── lib/
│   ├── models.ts     # Canonical data types
│   ├── calculations.ts  # Stats computations
│   └── importers/    # CSV parsers (reservations + earnings)
└── __tests__/        # Jest unit tests

fixtures/             # Sample CSV files for testing
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

---

## 🛡️ Privacy

All CSV processing happens **locally in your browser**. No files are uploaded to any server. No analytics or tracking.

---

## 📝 License

MIT — see [LICENSE](LICENSE).

> HostStats is not affiliated with, endorsed by, or sponsored by Airbnb, Inc.
