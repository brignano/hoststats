import { readFileSync } from "fs";
import { join } from "path";
import { parseReservationsCSV, isReservationsCSV } from "@/lib/importers/reservations";
import { parseEarningsCSV, isEarningsCSV } from "@/lib/importers/earnings";

const FIXTURES = join(__dirname, "../../fixtures");

describe("isReservationsCSV", () => {
  it("detects reservation headers", () => {
    expect(isReservationsCSV(["Confirmation Code", "Check-in", "Check-out"])).toBe(true);
    expect(isReservationsCSV(["Date", "Amount"])).toBe(false);
  });
});

describe("isEarningsCSV", () => {
  it("detects earnings headers", () => {
    expect(isEarningsCSV(["Date", "Amount", "Type"])).toBe(true);
    expect(isEarningsCSV(["Confirmation Code", "Check-in", "Check-out"])).toBe(false);
    // should NOT match reservations that happen to have amount column but also check-in
    expect(isEarningsCSV(["Date", "Amount", "Check-in"])).toBe(false);
  });
});

describe("parseReservationsCSV", () => {
  let csv: string;
  beforeAll(() => {
    csv = readFileSync(join(FIXTURES, "sample-reservations.csv"), "utf-8");
  });

  it("parses all rows", () => {
    const rows = parseReservationsCSV(csv);
    expect(rows).toHaveLength(10);
  });

  it("parses check-in dates correctly", () => {
    const rows = parseReservationsCSV(csv);
    expect(rows[0].checkIn.getFullYear()).toBe(2024);
    expect(rows[0].checkIn.getMonth()).toBe(0); // January
    expect(rows[0].checkIn.getDate()).toBe(5);
  });

  it("parses nights", () => {
    const rows = parseReservationsCSV(csv);
    expect(rows[0].nights).toBe(3);
  });

  it("parses status", () => {
    const rows = parseReservationsCSV(csv);
    expect(rows[0].status).toBe("accepted");
    expect(rows[2].status).toBe("cancelled");
  });

  it("parses payout amount", () => {
    const rows = parseReservationsCSV(csv);
    expect(rows[0].payoutAmount).toBe(320);
  });

  it("throws on missing required columns", () => {
    expect(() => parseReservationsCSV("foo,bar\n1,2")).toThrow(/required column/i);
  });
});

describe("parseEarningsCSV", () => {
  let csv: string;
  beforeAll(() => {
    csv = readFileSync(join(FIXTURES, "sample-earnings.csv"), "utf-8");
  });

  it("parses all rows", () => {
    const rows = parseEarningsCSV(csv);
    expect(rows).toHaveLength(10);
  });

  it("parses positive amounts", () => {
    const rows = parseEarningsCSV(csv);
    expect(rows[0].amount).toBe(320);
    expect(rows[0].type).toBe("Payout");
  });

  it("parses negative adjustments", () => {
    const rows = parseEarningsCSV(csv);
    const adj = rows.find((r) => r.amount < 0);
    expect(adj).toBeDefined();
    expect(adj!.amount).toBe(-25);
  });

  it("parses confirmation codes", () => {
    const rows = parseEarningsCSV(csv);
    expect(rows[0].confirmationCode).toBe("HMABCDE123");
  });
});
