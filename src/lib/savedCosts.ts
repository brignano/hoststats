import { Costs } from "./models";

/**
 * Opt-in only: the host ticks "Remember my costs on this device" and the two
 * numbers go into this browser's localStorage. Nothing else is ever stored,
 * and unticking deletes it.
 *
 * Storage can be missing or throw (private windows, blocked site data), so
 * every access is wrapped: failing to remember is never an error.
 */

const KEY = "hoststats.costs.v1";

function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

function amount(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
}

/** The saved costs, or null if none were saved or what's there isn't valid. */
export function loadSavedCosts(): Costs | null {
  try {
    const raw = storage()?.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const monthlyFixed = amount(parsed?.monthlyFixed);
    const perStay = amount(parsed?.perStay);
    if (monthlyFixed === null || perStay === null) return null;
    return { monthlyFixed, perStay };
  } catch {
    return null;
  }
}

export function saveCosts(costs: Costs): void {
  try {
    storage()?.setItem(
      KEY,
      JSON.stringify({ monthlyFixed: costs.monthlyFixed, perStay: costs.perStay })
    );
  } catch {
    // Quota or blocked storage: the costs still work for this visit.
  }
}

export function clearSavedCosts(): void {
  try {
    storage()?.removeItem(KEY);
  } catch {
    // Nothing to clear.
  }
}
