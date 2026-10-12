export interface Reservation {
  id: string;
  status: string; // e.g. "accepted", "cancelled"
  checkIn: Date;
  checkOut: Date;
  nights: number;
  guestName?: string;
  listingName?: string;
  /** Total payout amount if included in the reservations export */
  payoutAmount?: number;
}

export interface Payout {
  date: Date;
  type: string; // e.g. "payout", "adjustment"
  amount: number;
  description?: string;
  confirmationCode?: string;
}

/** Dates the host or Airbnb closed off — not a stay, but not sellable either. */
export interface BlockedSpan {
  start: Date;
  /** Exclusive, like a check-out date. */
  end: Date;
  listingName?: string;
}

export interface ParsedData {
  reservations: Reservation[];
  payouts: Payout[];
  /** Only calendar feeds carry these; CSV exports don't. */
  blocked?: BlockedSpan[];
}

export interface MonthlyOccupancy {
  month: string; // "YYYY-MM"
  label: string; // "Jan 2024"
  bookedNights: number;
  totalNights: number;
  occupancyPct: number;
}

export interface WeekdayOccupancy {
  weekday: string; // "Mon", "Tue", ...
  bookedNights: number;
}

export interface MonthlyRevenue {
  month: string; // "YYYY-MM"
  label: string; // "Jan 2024"
  revenue: number;
}

/** What the host tells us it costs to run the place. Never leaves the browser. */
export interface Costs {
  /** Mortgage or rent, utilities, insurance, internet — paid booked or not. */
  monthlyFixed: number;
  /** Cleaning, laundry, restocking — paid once per stay. */
  perStay: number;
}

export interface MonthlyProfit {
  month: string; // "YYYY-MM"
  label: string; // "Jan 2024"
  income: number;
  costs: number;
  profit: number;
}

export interface BreakEven {
  /** Average income per booked night, after Airbnb's fees. */
  incomePerNight: number;
  /** What each extra booked night leaves after its share of per-stay costs. */
  contributionPerNight: number;
  /** Booked nights a month needed to cover fixed costs; null if no amount of nights would. */
  nightsPerMonth: number | null;
  /** The same, as a share of an average-length month. */
  occupancyPct: number | null;
  /** What the listing actually averaged. */
  actualNightsPerMonth: number;
}

export interface GapStretch {
  listingName?: string;
  /** First empty night. */
  start: Date;
  /** Number of empty nights between the two stays. */
  nights: number;
  /** True if the gap is still ahead of us and can be filled. */
  upcoming: boolean;
}

export interface GapReport {
  /** Gaps this short are counted. */
  maxGapNights: number;
  /** Shortest stay the listing has ever taken. */
  shortestStay: number;
  gaps: GapStretch[];
  pastNights: number;
  pastValue: number;
  upcomingNights: number;
  upcomingValue: number;
}
