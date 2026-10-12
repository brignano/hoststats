/**
 * Regression tests for bugs found in the quality pass. Each one names the
 * scenario that used to give a wrong answer.
 */
import { Payout, Reservation } from "@/lib/models";
import { calcBreakEven, calcMonthlyProfit, incomePerNight } from "@/lib/calculations";
import { calcLeadTimes, calcPace, pricingDeadline } from "@/lib/pace";
import { buildActions } from "@/lib/actions";
import { parseReservationsCSV } from "@/lib/importers/reservations";

function local(y: number, m: number, d: number): Date {
  return new Date(y, m - 1, d);
}

function stay(
  id: string,
  checkIn: Date,
  checkOut: Date,
  extra: Partial<Reservation> = {}
): Reservation {
  return {
    id,
    status: "accepted",
    checkIn,
    checkOut,
    nights: Math.round((checkOut.getTime() - checkIn.getTime()) / 86_400_000),
    ...extra,
  };
}

describe("future stays with an earnings export", () => {
  // $1000 paid for a 10-night stay in September; another stay booked for February.
  const stays = [
    stay("A", local(2026, 9, 1), local(2026, 9, 11)),
    stay("B", local(2027, 2, 1), local(2027, 2, 6)),
  ];
  const payouts: Payout[] = [{ date: local(2026, 9, 2), type: "Payout", amount: 1000 }];

  it("doesn't count the unpaid upcoming stay's nights in income per night", () => {
    expect(incomePerNight(stays, payouts)).toBe(100);
  });

  it("doesn't run profit into months the earnings don't cover", () => {
    const months = calcMonthlyProfit(stays, payouts, { monthlyFixed: 2000, perStay: 100 });
    expect(months.map((m) => m.month)).toEqual(["2026-09"]);
  });

  it("uses the right per-night income for break-even", () => {
    const be = calcBreakEven(stays, payouts, { monthlyFixed: 1000, perStay: 0 });
    expect(be.incomePerNight).toBe(100);
    expect(be.nightsPerMonth).toBe(10);
  });
});

describe("calendar-only data with costs entered", () => {
  it("doesn't claim stays lose money when there's no income to judge by", () => {
    const stays = [stay("A", local(2026, 11, 1), local(2026, 11, 4), { source: "calendar" })];
    const costs = { monthlyFixed: 2000, perStay: 100 };
    const actions = buildActions({
      asOf: local(2026, 10, 12),
      gaps: {
        maxGapNights: 2,
        shortestStay: 3,
        gaps: [],
        pastNights: 0,
        pastValue: 0,
        upcomingNights: 0,
        upcomingValue: 0,
      },
      pace: [],
      lead: null,
      breakEven: calcBreakEven(stays, [], costs),
      hasIncome: false,
      hasCosts: true,
      hasReservations: true,
      nightValue: 0,
      taxYears: [],
    });
    expect(actions.map((a) => a.id)).not.toContain("break-even-never");
  });
});

describe("pricing deadline", () => {
  it("never shows a deadline that's already passed", () => {
    // December books 88 days ahead. On Oct 12, this December's deadline
    // (early September) is gone, so the next one is a year on.
    const lead = calcLeadTimes([
      stay("a", local(2025, 12, 5), local(2025, 12, 7), { bookedAt: local(2025, 9, 8) }),
      stay("b", local(2025, 12, 15), local(2025, 12, 17), { bookedAt: local(2025, 9, 18) }),
    ])!;
    const deadline = pricingDeadline(lead, local(2026, 10, 12))!;
    expect(deadline.month).toBe("December");
    expect(deadline.date > local(2026, 10, 12)).toBe(true);
    expect(deadline.date.getFullYear()).toBe(2027);
  });
});

describe("pace with several listings", () => {
  it("measures capacity across every listing", () => {
    const full = (listingName: string) =>
      stay(listingName, local(2026, 10, 1), local(2026, 11, 1), { listingName });
    const [october] = calcPace([full("Cabin"), full("Loft")], local(2026, 10, 1));
    expect(october.nightsNow).toBe(62);
    expect(october.listings).toBe(2);
    expect(october.nightsNow / (october.daysInMonth * october.listings)).toBe(1);
  });
});

describe("reservations import", () => {
  it("leaves a junk payout empty rather than NaN", () => {
    const [r] = parseReservationsCSV(
      "Confirmation code,Start date,End date,Earnings\nA,2026-07-01,2026-07-04,N/A\n"
    );
    expect(r.payoutAmount).toBeUndefined();
  });
});
