import Papa from "papaparse";
import { Payout } from "../models";

const COLUMN_MAP: Record<string, string[]> = {
  date: ["date", "transaction date", "payout date", "paid date", "paid on"],
  type: ["type", "transaction type", "payout type", "description type"],
  amount: [
    "amount",
    "total",
    "payout",
    "earnings",
    "gross earnings",
    "net amount",
  ],
  description: ["description", "details", "note", "notes"],
  confirmationCode: [
    "confirmation code",
    "confirmation_code",
    "reservation",
    "reference",
  ],
};

const REQUIRED = ["date", "amount"] as const;

function findColumn(
  headers: string[],
  canonical: string
): string | undefined {
  const synonyms = COLUMN_MAP[canonical] ?? [];
  return headers.find((h) =>
    synonyms.includes(h.toLowerCase().trim())
  );
}

function parseDate(raw: string): Date {
  const d = new Date(raw.trim());
  if (isNaN(d.getTime())) throw new Error(`Cannot parse date: "${raw}"`);
  return d;
}

export function isEarningsCSV(headers: string[]): boolean {
  const lower = headers.map((h) => h.toLowerCase().trim());
  const hasAmount = COLUMN_MAP.amount.some((s) => lower.includes(s));
  const hasDate = COLUMN_MAP.date.some((s) => lower.includes(s));
  // Earnings CSVs typically do NOT have check-in/check-out columns
  const hasCheckIn = ["check-in", "checkin", "check in", "arrival"].some((s) =>
    lower.includes(s)
  );
  return hasAmount && hasDate && !hasCheckIn;
}

export function parseEarningsCSV(csvText: string): Payout[] {
  const { data, errors } = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  if (errors.length && data.length === 0) {
    throw new Error(`CSV parse error: ${errors[0].message}`);
  }

  const headers = Object.keys(data[0] ?? {});

  for (const req of REQUIRED) {
    if (!findColumn(headers, req)) {
      throw new Error(
        `Earnings CSV is missing a required column. ` +
          `Expected one of: ${COLUMN_MAP[req].join(", ")}`
      );
    }
  }

  const dateCol = findColumn(headers, "date")!;
  const typeCol = findColumn(headers, "type");
  const amountCol = findColumn(headers, "amount")!;
  const descCol = findColumn(headers, "description");
  const codeCol = findColumn(headers, "confirmationCode");

  const payouts: Payout[] = [];

  for (const row of data) {
    const rawAmount = row[amountCol]?.replace(/[^0-9.\-]/g, "") ?? "0";
    const amount = parseFloat(rawAmount);
    if (isNaN(amount)) continue;

    payouts.push({
      date: parseDate(row[dateCol]),
      type: typeCol ? (row[typeCol]?.trim() ?? "payout") : "payout",
      amount,
      description: descCol ? row[descCol]?.trim() : undefined,
      confirmationCode: codeCol ? row[codeCol]?.trim() : undefined,
    });
  }

  return payouts;
}
