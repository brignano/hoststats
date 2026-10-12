/**
 * The landing page quotes the demo ("Examples from the sample data"). If the
 * sample data or the maths changes, these lines would quietly go stale —
 * so recompute each one here the way the dashboard does.
 */
import { readFileSync } from "fs";
import { join } from "path";
import { FEATURES } from "@/components/FeatureStrip";
import { parseReservationsCSV } from "@/lib/importers/reservations";
import { parseEarningsCSV } from "@/lib/importers/earnings";
import {
  calcGapNights,
  calcMonthlyProfit,
  incomePerNight,
  totalBookedNights,
} from "@/lib/calculations";
import { calcPace } from "@/lib/pace";
import { calcTaxYears } from "@/lib/tax";
import { formatMoney } from "@/lib/format";
import { SAMPLE_AS_OF, SAMPLE_COSTS } from "@/lib/sample";

const SAMPLES = join(__dirname, "../../public/samples");
const reservations = parseReservationsCSV(
  readFileSync(join(SAMPLES, "sample-reservations.csv"), "utf-8")
);
const payouts = parseEarningsCSV(readFileSync(join(SAMPLES, "sample-earnings.csv"), "utf-8"));
const example = (title: string) => FEATURES.find((f) => f.title === title)!.example;

describe("landing page examples match the demo", () => {
  const nightValue = incomePerNight(reservations, payouts);

  it("profit per night", () => {
    const net = calcMonthlyProfit(reservations, payouts, SAMPLE_COSTS).reduce(
      (s, m) => s + m.profit,
      0
    );
    const perNight = net / totalBookedNights(reservations);
    expect(example("Profit, not payouts")).toBe(
      `Profit / night: ${formatMoney(perNight)} of ${formatMoney(nightValue)} earned`
    );
  });

  it("first upcoming gap", () => {
    const gap = calcGapNights(reservations, nightValue, SAMPLE_AS_OF).gaps.find((g) => g.upcoming)!;
    expect(gap.start).toEqual(new Date(2025, 7, 25));
    expect(example("Gap nights")).toBe(
      `Aug 25–26 · ${gap.nights} nights stuck between stays, worth about ${formatMoney(gap.nights * nightValue)}`
    );
  });

  it("month furthest behind", () => {
    const worst = calcPace(reservations, SAMPLE_AS_OF)
      .filter((m) => m.lastYearSamePoint !== null)
      .sort((a, b) => b.lastYearSamePoint! - b.nightsNow - (a.lastYearSamePoint! - a.nightsNow))[0];
    expect(worst.label).toBe("Aug 2025");
    expect(example("Pace")).toBe(
      `August is ${worst.lastYearSamePoint! - worst.nightsNow} nights behind last year`
    );
  });

  it("tax year offered for download", () => {
    const finished = calcTaxYears(reservations, payouts, SAMPLE_COSTS, SAMPLE_AS_OF).filter(
      (y) => !y.inProgress && y.stays > 0
    );
    expect(example("Tax season")).toBe(
      `Download ${finished.at(-1)!.year} for your accountant (CSV)`
    );
  });
});
