import {
  formatMoney,
  formatMoneyExact,
  formatMoneyAxis,
  formatCount,
} from "@/lib/format";

describe("formatMoney", () => {
  it("drops cents and groups thousands", () => {
    expect(formatMoney(38898)).toBe("$38,898");
    expect(formatMoney(0)).toBe("$0");
  });
});

describe("formatMoneyExact", () => {
  it("always shows cents", () => {
    expect(formatMoneyExact(1234.5)).toBe("$1,234.50");
    expect(formatMoneyExact(7)).toBe("$7.00");
  });
});

describe("formatMoneyAxis", () => {
  it("compacts thousands", () => {
    expect(formatMoneyAxis(39000)).toBe("$39k");
    expect(formatMoneyAxis(1500)).toBe("$1.5k");
  });

  it("leaves small values alone", () => {
    expect(formatMoneyAxis(750)).toBe("$750");
    expect(formatMoneyAxis(0)).toBe("$0");
  });
});

describe("formatCount", () => {
  it("groups thousands", () => {
    expect(formatCount(175)).toBe("175");
    expect(formatCount(12345)).toBe("12,345");
  });
});
