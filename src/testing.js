// Shared test helpers. Uploads are read the way the app reads them, so tests
// exercise the same parsing and danfo typing that staff get.
import { readFileSync } from "node:fs";
import * as dfd from "danfojs";
import { readString } from "react-papaparse";
import rowsToFrame from "./components/csvframe";
import DataDict from "./survey/dataDict";

/** CSV text -> DataFrame, exactly as an uploaded file is read. */
export function frameFromCsv(text) {
  let rows;
  readString(text, { complete: (results) => { rows = results.data; } });
  return rowsToFrame(rows);
}

export function readFixture(url) {
  return frameFromCsv(readFileSync(url, "utf8"));
}

/** A REDCap data dictionary, parsed the way dfd.readCSV parses the bundled ones. */
export function dataDictFromCsv(text) {
  let rows;
  readString(text, {
    header: true, dynamicTyping: true, skipEmptyLines: "greedy",
    complete: (results) => { rows = results.data; },
  });
  const dict = new DataDict();
  dict.df = new dfd.DataFrame(rows);
  return dict;
}

/** Rows of {column: value} -> CSV text, quoting where needed. */
export function toCsv(columns, rows) {
  const cell = (value) => {
    const s = value === undefined || value === null ? "" : String(value);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [columns, ...rows.map((row) => columns.map((c) => row[c]))]
    .map((line) => line.map(cell).join(","))
    .join("\n") + "\n";
}

const WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const section = (prefix, codes) => codes.map((c) => `${prefix}${c}`);
// Strikes F/G read the translation questions and four parent sections.
export const SURVEY_FIELDS = [
  "date", "strti", "dowee", "sexo", "mood", "act3h", "act3m", "act3p", "tranm", "tranf",
  ...section("mstr", [1, 2, 3, 4]), ...section("fstr", [1, 2, 3, 4]),
  ...section("mag", ["01", "02", "03", "04"]), ...section("fag", ["01", "02", "03", "04"]),
  "endti",
];

/**
 * A REDCap export in long format: per participant, an enrollment row, then a
 * row per daily-survey event. Each day's fields sit between that survey's
 * _timestamp and _complete columns, which is how REDCap lays them out and
 * what the completion check relies on.
 *
 * @param {...Object} participants - {id, startdt, days}, where days is
 *   {dayNumber: {timestamp, date, strti, ...}}; days left out have no row.
 */
export function redcapExport(...participants) {
  const columns = ["participant_id", "redcap_event_name", "startdt"];
  const form = (n) => `day_${n}_${WEEKDAYS[(n - 1) % 7]}_daily_survey`;
  for (let n = 1; n <= 14; ++n) {
    columns.push(`${form(n)}_timestamp`, ...SURVEY_FIELDS.map((f) => `t${n}${f}`), `${form(n)}_complete`);
  }
  const rows = [];
  for (const { id = "9001", startdt, days } of participants) {
    rows.push({ participant_id: id, redcap_event_name: "enrollment_arm_1", startdt });
    for (const [n, answers] of Object.entries(days)) {
      const row = { participant_id: id, redcap_event_name: `day_${n}_arm_1` };
      row[`${form(n)}_timestamp`] = answers.timestamp;
      for (const f of SURVEY_FIELDS) row[`t${n}${f}`] = answers[f];
      row[`${form(n)}_complete`] = answers.timestamp ? 2 : 0;
      rows.push(row);
    }
  }
  return frameFromCsv(toCsv(columns, rows));
}
