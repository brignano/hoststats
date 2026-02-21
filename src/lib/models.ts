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

export interface ParsedData {
  reservations: Reservation[];
  payouts: Payout[];
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
