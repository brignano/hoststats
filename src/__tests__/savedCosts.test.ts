import { clearSavedCosts, loadSavedCosts, saveCosts } from "@/lib/savedCosts";

// Jest runs in node here, so give the module a minimal window.localStorage.
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

describe("saved costs", () => {
  it("round-trips the two numbers", () => {
    installStorage();
    saveCosts({ monthlyFixed: 2200, perStay: 120 });
    expect(loadSavedCosts()).toEqual({ monthlyFixed: 2200, perStay: 120 });
  });

  it("stores nothing but the two numbers", () => {
    const store = installStorage();
    saveCosts({ monthlyFixed: 1, perStay: 2, extra: "x" } as never);
    expect([...store.values()]).toEqual(['{"monthlyFixed":1,"perStay":2}']);
  });

  it("deletes them", () => {
    installStorage();
    saveCosts({ monthlyFixed: 2200, perStay: 120 });
    clearSavedCosts();
    expect(loadSavedCosts()).toBeNull();
  });

  it("ignores junk or tampered values", () => {
    const store = installStorage();
    store.set("hoststats.costs.v1", "not json");
    expect(loadSavedCosts()).toBeNull();
    store.set("hoststats.costs.v1", '{"monthlyFixed":-5,"perStay":10}');
    expect(loadSavedCosts()).toBeNull();
    store.set("hoststats.costs.v1", '{"monthlyFixed":"2200","perStay":10}');
    expect(loadSavedCosts()).toBeNull();
  });

  it("never throws when storage is blocked", () => {
    const boom = () => {
      throw new Error("SecurityError");
    };
    installStorage({ getItem: boom, setItem: boom, removeItem: boom });
    expect(() => saveCosts({ monthlyFixed: 1, perStay: 1 })).not.toThrow();
    expect(loadSavedCosts()).toBeNull();
    expect(() => clearSavedCosts()).not.toThrow();
  });

  it("does nothing without a window (prerender)", () => {
    expect(loadSavedCosts()).toBeNull();
    expect(() => saveCosts({ monthlyFixed: 1, perStay: 1 })).not.toThrow();
  });
});
