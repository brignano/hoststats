import { ParsedData } from "./models";
import { parseAirbnbCalendarUrl } from "./calendarUrl";
import { parseICal } from "./importers/ical";

export const NOT_A_CALENDAR_LINK =
  "That doesn't look like an Airbnb calendar link. It should start with " +
  "https://www.airbnb.com/calendar/ical/ and end in .ics?s=…";

/**
 * Fetch a listing's Airbnb calendar through our own /api/calendar, which
 * exists only because Airbnb's feed can't be read cross-origin. The link goes
 * in the POST body so it never lands in a URL or a request log.
 */
export async function loadAirbnbCalendar(link: string, listingName?: string): Promise<ParsedData> {
  if (!parseAirbnbCalendarUrl(link)) throw new Error(NOT_A_CALENDAR_LINK);

  let res: Response;
  try {
    res = await fetch("/api/calendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: link.trim() }),
      cache: "no-store",
    });
  } catch {
    throw new Error("Couldn't connect. Check your internet connection and try again.");
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(
      body?.error ??
        (res.status === 404
          ? "Calendar links only work on the live site, not on a local dev server."
          : `Something went wrong (${res.status}).`)
    );
  }

  // The listing id in the link ("/calendar/ical/12345.ics") names the feed.
  const calendarId = /\/calendar\/ical\/(\d+)\.ics/.exec(link)?.[1] ?? link;
  const { reservations, blocked } = parseICal(
    await res.text(),
    listingName?.trim() || undefined,
    `airbnb-${calendarId}`
  );
  return { reservations, payouts: [], blocked };
}
