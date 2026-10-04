import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import * as dfd from "danfojs";
import { readString } from "react-papaparse";
import DataDict from "./dataDict";
import SurveyParticipant from "./surveyparticipant";
import { redcapExport, toCsv } from "../testing";

// A cut-down data dictionary in REDCap's export format, parsed the way
// dfd.readCSV parses the bundled ones.
function dataDict() {
  const choices = {
    dowee: "1, Monday | 2, Tuesday | 3, Wednesday | 4, Thursday | 5, Friday | 6, Saturday | 7, Sunday",
    sexo: "1, Male | 2, Female",
    mood: "1, Good | 2, OK | 3, Bad",
    act3h: "1, 01 | 2, 02 | 3, 03 | 4, 04 | 5, 05 | 6, 06 | 7, 07 | 8, 08 | 9, 09 | 10, 10 | 11, 11 | 12, 12",
    act3m: "1, 00 | 2, 10 | 3, 20 | 4, 30 | 5, 40 | 6, 50",
    act3p: "1, PM | 2, AM",
  };
  const columns = ["Variable / Field Name", "Field Label", "Choices, Calculations, OR Slider Labels",
    "Branching Logic (Show field only if...)", "Field Annotation"];
  const rows = [];
  for (let n = 1; n <= 14; ++n) {
    for (const field of ["date", "strti", "dowee", "sexo", "mood", "act3h", "act3m", "act3p", "endti"]) {
      rows.push({
        "Variable / Field Name": `t${n}${field}`,
        "Field Label": `${field}/${field}`,
        "Choices, Calculations, OR Slider Labels": choices[field],
      });
    }
  }
  let parsed;
  readString(toCsv(columns, rows), {
    header: true, dynamicTyping: true, skipEmptyLines: "greedy",
    complete: (results) => { parsed = results.data; },
  });
  const dict = new DataDict();
  dict.df = new dfd.DataFrame(parsed);
  return dict;
}

// Study days 1-14 run Monday 7 to Sunday 20 September 2026.
const dateOf = (n) => `2026-09-${String(6 + n).padStart(2, "0")}`;

// A survey taken properly: submitted 21:30 after 10 minutes, the right
// weekday, and lights off at 10:30 PM the night before.
const taken = (n, answers = {}) => ({
  timestamp: `${dateOf(n)} 21:30:00`, date: dateOf(n), strti: "21:20", endti: "21:30",
  dowee: ((n - 1) % 7) + 1, sexo: 1, mood: 2, act3h: 10, act3m: 4, act3p: 1,
  ...answers,
});

const days = {
  1: taken(1),
  2: taken(2, { dowee: 3 }), // a Tuesday answered as Wednesday
  // weekday left blank; night 2's lights-off reported as 1:00 AM
  3: taken(3, { dowee: "", act3h: 1, act3m: 1, act3p: 2 }),
  4: taken(4, { sexo: 2 }), // sex answered differently from day 1
  // day 5 never opened
  6: { date: dateOf(6), strti: "21:20", dowee: 6 }, // opened, abandoned halfway
  7: taken(7),
  8: taken(8, { act3h: "", act3m: "", act3p: "" }), // night 7's lights-off left blank
};
for (let n = 9; n <= 14; ++n) days[n] = taken(n);

describe("SurveyParticipant", () => {
  let participant;
  const strikes = (day) => participant.getStrikesForDay(day - 1);
  const letters = (day) => strikes(day).map((s) => s[0]);

  beforeAll(() => {
    // the whole cycle is over
    vi.useFakeTimers({ now: new Date(2026, 8, 25, 12), toFake: ["Date"] });
    participant = new SurveyParticipant(redcapExport({ startdt: "2026-09-07", days }), dataDict());
  });
  afterAll(() => vi.useRealTimers());

  it("measures how much of each day was answered", () => {
    const pct = participant.getPercentComplete();
    expect([pct[0], pct[2], pct[4], pct[5]]).toEqual([1, 5 / 6, 0, 0.5]);
    expect(letters(5)).toContain("A");
    expect(letters(6)).toContain("A");
    expect(letters(3)).not.toContain("A");
  });

  it("D: flags a wrong or missing weekday", () => {
    expect(strikes(2)).toContainEqual(expect.stringMatching(/^D: .*answered Wednesday, but day 2 is a Tuesday/s));
    expect(strikes(3)).toContainEqual(expect.stringMatching(/^D: .*day-of-week answer was left blank/s));
  });

  it("J: flags a sex answer that changed during the cycle", () => {
    expect(strikes(4)).toContainEqual(expect.stringMatching(/^J: .*answered Female \(2\), but day 1 answered Male \(1\)/s));
  });

  it("K: flags lights off 2+ hours after the survey, using the next day's answer", () => {
    expect(strikes(2)).toContainEqual(expect.stringMatching(/^K: .*submitted 21:30 → lights off 01:00 {2}\(gap 3h 30m\)/s));
    expect(strikes(7)).toContainEqual(expect.stringMatching(/^K: .*day 8's survey was completed but the lights-off time was left blank/s));
    // night 4's answer would come from day 5, which never happened
    expect(letters(4)).not.toContain("K");
  });

  it("does not judge a survey that was abandoned", () => {
    expect(letters(6)).not.toContain("D");
    expect(letters(6)).not.toContain("J");
  });

  it("leaves a properly taken day alone", () => {
    for (const day of [1, 8, 9, 10, 11, 12, 13, 14]) expect(strikes(day)).toEqual([]);
  });

  it("pays base plus bonus for answered days and nothing for a missed one", () => {
    expect(participant.getCompRate(4)).toBe("$ 0.00"); // day 5
    expect(participant.getCompRate(5)).toBe("$ 5.00"); // day 6, half answered: $2 + $3 bonus
    // $2 a day plus $22 of bonuses over 14 days, less day 5's $2 + $2
    expect(participant.getCumulativeComp(13)).toBe(46);
    expect(participant.getPotentialCumulativeComp(13)).toBe(46);
  });
});
