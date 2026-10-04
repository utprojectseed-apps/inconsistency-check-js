import { describe, it, expect } from "vitest";
import * as dfd from "danfojs";
import ParticipantList from "./participants";
import { readFixture } from "../testing";

// The fixtures are QA participant 9001's Mind Mix 1 cycle (brain games days
// 1-7, Fortune Decks days 8-14), made by running synthetic Firebase records
// through json2csv-cogtask. See fixtures/generate.py for the day-by-day plan.
function load(name, idColumn) {
  const data = readFixture(new URL(`./fixtures/${name}.csv`, import.meta.url));
  // the same steps a report page takes after an upload
  const ids = new dfd.Series(data[idColumn].values).unique();
  return new ParticipantList(ids, data).getParticipant("9001").game;
}

const firstWeek = (values) => values.slice(0, 7);
const strikesOn = (game, day) =>
  game.strikes.getStrikesForDay(day).map((s) => [s.scenario, s.severity]);

describe("BDS", () => {
  const bds = load("bds", "Subject");

  it("scores each day from its best session", () => {
    // day 2 missed, day 3 stopped at 7 of 14 trials, day 4 an abandoned
    // session followed by a full one
    expect(firstWeek(bds.getCompletedDays())).toEqual([100, 0, 50, 100, 100, 100, 100]);
    expect(firstWeek(bds.getMeanSessionsAccuracys())).toEqual(
      ["71.43", 0, "100.00", "85.71", "21.43", "100.00", "78.57"]
    );
  });

  it("strikes missed, incomplete and inaccurate days", () => {
    expect([1, 2, 3, 4, 5, 6, 7].map((day) => strikesOn(bds, day))).toEqual([
      [],
      [["MISSING", 2]],
      [["COMPLETION", 1]],
      [],
      [["ACCURACY", 1]],
      [],
      [],
    ]);
  });

  it("takes the study day from the day column, not the clock", () => {
    // day 7 was played at 00:20 on the calendar date of day 8
    expect(bds.getStartTimes()[6]).toBe("09/14/2026 00:20");
    expect(bds.getNumberSessionsDays()[7]).toBe(0);
  });
});

describe("Simon", () => {
  const simon = load("simon", "Subject");

  it("scores completion, accuracy and missed responses", () => {
    expect(simon.getCompletedDays().slice(0, 2)).toEqual([100, 50]);
    expect(simon.getMeanSessionsAccuracys().slice(0, 2)).toEqual(["87.50", "87.50"]);
    expect(simon.getNoInputTrialsDays().slice(0, 2)).toEqual(["0 out of 32", "2 out of 16"]);
    expect(simon.getPracticeTrialsAmountDays()[0]).toBe(4);
  });
});

describe("Color-Shape", () => {
  const cs = load("cs", "Subject");

  it("scores completion, accuracy and missed responses", () => {
    expect(cs.getCompletedDays()[0]).toBe(100);
    expect(cs.getMeanSessionsAccuracys()[0]).toBe("90.91");
    expect(cs.getNoInputTrialsDays()[0]).toBe("1 out of 33");
  });
});

describe("Fortune Decks", () => {
  const fortune = load("fortune", "subject_id");

  it("scores each day's deck choices and points", () => {
    // day 8 picks every deck in turn, day 10 stops at 40 picks of mostly C and D
    expect(fortune.getCompletedDays().slice(7, 10)).toEqual([100, 0, 50]);
    expect(fortune.getScores().slice(7, 10)).toEqual(["0.00", undefined, "0.60"]);
    expect(fortune.getPoints()[7]).toBe(8100);
  });

  it("strikes the missed and the incomplete day", () => {
    expect(strikesOn(fortune, 8)).toEqual([]);
    expect(strikesOn(fortune, 9).map(([scenario]) => scenario)).toEqual(["MISSING"]);
    expect(strikesOn(fortune, 10).map(([scenario]) => scenario)).toEqual(["COMPLETION"]);
  });
});
