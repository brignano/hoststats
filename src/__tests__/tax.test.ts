import { Payout, Reservation } from "@/lib/models";
import { calcTaxYears, taxStayRows, taxYearCsv } from "@/lib/tax";

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

const TODAY = local(2026, 3, 1);
const NO_COSTS = { monthlyFixed: 0, perStay: 0 };

const STAYS = [
  stay("A", local(2024, 6, 1), local(2024, 6, 4), { payout: 300 }), // 3 nights
  stay("B", local(2024, 7, 10), local(2024, 7, 15), { payout: 500 }), // 5 nights
  stay("X", local(2024, 8, 1), local(2024, 8, 9), { status: "cancelled", payout: 0 }),
  stay("C", local(2024, 12, 30), local(2025, 1, 2), { payout: 300 }), // 2 nights 2024, 1 in 2025
];

const PAYOUTS: Payout[] = [
  { date: local(2024, 6, 2), type: "Payout", amount: 300 },
  { date: local(2024, 7, 11), type: "Payout", amount: 500 },
  { date: local(2024, 7, 11), type: "Adjustment", amount: -20 },
  { date: local(2024, 12, 31), type: "Payout", amount: 300 },
];

describe("calcTaxYears", () => {
  it("adds up rents by payout date and rental days by night", () => {
    const [y2024, y2025] = calcTaxYears(STAYS, PAYOUTS, NO_COSTS, TODAY);
    expect(y2024).toMatchObject({
      year: 2024,
      rentsReceived: 1100,
      incomeSource: "earnings",
      rentalDays: 10, // 3 + 5 + 2, cancelled excluded
      stays: 3,
      avgStay: 3.7, // (3 + 5 + 3) / 3
      inProgress: false,
      estimatedExpenses: null,
    });
    // The New Year stay spills one night into 2025.
    expect(y2025).toMatchObject({ year: 2025, rentalDays: 1, stays: 0, rentsReceived: 0 });
  });

  it("estimates rents from reservation payouts when there's no earnings export", () => {
    const [y2024] = calcTaxYears(STAYS, [], NO_COSTS, TODAY);
    expect(y2024.incomeSource).toBe("reservations");
    expect(y2024.rentsReceived).toBe(1000); // 300 + 500 + 2/3 of 300
  });

  it("totals the host's cost estimates for the year", () => {
    const [y2024] = calcTaxYears(STAYS, PAYOUTS, { monthlyFixed: 100, perStay: 10 }, TODAY);
    // Data spans Jun–Dec 2024: 7 months of fixed costs, 3 stays.
    expect(y2024.estimatedExpenses).toBe(730);
  });

  it("marks the current year as in progress", () => {
    const years = calcTaxYears(
      [stay("D", local(2026, 2, 1), local(2026, 2, 3))],
      [],
      NO_COSTS,
      TODAY
    );
    expect(years[0]).toMatchObject({ year: 2026, inProgress: true, incomeSource: "none" });
  });

  it("doesn't double-count a night imported twice for the same listing", () => {
    const dupes = [
      stay("A", local(2024, 6, 1), local(2024, 6, 4)),
      stay("A-cal", local(2024, 6, 1), local(2024, 6, 4)),
    ];
    expect(calcTaxYears(dupes, [], NO_COSTS, TODAY)[0].rentalDays).toBe(3);
  });

  it("counts listings separately", () => {
    const two = [
      stay("A", local(2024, 6, 1), local(2024, 6, 4), { listing: "Cabin" }),
      stay("B", local(2024, 6, 1), local(2024, 6, 4), { listing: "Loft" }),
    ];
    expect(calcTaxYears(two, [], NO_COSTS, TODAY)[0]).toMatchObject({ rentalDays: 6, listings: 2 });
  });
});

describe("taxStayRows", () => {
  it("lists each stay's nights inside the year, skipping cancellations", () => {
    expect(taxStayRows(STAYS, 2024).map((r) => [r.id, r.nightsInYear])).toEqual([
      ["A", 3],
      ["B", 5],
      ["C", 2],
    ]);
    expect(taxStayRows(STAYS, 2025).map((r) => [r.id, r.nightsInYear])).toEqual([["C", 1]]);
  });
});

describe("taxYearCsv", () => {
  const [y2024] = calcTaxYears(STAYS, PAYOUTS, NO_COSTS, TODAY);

  it("writes the summary and one row per stay", () => {
    const csv = taxYearCsv(y2024, taxStayRows(STAYS, 2024));
    expect(csv).toContain("Rents received (Schedule E line 3),1100.00");
    expect(csv).toContain("Fair rental days (Schedule E line 2),10");
    expect(csv).toContain("C,,2024-12-30,2025-01-02,2,300.00");
  });

  it("quotes commas and defuses spreadsheet formulas in listing names", () => {
    const rows = taxStayRows(
      [
        stay("A", local(2024, 6, 1), local(2024, 6, 2), { listing: "Cabin, North" }),
        stay("B", local(2024, 6, 3), local(2024, 6, 4), { listing: '=HYPERLINK("x")' }),
      ],
      2024
    );
    const csv = taxYearCsv(y2024, rows);
    expect(csv).toContain('"Cabin, North"');
    expect(csv).toContain(`"'=HYPERLINK(""x"")"`);
  });
});
