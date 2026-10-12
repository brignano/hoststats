import { BreakEven, GapReport, LeadTimes, PaceMonth, TaxYear } from "./models";
import { pricingDeadline } from "./pace";
import { formatCount, formatMoney, formatNightRange } from "./format";

/**
 * The "what to do now" list: the handful of things on the dashboard a host
 * can act on this week, pulled to the top. Every item comes from a number a
 * section below already shows, and links to that section.
 *
 * Ordered by how soon acting stops being possible: a gap night next week
 * beats a pricing deadline in two months beats a tax reminder.
 */

export type ActionTone = "attention" | "info";

export interface Action {
  id: string;
  tone: ActionTone;
  title: string;
  detail: string;
  /** Anchor of the section with the full picture. */
  href: string;
  linkLabel: string;
}

export interface ActionInputs {
  asOf: Date;
  gaps: GapReport;
  pace: PaceMonth[];
  lead: LeadTimes | null;
  breakEven: BreakEven;
  hasIncome: boolean;
  hasCosts: boolean;
  hasReservations: boolean;
  /** Average income per booked night; 0 when unknown. */
  nightValue: number;
  taxYears: TaxYear[];
}

const MAX_ACTIONS = 4;
const nights = (n: number) => `${formatCount(n)} night${n === 1 ? "" : "s"}`;
const DAY = 86_400_000;

export function buildActions(input: ActionInputs): Action[] {
  const { asOf, gaps, pace, lead, breakEven, nightValue } = input;
  const actions: Action[] = [];

  // 1. Upcoming gap nights: the most perishable thing on the page.
  const upcoming = gaps.gaps
    .filter((g) => g.upcoming)
    .sort((a, b) => a.start.getTime() - b.start.getTime())
    .slice(0, 2);
  // Name the listing only when there's more than one to tell apart.
  const manyListings = new Set(gaps.gaps.map((g) => g.listingName ?? "")).size > 1;
  for (const g of upcoming) {
    const worth = nightValue > 0 ? `, worth about ${formatMoney(g.nights * nightValue)}` : "";
    actions.push({
      id: `gap-${g.start.getTime()}-${g.listingName ?? ""}`,
      tone: "attention",
      title: `Open up ${formatNightRange(g.start, g.nights)}`,
      detail: `${nights(g.nights)} stuck between two stays${worth}${
        manyListings && g.listingName ? ` at ${g.listingName}` : ""
      }. Lower the minimum stay or the price on just these dates.`,
      href: "#gaps",
      linkLabel: "See gap nights",
    });
  }

  // 2. The month furthest behind last year's pace.
  const behind = pace
    .filter((m) => m.lastYearSamePoint !== null)
    .map((m) => ({ m, short: m.lastYearSamePoint! - m.nightsNow }))
    .filter((x) => x.short >= 2)
    .sort((a, b) => b.short - a.short)[0];
  if (behind) {
    const late = (behind.m.lastYearFinal ?? 0) - behind.m.lastYearSamePoint!;
    actions.push({
      id: `pace-${behind.m.month}`,
      tone: "attention",
      title: `${behind.m.label} is ${nights(behind.short)} behind last year`,
      detail:
        late > 0
          ? `Last year another ${nights(late)} came in after this date, so there's time — check the price on its emptiest dates.`
          : `Last year it was already full by now. Check the price on its emptiest dates.`,
      href: "#pace",
      linkLabel: "See pace",
    });
  } else {
    // Filling much faster than last year can mean prices are too low.
    const ahead = pace
      .filter((m) => m.lastYearSamePoint && m.nightsNow - m.lastYearSamePoint >= 3)
      .find((m) => (m.nightsNow - m.lastYearSamePoint!) / m.lastYearSamePoint! >= 0.2);
    if (ahead) {
      actions.push({
        id: `pace-ahead-${ahead.month}`,
        tone: "info",
        title: `${ahead.label} is filling faster than last year`,
        detail: `${nights(ahead.nightsNow)} booked against ${formatCount(
          ahead.lastYearSamePoint!
        )} by now last year. Your price for the dates still open may be too low.`,
        href: "#pace",
        linkLabel: "See pace",
      });
    }
  }

  // 3. A pricing deadline coming up in the next two months.
  const deadline = lead ? pricingDeadline(lead, asOf) : null;
  if (deadline) {
    const daysLeft = Math.round((deadline.date.getTime() - asOf.getTime()) / DAY);
    if (daysLeft >= 0 && daysLeft <= 60) {
      actions.push({
        id: `deadline-${deadline.month}`,
        tone: "info",
        title: `Set ${deadline.month} prices by ${deadline.setBy}`,
        detail: `${deadline.month} guests book a median ${deadline.medianDays} days ahead, so most of the month sells in the next few weeks.`,
        href: "#pace",
        linkLabel: "See booking window",
      });
    }
  }

  // 4. Profit: the one number Airbnb can't show.
  if (input.hasIncome && !input.hasCosts) {
    actions.push({
      id: "costs",
      tone: "info",
      title: "Enter your costs to see real profit",
      detail:
        "Two rough numbers — monthly bills and cost per stay — turn payouts into profit and a break-even target.",
      href: "#profit",
      linkLabel: "Add costs",
    });
  } else if (input.hasCosts && input.hasReservations && input.hasIncome) {
    if (breakEven.nightsPerMonth === null) {
      actions.push({
        id: "break-even-never",
        tone: "attention",
        title: "Each stay costs more than it earns",
        detail:
          "More bookings won't fix this. Raise the nightly price, the cleaning fee, or the minimum stay.",
        href: "#profit",
        linkLabel: "See profit",
      });
    } else if (breakEven.actualNightsPerMonth < breakEven.nightsPerMonth) {
      actions.push({
        id: "break-even-short",
        tone: "attention",
        title: `Below break-even: ${nights(breakEven.nightsPerMonth)} a month needed`,
        detail: `You've averaged ${formatCount(breakEven.actualNightsPerMonth)}.`,
        href: "#profit",
        linkLabel: "See profit",
      });
    }
  }

  // 5. Tax season (January–April): last year's totals are ready.
  if (asOf.getMonth() <= 3) {
    const last = input.taxYears.find((y) => y.year === asOf.getFullYear() - 1 && y.stays > 0);
    if (last) {
      actions.push({
        id: `tax-${last.year}`,
        tone: "info",
        title: `Your ${last.year} tax totals are ready`,
        detail: `${formatMoney(last.rentsReceived)} in rents over ${nights(
          last.rentalDays
        )}. Download the breakdown for whoever does your taxes.`,
        href: "#tax",
        linkLabel: "See tax season",
      });
    }
  }

  return actions.slice(0, MAX_ACTIONS);
}
