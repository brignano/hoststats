import { ActionInputs, buildActions } from "@/lib/actions";
import { GapReport, LeadTimes, PaceMonth } from "@/lib/models";

function local(y: number, m: number, d: number): Date {
  return new Date(y, m - 1, d);
}

const AS_OF = local(2025, 6, 1);

const NO_GAPS: GapReport = {
  maxGapNights: 2,
  shortestStay: 2,
  gaps: [],
  pastNights: 0,
  pastValue: 0,
  upcomingNights: 0,
  upcomingValue: 0,
};

function month(label: string, now: number, then: number | null, final: number | null): PaceMonth {
  return {
    month: label,
    label,
    daysInMonth: 30,
    nightsNow: now,
    lastYearSamePoint: then,
    lastYearFinal: final,
  };
}

function base(overrides: Partial<ActionInputs> = {}): ActionInputs {
  return {
    asOf: AS_OF,
    gaps: NO_GAPS,
    pace: [],
    lead: null,
    breakEven: {
      incomePerNight: 200,
      contributionPerNight: 180,
      nightsPerMonth: 10,
      occupancyPct: 33,
      actualNightsPerMonth: 14,
    },
    hasIncome: true,
    hasCosts: true,
    hasReservations: true,
    nightValue: 200,
    taxYears: [],
    ...overrides,
  };
}

describe("buildActions", () => {
  it("is empty when nothing needs doing", () => {
    expect(buildActions(base())).toEqual([]);
  });

  it("puts upcoming gap nights first, soonest first, valued", () => {
    const gaps: GapReport = {
      ...NO_GAPS,
      gaps: [
        { start: local(2025, 7, 20), nights: 2, upcoming: true },
        { start: local(2025, 3, 3), nights: 1, upcoming: false }, // past: not actionable
        { start: local(2025, 6, 10), nights: 1, upcoming: true },
      ],
    };
    const actions = buildActions(base({ gaps, pace: [month("Jul 2025", 10, 20, 25)] }));
    expect(actions.map((a) => a.id.split("-")[0])).toEqual(["gap", "gap", "pace"]);
    expect(actions[0].title).toBe("Open up Jun 10, 2025");
    expect(actions[0].detail).toContain("worth about $200");
    expect(actions[1].title).toBe("Open up Jul 20 – Jul 21, 2025");
    expect(actions[0].href).toBe("#gaps");
  });

  it("names the listing only when there's more than one", () => {
    const one: GapReport = {
      ...NO_GAPS,
      gaps: [{ start: local(2025, 6, 10), nights: 1, upcoming: true, listingName: "Cabin" }],
    };
    expect(buildActions(base({ gaps: one }))[0].detail).not.toContain("Cabin");
    const two: GapReport = {
      ...NO_GAPS,
      gaps: [
        ...one.gaps,
        { start: local(2025, 3, 1), nights: 1, upcoming: false, listingName: "Loft" },
      ],
    };
    expect(buildActions(base({ gaps: two }))[0].detail).toContain("at Cabin");
  });

  it("flags the month furthest behind, with how much came in late last year", () => {
    const [a] = buildActions(
      base({ pace: [month("Jun 2025", 20, 21, 22), month("Jul 2025", 10, 18, 25)] })
    );
    expect(a.title).toBe("Jul 2025 is 8 nights behind last year");
    expect(a.detail).toContain("another 7 nights came in after this date");
  });

  it("ignores being one night behind", () => {
    expect(buildActions(base({ pace: [month("Jun 2025", 20, 21, 22)] }))).toEqual([]);
  });

  it("suggests prices may be low when well ahead", () => {
    const [a] = buildActions(base({ pace: [month("Aug 2025", 15, 10, 20)] }));
    expect(a.title).toBe("Aug 2025 is filling faster than last year");
    expect(a.tone).toBe("info");
  });

  it("shows a pricing deadline only when it's within two months", () => {
    const lead: LeadTimes = {
      stays: 4,
      medianDays: 30,
      lastMinuteShare: 0,
      byMonth: Array.from({ length: 12 }, (_, m) => ({
        month: m,
        label: "",
        medianDays: m === 7 ? 60 : null, // August, 60 days ahead
        stays: m === 7 ? 2 : 0,
      })),
    };
    // Aug 1 2025 minus 60 days = Jun 2: one day after AS_OF.
    const soon = buildActions(base({ lead }));
    expect(soon[0].title).toBe("Set August prices by early June");
    // From mid-August the next August is a year away.
    expect(buildActions(base({ lead, asOf: local(2025, 8, 15) }))).toEqual([]);
  });

  it("asks for costs when there's income but no costs", () => {
    const [a] = buildActions(base({ hasCosts: false }));
    expect(a.id).toBe("costs");
    expect(a.href).toBe("#profit");
  });

  it("warns when below break-even or when stays lose money", () => {
    const short = buildActions(
      base({ breakEven: { ...base().breakEven, actualNightsPerMonth: 6 } })
    );
    expect(short[0].title).toBe("Below break-even: 10 nights a month needed");
    const never = buildActions(base({ breakEven: { ...base().breakEven, nightsPerMonth: null } }));
    expect(never[0].id).toBe("break-even-never");
  });

  it("offers last year's tax totals from January to April only", () => {
    const taxYears = [
      {
        year: 2024,
        rentsReceived: 30000,
        incomeSource: "earnings" as const,
        rentalDays: 170,
        stays: 40,
        avgStay: 4.2,
        estimatedExpenses: null,
        inProgress: false,
        listings: 1,
      },
    ];
    expect(buildActions(base({ taxYears, asOf: local(2025, 2, 10) }))[0].title).toBe(
      "Your 2024 tax totals are ready"
    );
    expect(buildActions(base({ taxYears, asOf: local(2025, 6, 1) }))).toEqual([]);
  });

  it("never shows more than four, dropping the least urgent", () => {
    const gaps: GapReport = {
      ...NO_GAPS,
      gaps: [1, 2, 3].map((d) => ({ start: local(2025, 6, d * 5), nights: 1, upcoming: true })),
    };
    const lead: LeadTimes = {
      stays: 2,
      medianDays: 60,
      lastMinuteShare: 0,
      byMonth: Array.from({ length: 12 }, (_, m) => ({
        month: m,
        label: "",
        medianDays: m === 7 ? 60 : null,
        stays: m === 7 ? 2 : 0,
      })),
    };
    // Candidates: 2 gaps (capped at two), pace, deadline, costs = 5.
    const actions = buildActions(
      base({ gaps, lead, hasCosts: false, pace: [month("Jul 2025", 5, 15, 20)] })
    );
    expect(actions.map((a) => a.id.split("-")[0])).toEqual(["gap", "gap", "pace", "deadline"]);
  });
});
