import { isRemembering, setRemembering, stripGuestNames } from "@/lib/savedData";
import { ParsedData, Reservation } from "@/lib/models";

// Jest runs in node here, so give the module a minimal window.localStorage.
// The IndexedDB half is exercised for real in e2e/smoke.spec.ts, in a browser.
function installStorage(overrides: Partial<Storage> = {}) {
  const store = new Map<string, string>();
  const localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    ...overrides,
  };
  (globalThis as { window?: unknown }).window = { localStorage };
  return store;
}

afterEach(() => {
  delete (globalThis as { window?: unknown }).window;
});

function stay(extra: Partial<Reservation> = {}): Reservation {
  return {
    id: "HM1",
    status: "accepted",
    checkIn: new Date(2025, 7, 20),
    checkOut: new Date(2025, 7, 25),
    nights: 5,
    ...extra,
  };
}

describe("the remember preference", () => {
  it("is off until it is set", () => {
    installStorage();
    expect(isRemembering()).toBe(false);
  });

  it("round-trips, and unsetting clears the key rather than storing a false", () => {
    const store = installStorage();
    setRemembering(true);
    expect(isRemembering()).toBe(true);
    setRemembering(false);
    expect(isRemembering()).toBe(false);
    expect([...store.keys()]).toEqual([]);
  });

  it("stays off when storage throws, rather than breaking the visit", () => {
    installStorage({
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    });
    expect(() => setRemembering(true)).not.toThrow();
    expect(isRemembering()).toBe(false);
  });

  it("is off when there is no window at all (the prerender)", () => {
    expect(isRemembering()).toBe(false);
  });
});

describe("guest names are never written to disk", () => {
  it("drops guestName and keeps every other field", () => {
    const data: ParsedData = {
      reservations: [
        stay({ guestName: "Dana Scully", listingName: "Beach House", payoutAmount: 1130 }),
      ],
      payouts: [{ date: new Date(2025, 7, 21), type: "Payout", amount: 1130 }],
      blocked: [{ start: new Date(2025, 8, 1), end: new Date(2025, 8, 3) }],
    };

    const stored = stripGuestNames(data);

    expect(stored.reservations[0]).not.toHaveProperty("guestName");
    expect(stored.reservations[0]).toMatchObject({
      id: "HM1",
      nights: 5,
      listingName: "Beach House",
      payoutAmount: 1130,
    });
    // Everything else survives untouched, dates included.
    expect(stored.reservations[0].checkIn).toEqual(new Date(2025, 7, 20));
    expect(stored.payouts).toEqual(data.payouts);
    expect(stored.blocked).toEqual(data.blocked);
  });

  it("leaves the caller's copy alone, so the dashboard still has the names", () => {
    const original = stay({ guestName: "Fox Mulder" });
    const data: ParsedData = { reservations: [original], payouts: [] };
    stripGuestNames(data);
    expect(original.guestName).toBe("Fox Mulder");
  });

  it("copes with a stay that never had a name", () => {
    const data: ParsedData = { reservations: [stay()], payouts: [] };
    expect(stripGuestNames(data).reservations[0]).not.toHaveProperty("guestName");
  });
});
