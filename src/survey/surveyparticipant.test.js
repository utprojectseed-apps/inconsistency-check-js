import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import Survey from "./survey";
import { dataDictFromCsv, redcapExport, SURVEY_FIELDS, toCsv } from "../testing";

// A cut-down data dictionary in REDCap's export format. The codes match the
// real dictionaries (see dataDict.test.js).
function dataDict() {
  const choices = {
    dowee: "1, Monday | 2, Tuesday | 3, Wednesday | 4, Thursday | 5, Friday | 6, Saturday | 7, Sunday",
    sexo: "1, Male | 2, Female",
    mood: "1, Good | 2, OK | 3, Bad",
    act3h: "1, 01 | 2, 02 | 3, 03 | 4, 04 | 5, 05 | 6, 06 | 7, 07 | 8, 08 | 9, 09 | 10, 10 | 11, 11 | 12, 12",
    act3m: "1, 00 | 2, 10 | 3, 20 | 4, 30 | 5, 40 | 6, 50",
    act3p: "1, PM | 2, AM",
    tran: "1, Yes | 2, No",
    str: "1, I didn't translate this today | 2, Not stressful | 3, A little stressful | 4, Very stressful",
    ag: "0, I didn't translate today | 1, Strongly disagree | 2, Disagree | 3, Agree | 4, Strongly agree",
  };
  // tranm/tranf, then the stress (mstr, fstr) and agreement (mag, fag) sections
  const choiceSet = (field) =>
    field.startsWith("tran") ? "tran" : /str\d/.test(field) ? "str" : /ag\d/.test(field) ? "ag" : field;
  const columns = ["Variable / Field Name", "Field Label", "Choices, Calculations, OR Slider Labels",
    "Branching Logic (Show field only if...)", "Field Annotation"];
  const rows = [];
  for (let n = 1; n <= 14; ++n) {
    for (const field of SURVEY_FIELDS) {
      rows.push({
        "Variable / Field Name": `t${n}${field}`,
        "Field Label": `${field}/${field}`,
        "Choices, Calculations, OR Slider Labels": choices[choiceSet(field)],
      });
    }
  }
  return dataDictFromCsv(toCsv(columns, rows));
}

// Study days 1-14 run Monday 7 to Sunday 20 September 2026.
const dateOf = (n) => `2026-09-${String(6 + n).padStart(2, "0")}`;
const answers = (prefix, codes, values) =>
  Object.fromEntries(codes.map((code, i) => [`${prefix}${code}`, values[i]]));
const AG = ["01", "02", "03", "04"];

// A survey taken properly: submitted 21:30 after 10 minutes, the right
// weekday, lights off at 10:30 PM the night before, and no translating for
// either parent, with every parent section answered to match.
const taken = (n, overrides = {}) => ({
  timestamp: `${dateOf(n)} 21:30:00`, date: dateOf(n), strti: "21:20", endti: "21:30",
  dowee: ((n - 1) % 7) + 1, sexo: 1, mood: 2, act3h: 10, act3m: 4, act3p: 1,
  tranm: 2, tranf: 2,
  ...answers("mstr", [1, 2, 3, 4], [1, 1, 1, 1]), ...answers("fstr", [1, 2, 3, 4], [1, 1, 1, 1]),
  ...answers("mag", AG, [0, 0, 0, 0]), ...answers("fag", AG, [0, 0, 0, 0]),
  ...overrides,
});

const days = {
  1: taken(1),
  2: taken(2, { dowee: 3 }), // a Tuesday answered as Wednesday
  // weekday left blank; night 2's lights-off reported as 1:00 AM
  3: taken(3, { dowee: "", act3h: 1, act3m: 1, act3p: 2 }),
  4: taken(4, { sexo: 2 }), // sex answered differently from day 1
  // day 5 never opened
  6: { date: dateOf(6), strti: "21:20", dowee: 6 }, // opened and abandoned
  7: taken(7),
  8: taken(8, { act3h: "", act3m: "", act3p: "" }), // night 7's lights-off left blank
  // no translating for mother, but 4 stress answers about it
  9: taken(9, answers("mstr", [1, 2, 3, 4], [2, 3, 2, 4])),
  // the same for both parents
  10: taken(10, { ...answers("mstr", [1, 2, 3, 4], [2, 2, 2, 2]), ...answers("fstr", [1, 2, 3, 4], [3, 3, 3, 3]) }),
  // translated for mother, so the stress answers are expected
  11: taken(11, { tranm: 1, ...answers("mstr", [1, 2, 3, 4], [2, 3, 2, 4]) }),
  // only 3 off, which is allowed
  12: taken(12, answers("mstr", [1, 2, 3, 4], [2, 2, 2, 1])),
  13: taken(13, { strti: "20:40" }), // took 50 minutes
  14: taken(14),
};

// A second participant for Strike K's clock handling.
const clockDays = {
  // REDCap stamped this on a UTC server clock, 5 hours ahead of the 21:30
  // the participant entered as their finish time
  1: taken(1, { timestamp: "2026-09-08 02:30:00" }),
  2: taken(2, { act3h: 1, act3m: 1, act3p: 2 }), // night 1: 1:00 AM
  // night 2: 11:30 AM, surely a mis-tapped PM; and no finish time today
  3: taken(3, { act3h: 11, act3m: 4, act3p: 2, endti: "" }),
  4: taken(4, { act3h: 1, act3m: 1, act3p: 2 }), // night 3: 1:00 AM
};

class StudySurvey extends Survey {}

describe("SurveyParticipant", () => {
  let survey, participant, clocks;
  const strikes = (day, who = participant) => who.getStrikesForDay(day - 1);
  const letters = (day) => strikes(day).map((s) => s[0]);

  beforeAll(() => {
    // the whole cycle is over
    vi.useFakeTimers({ now: new Date(2026, 8, 25, 12), toFake: ["Date"] });
    survey = new StudySurvey();
    survey.dataDict = dataDict();
    survey.setData(redcapExport(
      { id: "9001", startdt: "2026-09-07", days },
      { id: "9002", startdt: "2026-09-07", days: clockDays },
    ));
    survey.setSelectedIds(["9001", "9002"]);
    [participant, clocks] = survey.getParticipants();
  });
  afterAll(() => vi.useRealTimers());

  it("splits an export into one report per participant", () => {
    expect(survey.getParticipantIds()).toEqual(expect.arrayContaining(["9001", "9002"]));
    expect([participant.getParticipantId(), clocks.getParticipantId()]).toEqual(["9001", "9002"]);
  });

  it("A: measures how much of each day was answered", () => {
    const pct = participant.getPercentComplete();
    // 24 questions count; the lights-off answers are optional
    expect([pct[0], pct[2], pct[4], pct[5]]).toEqual([1, 23 / 24, 0, 3 / 24]);
    expect(letters(5)).toContain("A");
    expect(letters(6)).toContain("A");
    expect(letters(3)).not.toContain("A");
  });

  it("shows each day's date, submit time and duration", () => {
    expect([0, 4, 5].map((i) => participant.getDate(i))).toEqual(["2026-09-07", "Not Submitted", "2026-09-12"]);
    // the header uses the schedule, not the typed date, so after-midnight days don't repeat a date
    expect([0, 5, 13].map((i) => participant.getScheduledDate(i))).toEqual(["2026-09-07", "2026-09-12", "2026-09-20"]);
    expect([0, 4].map((i) => participant.getSubmitTime(i))).toEqual(["21:30", "--:--"]);
    expect([0, 12].map((i) => participant.getDuration(i))).toEqual(["00:10", "00:50"]);
  });

  it("D: flags a wrong or missing weekday", () => {
    expect(strikes(2)).toContainEqual(expect.stringMatching(/^D: .*answered Wednesday, but day 2 is a Tuesday/s));
    expect(strikes(3)).toContainEqual(expect.stringMatching(/^D: .*day-of-week answer was left blank/s));
  });

  it("H: flags a survey that took over 45 minutes", () => {
    expect(letters(13)).toEqual(["H"]);
  });

  it("J: flags a sex answer that changed during the cycle", () => {
    expect(strikes(4)).toContainEqual(expect.stringMatching(/^J: .*answered Female \(2\), but day 1 answered Male \(1\)/s));
  });

  it("F/G: flags parent sections answered after saying they did not translate", () => {
    expect(strikes(9)).toEqual([
      "F: Inconsistent answers for sections 1A" +
        "\n  said they did not translate for their mother today, but still answered 4 questions about it in section 1A",
    ]);
    expect(strikes(10)).toEqual([expect.stringMatching(
      /^G: Inconsistent answers for sections 1A, 1B\n.*\n {2}⚠ both the mother and the father sections contradict/
    )]);
    // translated, so the section applies; and 3 off-baseline answers are allowed
    expect(strikes(11)).toEqual([]);
    expect(strikes(12)).toEqual([]);
  });

  it("K: flags lights off 2+ hours after the survey, using the next day's answer", () => {
    expect(strikes(2)).toContainEqual(expect.stringMatching(/^K: .*submitted 21:30 → lights off 01:00 {2}\(gap 3h 30m\)/s));
    expect(strikes(7)).toContainEqual(expect.stringMatching(/^K: .*day 8's survey was completed but the lights-off time was left blank/s));
    // night 4's answer would come from day 5, which never happened
    expect(letters(4)).not.toContain("K");
  });

  it("K: reads submissions on the participant's own clock", () => {
    // a server-clock timestamp of 02:30 is the participant's 21:30
    expect(strikes(1, clocks)).toContainEqual(expect.stringMatching(/^K: .*submitted 21:30 → lights off 01:00/s));
    expect(strikes(2, clocks)).toContainEqual(expect.stringMatching(
      /^K: .*lights off 23:30 .*answered as 11:30 AM but read as PM/s
    ));
    // no finish time on day 3, so day 2's clock is used, and the strike says so
    expect(strikes(3, clocks)).toContainEqual(expect.stringMatching(
      /^K: .*submitted 21:30 → lights off 01:00.*using day 2's recorded finish time/s
    ));
  });

  it("does not judge a survey that was abandoned", () => {
    expect(letters(6)).not.toContain("D");
    expect(letters(6)).not.toContain("J");
  });

  it("leaves a properly taken day alone", () => {
    for (const day of [1, 8, 14]) expect(strikes(day)).toEqual([]);
  });

  it("pays base plus bonus for answered days, base for barely started, nothing for missed", () => {
    expect(participant.getCompRate(0)).toBe("$ 3.00"); // $2 + $1 bonus
    expect(participant.getCompRate(4)).toBe("$ 0.00"); // day 5, never opened
    expect(participant.getCompRate(5)).toBe("$ 2.00"); // day 6, under 35% answered
    // $2 a day plus $22 of bonuses over 14 days, less day 5's $4 and day 6's $3 bonus
    expect(participant.getCumulativeComp(13)).toBe(43);
    expect(participant.getPotentialCumulativeComp(13)).toBe(43);
  });
});
