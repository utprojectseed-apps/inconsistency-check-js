import { describe, it, expect } from "vitest";
import GameStrikes from "./gamestrikes";

describe("GameStrikes", () => {
  it("escalates missed days by the contact rules", () => {
    const strikes = new GameStrikes();
    const days = [1, 2, 3, 4, 11, 14];
    for (const day of days) strikes.addMissingStrike(day, "BDS");

    // Day 1 and days 11-13 are always a phone call (2). Days 2-10 alternate
    // phone, text (1), phone... by occurrence. Anything else is a text.
    expect(days.map((d) => strikes.getStrikesForDay(d)[0].severity)).toEqual([2, 2, 1, 2, 2, 1]);
  });

  it("reads rates given as percents, fractions or strings", () => {
    expect(GameStrikes._toFraction("80%")).toBe(0.8);
    expect(GameStrikes._toFraction(75)).toBe(0.75);
    expect(GameStrikes._toFraction("71.43")).toBeCloseTo(0.7143);
    expect(GameStrikes._toFraction(0.5)).toBe(0.5);
    expect(GameStrikes._toFraction("")).toBeNaN();
  });
});
