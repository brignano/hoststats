import { ParsedData } from "../models";
import { isReservationsCSV, parseReservationsCSV } from "./reservations";
import { isEarningsCSV, parseEarningsCSV } from "./earnings";

export async function parseFile(file: File): Promise<ParsedData> {
  const text = await file.text();

  // Parse headers from first line
  const firstLine = text.split("\n")[0] ?? "";
  const headers = firstLine
    .split(",")
    .map((h) => h.replace(/^"|"$/g, "").trim());

  if (isReservationsCSV(headers)) {
    return {
      reservations: parseReservationsCSV(text),
      payouts: [],
    };
  }

  if (isEarningsCSV(headers)) {
    return {
      reservations: [],
      payouts: parseEarningsCSV(text),
    };
  }

  throw new Error(
    `We could not recognize this CSV file.\n\n` +
      `Expected one of:\n` +
      `• Reservations CSV — needs columns like "Confirmation Code", "Check-in", "Check-out"\n` +
      `• Earnings CSV — needs columns like "Date", "Amount"\n\n` +
      `Tip: Go to airbnb.com/hosting → Reservations or Earnings → Export CSV.`
  );
}
