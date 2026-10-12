import { BlockedSpan, Reservation } from "../models";

/**
 * Airbnb's calendar export (iCal).
 *
 * Each VEVENT is either a booking ("Reserved") or a closed-off stretch
 * ("Airbnb (Not available)"). Bookings carry the confirmation code inside the
 * reservation URL in DESCRIPTION, which is what lets them line up with the
 * same stay in a reservations CSV. The feed has no prices and no listing name.
 */

interface RawEvent {
  [key: string]: string;
}

/** Undo RFC 5545 line folding: a line starting with a space continues the last. */
function unfold(text: string): string[] {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\n[ \t]/g, "")
    .split("\n");
}

function unescape(value: string): string {
  return value
    .replace(/\\n/gi, "\n")
    .replace(/\\,/g, ",")
    .replace(/\;/g, ";")
    .replace(/\\\\/g, "\\");
}

function readEvents(text: string): RawEvent[] {
  const events: RawEvent[] = [];
  let current: RawEvent | null = null;
  for (const line of unfold(text)) {
    if (line === "BEGIN:VEVENT") current = {};
    else if (line === "END:VEVENT") {
      if (current) events.push(current);
      current = null;
    } else if (current) {
      const colon = line.indexOf(":");
      if (colon < 0) continue;
      // "DTSTART;VALUE=DATE" -> "DTSTART"; parameters don't matter here.
      const name = line.slice(0, colon).split(";")[0].toUpperCase();
      current[name] = unescape(line.slice(colon + 1));
    }
  }
  return events;
}

/** "20241112" or "20241112T150000Z" -> local midnight on that calendar day. */
function parseICalDate(value: string | undefined): Date | null {
  const m = /^(\d{4})(\d{2})(\d{2})/.exec(value?.trim() ?? "");
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

function isBlock(summary: string): boolean {
  return /not available|blocked|unavailable|closed/i.test(summary);
}

function confirmationCode(description: string | undefined): string | undefined {
  return /reservations\/details\/([A-Z0-9]+)/i.exec(description ?? "")?.[1];
}

export function isICal(text: string): boolean {
  return /^\s*BEGIN:VCALENDAR/.test(text);
}

export function parseICal(
  text: string,
  listingName?: string
): { reservations: Reservation[]; blocked: BlockedSpan[] } {
  if (!isICal(text)) throw new Error("That isn't a calendar file.");

  const reservations: Reservation[] = [];
  const blocked: BlockedSpan[] = [];

  for (const e of readEvents(text)) {
    const start = parseICalDate(e.DTSTART);
    const end = parseICalDate(e.DTEND);
    if (!start || !end || end <= start) continue;
    const summary = e.SUMMARY ?? "";

    if (isBlock(summary)) {
      blocked.push({ start, end, listingName });
      continue;
    }

    reservations.push({
      id: confirmationCode(e.DESCRIPTION) ?? e.UID ?? `${start.getTime()}`,
      status: "accepted",
      checkIn: start,
      checkOut: end,
      nights: Math.round((end.getTime() - start.getTime()) / 86_400_000),
      listingName,
    });
  }

  return { reservations, blocked };
}
