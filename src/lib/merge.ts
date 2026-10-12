import { ParsedData } from "./models";

/**
 * Combine a new import with what's already loaded.
 *
 * A stay can arrive twice — once from the reservations CSV and once from the
 * calendar feed. The confirmation code identifies it; the copy with a payout
 * wins, since the calendar never has one.
 *
 * The calendar feed also has no listing name. When everything loaded so far
 * belongs to one listing, unnamed calendar stays are assumed to be that
 * listing, so gap nights see one calendar rather than two half-calendars.
 */
export function mergeParsed(base: ParsedData, incoming: ParsedData): ParsedData {
  const all = [...base.reservations, ...incoming.reservations];
  const names = new Set(all.map((r) => r.listingName).filter(Boolean));
  const onlyName = names.size === 1 ? [...names][0] : undefined;

  const byId = new Map<string, (typeof all)[number]>();
  const withoutId: typeof all = [];
  for (const r of all) {
    const named = r.listingName || !onlyName ? r : { ...r, listingName: onlyName };
    if (!named.id) {
      withoutId.push(named);
      continue;
    }
    const existing = byId.get(named.id);
    if (!existing || (existing.payoutAmount === undefined && named.payoutAmount !== undefined)) {
      byId.set(named.id, existing ? { ...existing, ...named } : named);
    }
  }

  const blocked = [...(base.blocked ?? []), ...(incoming.blocked ?? [])].map((b) =>
    b.listingName || !onlyName ? b : { ...b, listingName: onlyName }
  );

  return {
    reservations: [...byId.values(), ...withoutId],
    payouts: [...base.payouts, ...incoming.payouts],
    blocked,
  };
}
