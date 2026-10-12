import { Reservation, Payout } from "@/lib/models";
import {
  calcMonthlyOccupancy,
  calcWeekdayOccupancy,
  calcMonthlyRevenue,
  totalRevenue,
  totalBookedNights,
  avgOccupancyPct,
  calcMonthlyIncome,
  incomePerNight,
  calcMonthlyProfit,
  calcBreakEven,
  calcGapNights,
} from "@/lib/calculations";

function makeReservation(
  id: string,
  checkIn: string,
  checkOut: string,
  status = "accepted"
): Reservation {
  const ci = new Date(checkIn);
  const co = new Date(checkOut);
  const ms = co.getTime() - ci.getTime();
  const nights = Math.round(ms / (1000 * 60 * 60 * 24));
  return { id, status, checkIn: ci, checkOut: co, nights };
}

function makePayout(date: string, amount: number): Payout {
  return { date: new Date(date), type: "Payout", amount };
}

const RESERVATIONS: Reservation[] = [
  makeReservation("1", "2024-01-05", "2024-01-08"), // 3 nights Jan
  makeReservation("2", "2024-01-15", "2024-01-18"), // 3 nights Jan
  makeReservation("3", "2024-01-22", "2024-01-24", "cancelled"), // skipped
  makeReservation("4", "2024-02-10", "2024-02-14"), // 4 nights Feb
];

const PAYOUTS: Payout[] = [
  makePayout("2024-01-08", 320),
  makePayout("2024-01-18", 310),
  makePayout("2024-02-14", 430),
  makePayout("2024-02-14", -25), // adjustment
];

describe("calcMonthlyOccupancy", () => {
  it("returns one entry per month with bookings", () => {
    const result = calcMonthlyOccupancy(RESERVATIONS);
    expect(result).toHaveLength(2);
    expect(result[0].month).toBe("2024-01");
    expect(result[1].month).toBe("2024-02");
  });

  it("computes booked nights correctly", () => {
    const result = calcMonthlyOccupancy(RESERVATIONS);
    expect(result[0].bookedNights).toBe(6); // Jan: 3 + 3, cancelled excluded
    expect(result[1].bookedNights).toBe(4); // Feb: 4
  });

  it("computes occupancy %", () => {
    const result = calcMonthlyOccupancy(RESERVATIONS);
    // Jan 2024 has 31 days: 6/31 ~ 19%
    expect(result[0].occupancyPct).toBe(19);
    // Feb 2024 has 29 days (2024 is leap): 4/29 ~ 14%
    expect(result[1].occupancyPct).toBe(14);
  });

  it("excludes cancelled reservations", () => {
    const onlyCancelled = [makeReservation("x", "2024-03-01", "2024-03-03", "cancelled")];
    expect(calcMonthlyOccupancy(onlyCancelled)).toHaveLength(0);
  });
});

describe("calcWeekdayOccupancy", () => {
  it("returns 7 entries", () => {
    const result = calcWeekdayOccupancy(RESERVATIONS);
    expect(result).toHaveLength(7);
  });

  it("total weekday nights equals total booked nights", () => {
    const result = calcWeekdayOccupancy(RESERVATIONS);
    const totalWeekday = result.reduce((s, w) => s + w.bookedNights, 0);
    expect(totalWeekday).toBe(totalBookedNights(RESERVATIONS));
  });
});

describe("calcMonthlyRevenue", () => {
  it("sums positive payouts by month", () => {
    const result = calcMonthlyRevenue(PAYOUTS);
    expect(result).toHaveLength(2);
    expect(result[0].month).toBe("2024-01");
    expect(result[0].revenue).toBe(630); // 320 + 310
    expect(result[1].month).toBe("2024-02");
    expect(result[1].revenue).toBe(430); // only positive
  });
});

describe("totalRevenue", () => {
  it("sums only positive payouts", () => {
    expect(totalRevenue(PAYOUTS)).toBe(1060); // 320 + 310 + 430
  });
});

describe("totalBookedNights", () => {
  it("excludes cancelled", () => {
    expect(totalBookedNights(RESERVATIONS)).toBe(10); // 3 + 3 + 4
  });
});

describe("avgOccupancyPct", () => {
  it("averages monthly occupancy", () => {
    const monthly = calcMonthlyOccupancy(RESERVATIONS);
    const avg = avgOccupancyPct(monthly);
    expect(avg).toBe(Math.round((19 + 14) / 2)); // ~16 or 17 depending on rounding
  });

  it("returns 0 for empty array", () => {
    expect(avgOccupancyPct([])).toBe(0);
  });
});

// Local-midnight dates, the way the importers build them.
function local(y: number, m: number, d: number): Date {
  return new Date(y, m - 1, d);
}

function stay(
  id: string,
  checkIn: Date,
  checkOut: Date,
  opts: { status?: string; payout?: number; listing?: string } = {}
): Reservation {
  return {
    id,
    status: opts.status ?? "accepted",
    checkIn,
    checkOut,
    nights: Math.round((checkOut.getTime() - checkIn.getTime()) / 86_400_000),
    payoutAmount: opts.payout,
    listingName: opts.listing,
  };
}

describe("calcMonthlyOccupancy with empty months", () => {
  const spread = [
    stay("a", local(2024, 1, 1), local(2024, 1, 11)), // 10 nights Jan
    stay("b", local(2024, 3, 1), local(2024, 3, 11)), // 10 nights Mar
  ];

  it("includes months in between with no bookings", () => {
    const result = calcMonthlyOccupancy(spread);
    expect(result.map((m) => m.month)).toEqual(["2024-01", "2024-02", "2024-03"]);
    expect(result[1].bookedNights).toBe(0);
    expect(result[1].occupancyPct).toBe(0);
  });

  it("counts the empty month in the average", () => {
    // Jan 32%, Feb 0%, Mar 32% -> 21%, not 32%.
    expect(avgOccupancyPct(calcMonthlyOccupancy(spread))).toBe(21);
  });

  it("rolls over the year boundary", () => {
    const result = calcMonthlyOccupancy([
      stay("a", local(2024, 11, 1), local(2024, 11, 3)),
      stay("b", local(2025, 2, 1), local(2025, 2, 3)),
    ]);
    expect(result.map((m) => m.month)).toEqual(["2024-11", "2024-12", "2025-01", "2025-02"]);
  });
});

describe("calcMonthlyIncome", () => {
  it("uses the earnings export when there is one", () => {
    const income = calcMonthlyIncome(RESERVATIONS, PAYOUTS);
    expect(income.get("2024-01")).toBe(630);
  });

  it("otherwise spreads reservation payouts across the nights of each stay", () => {
    // 4 nights at $100, two in Jan and two in Feb.
    const income = calcMonthlyIncome(
      [stay("a", local(2024, 1, 30), local(2024, 2, 3), { payout: 400 })],
      []
    );
    expect(income.get("2024-01")).toBe(200);
    expect(income.get("2024-02")).toBe(200);
  });
});

describe("incomePerNight", () => {
  it("divides earnings by booked nights", () => {
    expect(incomePerNight(RESERVATIONS, PAYOUTS)).toBe(106); // 1060 / 10
  });

  it("falls back to reservation payouts", () => {
    const rs = [
      stay("a", local(2024, 1, 1), local(2024, 1, 3), { payout: 300 }),
      stay("b", local(2024, 1, 5), local(2024, 1, 7), { payout: 100 }),
      stay("c", local(2024, 1, 9), local(2024, 1, 11), { status: "cancelled", payout: 999 }),
    ];
    expect(incomePerNight(rs, [])).toBe(100);
  });

  it("is 0 with no money data", () => {
    expect(incomePerNight([stay("a", local(2024, 1, 1), local(2024, 1, 3))], [])).toBe(0);
  });
});

describe("calcMonthlyProfit", () => {
  it("charges fixed costs every month and per-stay costs on check-in month", () => {
    const result = calcMonthlyProfit(RESERVATIONS, PAYOUTS, { monthlyFixed: 200, perStay: 50 });
    expect(result.map((m) => m.month)).toEqual(["2024-01", "2024-02"]);
    // Jan: 630 in, 200 + 2 stays * 50 out (the cancelled one is free).
    expect(result[0]).toMatchObject({ income: 630, costs: 300, profit: 330 });
    // Feb: 430 in, 200 + 1 * 50 out.
    expect(result[1]).toMatchObject({ income: 430, costs: 250, profit: 180 });
  });

  it("shows an empty month as a loss of the fixed costs", () => {
    const rs = [
      stay("a", local(2024, 1, 1), local(2024, 1, 3), { payout: 300 }),
      stay("b", local(2024, 3, 1), local(2024, 3, 3), { payout: 300 }),
    ];
    const result = calcMonthlyProfit(rs, [], { monthlyFixed: 1000, perStay: 0 });
    expect(result[1]).toMatchObject({ month: "2024-02", income: 0, profit: -1000 });
  });
});

describe("calcBreakEven", () => {
  it("works out the nights a month that cover fixed costs", () => {
    // $106 a night, average stay 3.33 nights, $50 a stay -> $91 a night left.
    const be = calcBreakEven(RESERVATIONS, PAYOUTS, { monthlyFixed: 900, perStay: 50 });
    expect(be.incomePerNight).toBe(106);
    expect(be.contributionPerNight).toBeCloseTo(91);
    expect(be.nightsPerMonth).toBe(10); // ceil(900 / 91)
    expect(be.occupancyPct).toBe(33);
    expect(be.actualNightsPerMonth).toBe(5); // 10 nights over 2 months
  });

  it("averages over the same months the occupancy chart shows, empty ones included", () => {
    const rs = [
      stay("a", local(2024, 1, 30), local(2024, 2, 2)), // spans Jan–Feb
      stay("b", local(2024, 4, 10), local(2024, 4, 13)), // Mar is empty
    ];
    const be = calcBreakEven(rs, [], { monthlyFixed: 0, perStay: 0 });
    expect(calcMonthlyOccupancy(rs)).toHaveLength(4);
    expect(be.actualNightsPerMonth).toBe(1.5); // 6 nights / 4 months
  });

  it("needs no nights when there are no fixed costs", () => {
    expect(
      calcBreakEven(RESERVATIONS, PAYOUTS, { monthlyFixed: 0, perStay: 0 }).nightsPerMonth
    ).toBe(0);
  });

  it("is null when every stay loses money", () => {
    const be = calcBreakEven(RESERVATIONS, PAYOUTS, { monthlyFixed: 500, perStay: 1000 });
    expect(be.nightsPerMonth).toBeNull();
    expect(be.occupancyPct).toBeNull();
  });
});

describe("calcGapNights", () => {
  const TODAY = local(2024, 6, 1);

  it("finds 1–2 night gaps and ignores back-to-back and long gaps", () => {
    const rs = [
      stay("a", local(2024, 1, 1), local(2024, 1, 3)),
      stay("b", local(2024, 1, 3), local(2024, 1, 5)), // back to back
      stay("c", local(2024, 1, 6), local(2024, 1, 8)), // 1-night gap
      stay("d", local(2024, 1, 10), local(2024, 1, 12)), // 2-night gap
      stay("e", local(2024, 1, 20), local(2024, 1, 22)), // 8-night gap
    ];
    const report = calcGapNights(rs, 100, TODAY);
    expect(report.gaps.map((g) => g.nights)).toEqual([1, 2]);
    expect(report.gaps[0].start).toEqual(local(2024, 1, 5));
    expect(report.pastNights).toBe(3);
    expect(report.pastValue).toBe(300);
  });

  it("counts longer gaps when the listing never takes stays that short", () => {
    const rs = [
      stay("a", local(2024, 1, 1), local(2024, 1, 5)), // 4 nights
      stay("b", local(2024, 1, 8), local(2024, 1, 12)), // 3-night gap, 4 nights
      stay("c", local(2024, 1, 16), local(2024, 1, 20)), // 4-night gap
    ];
    const report = calcGapNights(rs, 100, TODAY);
    expect(report.shortestStay).toBe(4);
    expect(report.maxGapNights).toBe(3);
    expect(report.gaps.map((g) => g.nights)).toEqual([3]);
  });

  it("ignores cancelled stays", () => {
    const rs = [
      stay("a", local(2024, 1, 1), local(2024, 1, 3)),
      stay("x", local(2024, 1, 3), local(2024, 1, 4), { status: "cancelled" }),
      stay("b", local(2024, 1, 4), local(2024, 1, 6)),
    ];
    expect(calcGapNights(rs, 100, TODAY).gaps).toHaveLength(1);
  });

  it("keeps each listing's calendar separate", () => {
    const rs = [
      stay("a", local(2024, 1, 1), local(2024, 1, 3), { listing: "Cabin" }),
      stay("b", local(2024, 1, 4), local(2024, 1, 6), { listing: "Loft" }),
      stay("c", local(2024, 1, 10), local(2024, 1, 12), { listing: "Cabin" }),
    ];
    expect(calcGapNights(rs, 100, TODAY).gaps).toHaveLength(0);
  });

  it("does not count a gap inside an overlapping stay", () => {
    const rs = [
      stay("a", local(2024, 1, 1), local(2024, 1, 10)),
      stay("b", local(2024, 1, 2), local(2024, 1, 4)),
      stay("c", local(2024, 1, 10), local(2024, 1, 12)),
    ];
    expect(calcGapNights(rs, 100, TODAY).gaps).toHaveLength(0);
  });

  it("splits gaps into lost and still sellable", () => {
    const rs = [
      stay("a", local(2024, 5, 1), local(2024, 5, 3)),
      stay("b", local(2024, 5, 4), local(2024, 5, 6)), // past gap
      stay("c", local(2024, 6, 10), local(2024, 6, 12)),
      stay("d", local(2024, 6, 14), local(2024, 6, 16)), // upcoming gap
    ];
    const report = calcGapNights(rs, 100, TODAY);
    expect(report.pastNights).toBe(1);
    expect(report.upcomingNights).toBe(2);
    expect(report.upcomingValue).toBe(200);
    expect(report.gaps[1].upcoming).toBe(true);
  });
});
