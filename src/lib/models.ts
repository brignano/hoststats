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
  /** When the guest booked. Airbnb's reservations export calls this "Booked". */
  bookedAt?: Date;
  /** Which import this came from. A CSV row's fields beat a calendar copy's. */
  source?: "csv" | "calendar";
  /** For calendar stays: which feed, so one feed's stays can be named together. */
  calendarId?: string;
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
  calendarId?: string;
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

/** One calendar year, in the shape a US host needs at tax time. */
export interface TaxYear {
  year: number;
  /** Payouts received in the year (Schedule E line 3, "Rents received"). */
  rentsReceived: number;
  /** "earnings" = exact payout dates; "reservations" = estimated from stay payouts. */
  incomeSource: "earnings" | "reservations" | "none";
  /** Booked nights falling in the year (Schedule E line 2, "Fair rental days"). */
  rentalDays: number;
  /** Stays that checked in during the year. */
  stays: number;
  /** Average nights per stay that checked in during the year. */
  avgStay: number;
  /** From the host's own cost estimates; null when none were entered. */
  estimatedExpenses: number | null;
  /** The year isn't over yet. */
  inProgress: boolean;
  /** Distinct listings with stays in the year. */
  listings: number;
}

export interface TaxStayRow {
  id: string;
  listingName?: string;
  checkIn: Date;
  checkOut: Date;
  /** Nights of this stay inside the year — a New Year stay is split. */
  nightsInYear: number;
  payoutAmount?: number;
}

export interface PaceMonth {
  month: string; // "YYYY-MM"
  label: string; // "Jun 2025"
  daysInMonth: number;
  /** Listings in the data; a month's capacity is daysInMonth × listings. */
  listings: number;
  /** Nights booked for this month as of the reference date. */
  nightsNow: number;
  /** Nights booked for the same month a year earlier, as of the same day a year earlier. */
  lastYearSamePoint: number | null;
  /** Where that month ended up last year. */
  lastYearFinal: number | null;
}

export interface LeadTimeMonth {
  month: number; // 0 = Jan
  label: string; // "Jan"
  /** Median days between booking and check-in; null with no stays. */
  medianDays: number | null;
  stays: number;
}

export interface LeadTimes {
  /** Stays with a known booking date. */
  stays: number;
  medianDays: number;
  /** Share of stays booked 7 days or less before check-in, 0–1. */
  lastMinuteShare: number;
  byMonth: LeadTimeMonth[];
}
