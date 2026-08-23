import { ParsedData } from "../models";

const UNRECOGNIZED =
  `We could not recognize this CSV file.\n\n` +
  `Expected one of:\n` +
  `• Reservations CSV — needs columns like "Confirmation Code", "Check-in", "Check-out"\n` +
  `• Earnings CSV — needs columns like "Date", "Amount"\n\n` +
  `Tip: Go to airbnb.com/hosting → Reservations or Earnings → Export CSV.`;

/**
 * Parse one uploaded CSV into the canonical shape.
 *
 * The parsers pull in PapaParse, which is dead weight until someone actually
 * drops a file, so they are imported on demand rather than at page load.
 */
export async function parseFile(file: File): Promise<ParsedData> {
  const text = await file.text();

  const firstLine = text.split("\n")[0] ?? "";
  const headers = firstLine
    .split(",")
    .map((h) => h.replace(/^"|"$/g, "").trim());

  const [reservations, earnings] = await Promise.all([
    import("./reservations"),
    import("./earnings"),
  ]);

  if (reservations.isReservationsCSV(headers)) {
    return {
      reservations: reservations.parseReservationsCSV(text),
      payouts: [],
    };
  }

  if (earnings.isEarningsCSV(headers)) {
    return {
      reservations: [],
      payouts: earnings.parseEarningsCSV(text),
    };
  }

  throw new Error(UNRECOGNIZED);
}
