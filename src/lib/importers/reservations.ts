import Papa from "papaparse";
import { Reservation } from "../models";

/** Synonyms for each canonical column name */
const COLUMN_MAP: Record<string, string[]> = {
  id: [
    "confirmation code",
    "confirmation_code",
    "reservation id",
    "reservation_id",
    "code",
  ],
  status: ["status", "reservation status", "reservation_status"],
  checkIn: [
    "check-in",
    "checkin",
    "check in",
    "start date",
    "start_date",
    "arrival",
  ],
  checkOut: [
    "check-out",
    "checkout",
    "check out",
    "end date",
    "end_date",
    "departure",
  ],
  nights: ["nights", "# nights", "number of nights", "nights booked"],
  guestName: [
    "guest",
    "guest name",
    "guest_name",
    "contact name",
    "contact_name",
  ],
  listingName: [
    "listing",
    "listing name",
    "listing_name",
    "property",
    "property name",
  ],
  payoutAmount: [
    "payout",
    "amount",
    "earnings",
    "total payout",
    "total_payout",
    "payout amount",
    "gross earnings",
  ],
};

/** Required columns (at least these must map) */
const REQUIRED = ["id", "checkIn", "checkOut"] as const;

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

function nightsBetween(checkIn: Date, checkOut: Date): number {
  const ms = checkOut.getTime() - checkIn.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

export function isReservationsCSV(headers: string[]): boolean {
  const lower = headers.map((h) => h.toLowerCase().trim());
  const hasCheckIn = COLUMN_MAP.checkIn.some((s) => lower.includes(s));
  const hasCheckOut = COLUMN_MAP.checkOut.some((s) => lower.includes(s));
  return hasCheckIn && hasCheckOut;
}

export function parseReservationsCSV(csvText: string): Reservation[] {
  const { data, errors } = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  if (errors.length && data.length === 0) {
    throw new Error(`CSV parse error: ${errors[0].message}`);
  }

  const headers = Object.keys(data[0] ?? {});

  // Check required columns
  for (const req of REQUIRED) {
    if (!findColumn(headers, req)) {
      throw new Error(
        `Reservations CSV is missing a required column. ` +
          `Expected one of: ${COLUMN_MAP[req].join(", ")}`
      );
    }
  }

  const idCol = findColumn(headers, "id")!;
  const statusCol = findColumn(headers, "status");
  const checkInCol = findColumn(headers, "checkIn")!;
  const checkOutCol = findColumn(headers, "checkOut")!;
  const nightsCol = findColumn(headers, "nights");
  const guestCol = findColumn(headers, "guestName");
  const listingCol = findColumn(headers, "listingName");
  const payoutCol = findColumn(headers, "payoutAmount");

  const reservations: Reservation[] = [];

  for (const row of data) {
    const checkIn = parseDate(row[checkInCol]);
    const checkOut = parseDate(row[checkOutCol]);
    const rawNights = nightsCol ? row[nightsCol] : "";
    const nights =
      rawNights && !isNaN(Number(rawNights))
        ? Number(rawNights)
        : nightsBetween(checkIn, checkOut);

    reservations.push({
      id: row[idCol]?.trim() ?? "",
      status: statusCol ? (row[statusCol]?.trim() ?? "unknown") : "unknown",
      checkIn,
      checkOut,
      nights,
      guestName: guestCol ? row[guestCol]?.trim() : undefined,
      listingName: listingCol ? row[listingCol]?.trim() : undefined,
      payoutAmount:
        payoutCol && row[payoutCol]
          ? parseFloat(row[payoutCol].replace(/[^0-9.\-]/g, ""))
          : undefined,
    });
  }

  return reservations;
}
