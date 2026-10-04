import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { dataDictFromCsv } from "../testing";

// The strike rules hard-code field names and answer codes. A re-exported
// REDCap form that renames a field or recodes an answer would quietly break
// them, so check the dictionaries that ship with the report.
describe.each(["Cognitive", "Fortune", "Mindmix1", "Mindmix2"])("%s data dictionary", (study) => {
  const dict = dataDictFromCsv(readFileSync(new URL(`./${study}DataDict.csv`, import.meta.url), "utf8"));
  const label = (field, code) => dict.getAnswers(field)[code];

  it("has every field the strike rules read, on every day", () => {
    const fields = ["date", "strti", "endti", "dowee", "sexo", "act3h", "act3m", "act3p", "tranm", "tranf",
      "mstr1", "fstr1", "mag01", "fag01"];
    const missing = [];
    for (let n = 1; n <= 14; ++n) {
      for (const f of fields) if (!dict.exists(`t${n}${f}`)) missing.push(`t${n}${f}`);
    }
    expect(missing).toEqual([]);
  });

  it("codes answers the way the strike rules assume", () => {
    // D: 1 = Monday ... 7 = Sunday
    expect(Object.keys(dict.getAnswers("t1dowee"))).toEqual(["1", "2", "3", "4", "5", "6", "7"]);
    expect(label("t1dowee", "1")).toMatch(/Monday/);
    expect(label("t1dowee", "7")).toMatch(/Sunday/);
    // K and L: minutes are a dropdown index, and 1 = PM
    expect(dict.getAnswers("t2act3m")).toEqual({ 1: "00", 2: "10", 3: "20", 4: "30", 5: "40", 6: "50" });
    expect(dict.getAnswers("t2act3p")).toEqual({ 1: "PM", 2: "AM" });
    // F/G: 2 = did not translate; the sections' "didn't translate" answers are 1 and 0
    expect(label("t2tranm", "2")).toMatch(/No/);
    expect(label("t2mstr1", "1")).toMatch(/didn't translate/);
    expect(label("t2mag01", "0")).toMatch(/didn't translate/);
  });
});
