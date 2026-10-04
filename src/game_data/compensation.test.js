import { describe, it, expect } from "vitest";
import { estCompensation } from "./compensation";

describe("Brain Games compensation", () => {
  it("pays base plus bonus over half done, base for any play, nothing otherwise", () => {
    const rates = [0.9, 0.3, 0, ...Array(11).fill(1)];
    const [compRates, cumulative] = estCompensation(rates, { game: { cyclePassed: () => true } });

    expect(compRates.slice(0, 3)).toEqual(["$ 3.00", "$ 2.00", "$ 0.00"]); // day 1's bonus is $1
    // $2 a day plus $22 of bonuses over 14 days, less day 2's $2 bonus and day 3's $5
    expect(cumulative.slice(0, 3)).toEqual([3, 5, 5]);
    expect(cumulative[13]).toBe(43);
  });
});
