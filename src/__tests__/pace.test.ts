import { Reservation } from "@/lib/models";
import { calcLeadTimes, calcPace, pricingDeadline } from "@/lib/pace";
import { parseReservationsCSV } from "@/lib/importers/reservations";
import { mergeParsed } from "@/lib/merge";

function local(y: number, m: number, d: number): Date {
  return new Date(y, m - 1, d);
}

function stay(
  id: string,
  checkIn: Date,
  checkOut: Date,
  bookedAt?: Date,
  status = "accepted"
): Reservation {
  return {
    id,
    status,
    checkIn,
    checkOut,
    nights: Math.round((checkOut.getTime() - checkIn.getTime()) / 86_400_000),
    bookedAt,
  };
}

const AS_OF = local(2025, 6, 1);

const STAYS = [
  // Last year, July: one booked well before Jun 1, one after.
  stay("a", local(2024, 7, 1), local(2024, 7, 6), local(2024, 3, 1)), // 5 nights, early
  stay("b", local(2024, 7, 10), local(2024, 7, 14), local(2024, 6, 20)), // 4 nights, late
  // This year, July: one booked before Jun 1, one after (not on the books yet).
  stay("c", local(2025, 7, 1), local(2025, 7, 3), local(2025, 5, 10)), // 2 nights
  stay("d", local(2025, 7, 20), local(2025, 7, 25), local(2025, 6, 15)), // future booking
  // Cancelled stays never count.
  stay("x", local(2025, 7, 5), local(2025, 7, 9), local(2025, 4, 1), "cancelled"),
];

describe("calcPace", () => {
  it("compares what's booked now with the same day last year", () => {
    const july = calcPace(STAYS, AS_OF).find((m) => m.month === "2025-07")!;
    expect(july.nightsNow).toBe(2);
    expect(july.lastYearSamePoint).toBe(5);
    expect(july.lastYearFinal).toBe(9);
    expect(july.daysInMonth).toBe(31);
  });

  it("covers the month of asOf and the two after", () => {
    expect(calcPace(STAYS, AS_OF).map((m) => m.month)).toEqual(["2025-06", "2025-07", "2025-08"]);
  });

  it("says nothing about last year when there was nothing last year", () => {
    const june = calcPace(STAYS, AS_OF)[0];
    expect(june.lastYearFinal).toBeNull();
    expect(june.lastYearSamePoint).toBeNull();
  });

  it("won't guess last year's pace without booking dates", () => {
    const noDates = [stay("a", local(2024, 7, 1), local(2024, 7, 6)), ...STAYS.slice(2)];
    const july = calcPace(noDates, AS_OF)[1];
    expect(july.lastYearFinal).toBe(5);
    expect(july.lastYearSamePoint).toBeNull();
  });

  it("counts upcoming stays without a booking date (a calendar feed) as booked", () => {
    const july = calcPace([stay("cal", local(2025, 7, 1), local(2025, 7, 4))], AS_OF)[1];
    expect(july.nightsNow).toBe(3);
  });

  it("splits a stay across the months it covers", () => {
    const spanning = [stay("s", local(2025, 6, 29), local(2025, 7, 2), local(2025, 5, 1))];
    const [june, july] = calcPace(spanning, AS_OF);
    expect(june.nightsNow).toBe(2);
    expect(july.nightsNow).toBe(1);
  });
});

describe("calcLeadTimes", () => {
  it("takes the median days from booking to check-in", () => {
    const lead = calcLeadTimes(STAYS)!;
    // a: 122, b: 20, c: 52, d: 35 -> median of 20, 35, 52, 122 = 44 (rounded mean of middle two)
    expect(lead.stays).toBe(4);
    expect(lead.medianDays).toBe(44);
    expect(lead.byMonth[6]).toMatchObject({ label: "Jul", stays: 4, medianDays: 44 });
    expect(lead.byMonth[0]).toMatchObject({ stays: 0, medianDays: null });
  });

  it("counts last-minute bookings", () => {
    const lead = calcLeadTimes([
      stay("a", local(2025, 7, 10), local(2025, 7, 12), local(2025, 7, 5)), // 5 days
      stay("b", local(2025, 7, 20), local(2025, 7, 22), local(2025, 5, 1)),
    ])!;
    expect(lead.lastMinuteShare).toBe(0.5);
  });

  it("ignores a booked date after check-in and returns null with no dates", () => {
    expect(
      calcLeadTimes([stay("a", local(2025, 7, 1), local(2025, 7, 2), local(2025, 7, 9))])
    ).toBeNull();
    expect(calcLeadTimes([stay("a", local(2025, 7, 1), local(2025, 7, 2))])).toBeNull();
  });
});

describe("pricingDeadline", () => {
  it("names the month guests book furthest ahead and when to price it", () => {
    const lead = calcLeadTimes([
      stay("a", local(2024, 7, 5), local(2024, 7, 7), local(2024, 4, 6)), // 90 days
      stay("b", local(2024, 7, 15), local(2024, 7, 17), local(2024, 4, 16)), // 90 days
      stay("c", local(2024, 2, 5), local(2024, 2, 7), local(2024, 1, 26)), // 10 days
      stay("d", local(2024, 2, 9), local(2024, 2, 11), local(2024, 1, 30)), // 10 days
    ])!;
    // Next July 1 after Jan 15 2026 is 2026-07-01; minus 90 days = Apr 2.
    expect(pricingDeadline(lead, local(2026, 1, 15))).toMatchObject({
      month: "July",
      medianDays: 90,
      setBy: "early April",
      date: local(2026, 4, 2),
    });
  });

  it("needs at least two stays in a month", () => {
    const lead = calcLeadTimes([
      stay("a", local(2024, 7, 5), local(2024, 7, 7), local(2024, 4, 6)),
    ])!;
    expect(pricingDeadline(lead)).toBeNull();
  });
});

describe("booked dates in the reservations export", () => {
  it('reads Airbnb\'s "Booked" and "# of nights" columns', () => {
    const [r] = parseReservationsCSV(
      "Confirmation code,Status,Start date,End date,# of nights,Booked\n" +
        "HMX,Confirmed,2025-07-01,2025-07-04,3,2025-04-12\n"
    );
    expect(r.nights).toBe(3);
    expect(r.bookedAt).toEqual(local(2025, 4, 12));
  });

  it("leaves bookedAt empty on a blank or bad cell instead of failing", () => {
    const rows = parseReservationsCSV(
      "Confirmation code,Start date,End date,Booked\nA,2025-07-01,2025-07-04,\nB,2025-07-05,2025-07-06,soon\n"
    );
    expect(rows.map((r) => r.bookedAt)).toEqual([undefined, undefined]);
  });

  it("keeps the booked date when a calendar copy of the stay arrives first", () => {
    const fromCalendar = {
      reservations: [stay("HMX", local(2025, 7, 1), local(2025, 7, 4))],
      payouts: [],
    };
    const fromCsv = {
      reservations: [
        {
          ...stay("HMX", local(2025, 7, 1), local(2025, 7, 4), local(2025, 4, 12)),
          payoutAmount: 300,
        },
      ],
      payouts: [],
    };
    const merged = mergeParsed(fromCalendar, fromCsv);
    expect(merged.reservations[0].bookedAt).toEqual(local(2025, 4, 12));
  });
});
