import { BlockedSpan, ParsedData, Payout, Reservation } from "./models";

/**
 * Combine a new import with what's already loaded.
 *
 * Stays: the same stay can arrive twice — from the reservations CSV and from
 * a calendar feed — keyed by confirmation code. The CSV row knows things the
 * calendar can't (status, booked date, payout, listing), so its fields win
 * whichever arrives first; the calendar copy only fills gaps.
 *
 * Listing names: a calendar feed has none. A feed is filed under a listing
 * only when it shares bookings with that listing's CSV rows — never just
 * because one listing happens to be loaded, since the feed may be another
 * property.
 *
 * Payouts: re-adding an earnings file (or one whose dates overlap) must not
 * double the money, so incoming rows already loaded are dropped.
 */
export function mergeParsed(base: ParsedData, incoming: ParsedData): ParsedData {
  const byId = new Map<string, Reservation>();
  const withoutId: Reservation[] = [];
  for (const r of [...base.reservations, ...incoming.reservations]) {
    if (!r.id) {
      withoutId.push(r);
      continue;
    }
    const existing = byId.get(r.id);
    byId.set(r.id, existing ? combine(existing, r) : r);
  }

  const reservations = [...byId.values(), ...withoutId];
  const blocked = [...(base.blocked ?? []), ...(incoming.blocked ?? [])];
  nameCalendars(reservations, blocked);

  return {
    reservations,
    payouts: [...base.payouts, ...newPayouts(base.payouts, incoming.payouts)],
    blocked,
  };
}

/** Defined fields of `primary` over `secondary`. */
function overlay(secondary: Reservation, primary: Reservation): Reservation {
  const out: Reservation = { ...secondary };
  for (const [k, v] of Object.entries(primary)) {
    if (v !== undefined) (out as unknown as Record<string, unknown>)[k] = v;
  }
  return out;
}

function combine(a: Reservation, b: Reservation): Reservation {
  // A CSV row beats a calendar copy. Between two of the same kind, the newer
  // import wins (a re-exported CSV may have a status that has since changed).
  if (a.source === "calendar" && b.source !== "calendar") return overlay(a, b);
  if (b.source === "calendar" && a.source !== "calendar") return overlay(b, a);
  return overlay(a, b);
}

/**
 * Give an unnamed calendar feed the listing name its matched stays carry.
 * Mutates in place: these are the freshly built arrays from mergeParsed.
 */
function nameCalendars(reservations: Reservation[], blocked: BlockedSpan[]) {
  const namesByFeed = new Map<string, Set<string>>();
  for (const r of reservations) {
    if (!r.calendarId || !r.listingName) continue;
    if (!namesByFeed.has(r.calendarId)) namesByFeed.set(r.calendarId, new Set());
    namesByFeed.get(r.calendarId)!.add(r.listingName);
  }
  const nameFor = (id: string | undefined) => {
    const names = id ? namesByFeed.get(id) : undefined;
    return names && names.size === 1 ? [...names][0] : undefined;
  };
  for (let i = 0; i < reservations.length; i++) {
    const r = reservations[i];
    const name = !r.listingName ? nameFor(r.calendarId) : undefined;
    if (name) reservations[i] = { ...r, listingName: name };
  }
  for (let i = 0; i < blocked.length; i++) {
    const b = blocked[i];
    const name = !b.listingName ? nameFor(b.calendarId) : undefined;
    if (name) blocked[i] = { ...b, listingName: name };
  }
}

function payoutKey(p: Payout): string {
  return [p.date.getTime(), p.amount, p.type, p.confirmationCode ?? "", p.description ?? ""].join(
    "|"
  );
}

/**
 * Incoming payouts not already loaded. Matching is one-for-one, so two
 * genuinely identical lines in the same file both survive the first import.
 */
function newPayouts(existing: Payout[], incoming: Payout[]): Payout[] {
  const counts = new Map<string, number>();
  for (const p of existing) counts.set(payoutKey(p), (counts.get(payoutKey(p)) ?? 0) + 1);
  return incoming.filter((p) => {
    const k = payoutKey(p);
    const n = counts.get(k) ?? 0;
    if (n > 0) {
      counts.set(k, n - 1);
      return false;
    }
    return true;
  });
}
