import { parseAirbnbCalendarUrl } from "@/lib/calendarUrl";
import { isICal, parseICal } from "@/lib/importers/ical";
import { mergeParsed } from "@/lib/merge";
import { calcGapNights } from "@/lib/calculations";
import { handleCalendarRequest } from "../../worker/calendarProxy";

// The shape Airbnb's export uses, folded line included.
const FEED = [
  "BEGIN:VCALENDAR",
  "PRODID;X-RICAL-TZSOURCE=TZINFO:-//Airbnb Inc//Hosting Calendar 0.8.8//EN",
  "CALSCALE:GREGORIAN",
  "VERSION:2.0",
  "BEGIN:VEVENT",
  "DTEND;VALUE=DATE:20261115",
  "DTSTART;VALUE=DATE:20261112",
  "UID:1418fb94e984-aaa@airbnb.com",
  "DESCRIPTION:Reservation URL: https://www.airbnb.com/hosting/reservations/det",
  " ails/HMABCDEF12\\nPhone Number (Last 4 Digits): 1234",
  "SUMMARY:Reserved",
  "END:VEVENT",
  "BEGIN:VEVENT",
  "DTEND;VALUE=DATE:20261120",
  "DTSTART;VALUE=DATE:20261116",
  "UID:1418fb94e984-bbb@airbnb.com",
  "DESCRIPTION:Reservation URL: https://www.airbnb.com/hosting/reservations/details/HMZZZZ9999",
  "SUMMARY:Reserved",
  "END:VEVENT",
  "BEGIN:VEVENT",
  "DTEND;VALUE=DATE:20261201",
  "DTSTART;VALUE=DATE:20261122",
  "UID:1418fb94e984-ccc@airbnb.com",
  "SUMMARY:Airbnb (Not available)",
  "END:VEVENT",
  "END:VCALENDAR",
].join("\r\n");

const LINK = "https://www.airbnb.com/calendar/ical/12345678.ics?s=0123456789abcdef";

describe("parseAirbnbCalendarUrl", () => {
  it("accepts Airbnb export links, including local domains", () => {
    expect(parseAirbnbCalendarUrl(LINK)?.searchParams.get("s")).toBe("0123456789abcdef");
    expect(parseAirbnbCalendarUrl(`  ${LINK}  `)).not.toBeNull();
    expect(
      parseAirbnbCalendarUrl("https://www.airbnb.co.uk/calendar/ical/1.ics?s=x")
    ).not.toBeNull();
  });

  it.each([
    ["plain http", "http://www.airbnb.com/calendar/ical/1.ics?s=x"],
    ["another host", "https://evil.example/calendar/ical/1.ics"],
    ["a lookalike host", "https://www.airbnb.com.evil.example/calendar/ical/1.ics"],
    ["a subdomain trick", "https://airbnb.evil.com/calendar/ical/1.ics"],
    ["another Airbnb path", "https://www.airbnb.com/hosting/reservations"],
    ["credentials", "https://user:pw@www.airbnb.com/calendar/ical/1.ics"],
    ["a port", "https://www.airbnb.com:8443/calendar/ical/1.ics"],
    ["junk", "not a url"],
  ])("rejects %s", (_, url) => {
    expect(parseAirbnbCalendarUrl(url)).toBeNull();
  });
});

describe("parseICal", () => {
  it("recognises a calendar", () => {
    expect(isICal(FEED)).toBe(true);
    expect(isICal("Date,Amount\n")).toBe(false);
  });

  it("turns bookings into reservations keyed by confirmation code", () => {
    const { reservations } = parseICal(FEED, "Beach House");
    expect(reservations).toHaveLength(2);
    expect(reservations[0]).toMatchObject({
      id: "HMABCDEF12",
      status: "accepted",
      nights: 3,
      listingName: "Beach House",
    });
    expect(reservations[0].checkIn).toEqual(new Date(2026, 10, 12));
    expect(reservations[0].checkOut).toEqual(new Date(2026, 10, 15));
  });

  it("keeps closed-off dates separate from stays", () => {
    const { blocked } = parseICal(FEED);
    expect(blocked).toHaveLength(1);
    expect(blocked[0].start).toEqual(new Date(2026, 10, 22));
    expect(blocked[0].end).toEqual(new Date(2026, 11, 1));
  });

  it("throws on something that isn't a calendar", () => {
    expect(() => parseICal("<html>")).toThrow(/calendar/);
  });
});

describe("mergeParsed", () => {
  const csv = {
    reservations: [
      {
        id: "HMABCDEF12",
        status: "accepted",
        checkIn: new Date(2026, 10, 12),
        checkOut: new Date(2026, 10, 15),
        nights: 3,
        listingName: "Beach House",
        payoutAmount: 500,
      },
    ],
    payouts: [],
  };

  it("keeps one copy of a stay that's in both the CSV and the calendar, with its payout", () => {
    const merged = mergeParsed(csv, { payouts: [], ...parseICal(FEED) });
    const dupes = merged.reservations.filter((r) => r.id === "HMABCDEF12");
    expect(dupes).toHaveLength(1);
    expect(dupes[0].payoutAmount).toBe(500);
    expect(merged.reservations).toHaveLength(2);
  });

  it("files unnamed calendar stays under the only listing loaded", () => {
    const merged = mergeParsed(csv, { payouts: [], ...parseICal(FEED) });
    expect(merged.reservations.every((r) => r.listingName === "Beach House")).toBe(true);
    expect(merged.blocked?.[0].listingName).toBe("Beach House");
  });

  it("prefers the copy with a payout whichever order they arrive in", () => {
    const merged = mergeParsed({ payouts: [], ...parseICal(FEED) }, csv);
    expect(merged.reservations.find((r) => r.id === "HMABCDEF12")?.payoutAmount).toBe(500);
  });
});

describe("calcGapNights with blocked dates", () => {
  const today = new Date(2026, 9, 12);

  it("finds the upcoming hole between a stay and a block", () => {
    const { reservations, blocked } = parseICal(FEED);
    const report = calcGapNights(reservations, 100, today, blocked);
    // 1 night Nov 15 (between stays) and 2 nights Nov 20–21 (stay, then block).
    expect(report.gaps.map((g) => [g.start.getDate(), g.nights])).toEqual([
      [15, 1],
      [20, 2],
    ]);
    expect(report.upcomingNights).toBe(3);
  });

  it("ignores a hole between two blocks — that's the host's choice", () => {
    const report = calcGapNights([], 100, today, [
      { start: new Date(2026, 10, 1), end: new Date(2026, 10, 3) },
      { start: new Date(2026, 10, 4), end: new Date(2026, 10, 6) },
    ]);
    expect(report.gaps).toHaveLength(0);
  });

  it("closes a gap that a block fills", () => {
    const { reservations } = parseICal(FEED);
    const report = calcGapNights(reservations, 100, today, [
      { start: new Date(2026, 10, 15), end: new Date(2026, 10, 16) },
    ]);
    expect(report.gaps).toHaveLength(0);
  });
});

describe("handleCalendarRequest", () => {
  const ORIGIN = "https://hoststats.example";

  function post(body: unknown, headers: Record<string, string> = {}) {
    return new Request(`${ORIGIN}/api/calendar`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: ORIGIN, ...headers },
      body: typeof body === "string" ? body : JSON.stringify(body),
    });
  }

  const calendarFetch = jest.fn(async () => new Response(FEED, { status: 200 }));

  beforeEach(() => calendarFetch.mockClear());

  it("returns the feed for an Airbnb link, uncached", async () => {
    const res = await handleCalendarRequest(post({ url: LINK }), calendarFetch);
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(await res.text()).toBe(FEED);
    expect(calendarFetch).toHaveBeenCalledWith(
      LINK,
      expect.objectContaining({ redirect: "manual" })
    );
  });

  it("refuses anything that isn't an Airbnb calendar link without fetching", async () => {
    const res = await handleCalendarRequest(
      post({ url: "https://169.254.169.254/latest/meta-data" }),
      calendarFetch
    );
    expect(res.status).toBe(400);
    expect(calendarFetch).not.toHaveBeenCalled();
  });

  it("refuses GET, so the link can't end up in a URL", async () => {
    const res = await handleCalendarRequest(
      new Request(`${ORIGIN}/api/calendar?url=${encodeURIComponent(LINK)}`),
      calendarFetch
    );
    expect(res.status).toBe(405);
  });

  it("refuses other sites", async () => {
    const res = await handleCalendarRequest(
      post({ url: LINK }, { Origin: "https://evil.example" }),
      calendarFetch
    );
    expect(res.status).toBe(403);
  });

  it("refuses bad JSON", async () => {
    expect((await handleCalendarRequest(post("{"), calendarFetch)).status).toBe(400);
  });

  it("won't follow a redirect away from Airbnb", async () => {
    const redirecting = jest.fn(
      async () =>
        new Response(null, { status: 302, headers: { Location: "https://evil.example/" } })
    );
    const res = await handleCalendarRequest(post({ url: LINK }), redirecting);
    expect(res.status).toBe(502);
    expect(redirecting).toHaveBeenCalledTimes(1);
  });

  it("follows a redirect to another Airbnb calendar link", async () => {
    const hops = jest
      .fn()
      .mockResolvedValueOnce(
        new Response(null, {
          status: 301,
          headers: { Location: "https://www.airbnb.co.uk/calendar/ical/12345678.ics?s=x" },
        })
      )
      .mockResolvedValueOnce(new Response(FEED, { status: 200 }));
    const res = await handleCalendarRequest(post({ url: LINK }), hops);
    expect(res.status).toBe(200);
    expect(hops).toHaveBeenCalledTimes(2);
  });

  it("explains a dead link", async () => {
    const gone = jest.fn(async () => new Response("nope", { status: 404 }));
    const res = await handleCalendarRequest(post({ url: LINK }), gone);
    expect(res.status).toBe(404);
    expect((await res.json()).error).toMatch(/copy it again/);
  });

  it("refuses a response that isn't a calendar", async () => {
    const html = jest.fn(async () => new Response("<html>login</html>", { status: 200 }));
    expect((await handleCalendarRequest(post({ url: LINK }), html)).status).toBe(502);
  });
});
