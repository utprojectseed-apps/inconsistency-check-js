import { describe, it, expect } from "vitest";
import LightsOut from "./lightsout";
import { redcapExport } from "../testing";

// Strike L: lights off 2+ hours after finishing that day's game. Night N's
// lights-off time is reported in day N+1's survey.
const lights = new LightsOut(
  redcapExport({
    startdt: "2026-09-07",
    days: {
      2: { timestamp: "2026-09-08 21:30:00", act3h: 10, act3m: 4, act3p: 1 }, // 10:30 PM
      8: { timestamp: "2026-09-14 21:30:00" }, // lights-off left blank
    },
  })
);
const finished = (day, hour) => new Date(2026, 8, 6 + day, hour, 0);

describe("LightsOut", () => {
  it("strikes a bedtime 2+ hours after the game", () => {
    expect(lights.evaluate("9001", 1, finished(1, 20))).toMatchObject({
      day: 1,
      scenario: "LIGHTS_OUT",
      message: "finished playing 20:00 → lights off 22:30 (gap 2h 30m), reported on day 2",
      severity: 0, // reported for review, never a contact on its own
    });
  });

  it("stays silent under 2 hours", () => {
    expect(lights.evaluate("9001", 1, finished(1, 21))).toBeNull();
  });

  it("strikes a blank answer on a survey that was taken", () => {
    expect(lights.evaluate("9001", 7, finished(7, 20)).message).toMatch(/^not checked — day 8's survey was completed/);
  });

  it("stays silent when the next survey has not been taken, or there is none", () => {
    expect(lights.evaluate("9001", 3, finished(3, 20))).toBeNull();
    expect(lights.evaluate("9001", 14, finished(14, 20))).toBeNull();
  });
});
