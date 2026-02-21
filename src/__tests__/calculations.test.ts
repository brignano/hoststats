import { Reservation, Payout } from "@/lib/models";
import {
  calcMonthlyOccupancy,
  calcWeekdayOccupancy,
  calcMonthlyRevenue,
  totalRevenue,
  totalBookedNights,
  avgOccupancyPct,
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
