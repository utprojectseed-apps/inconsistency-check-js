// Shared test helpers. Uploads are read the way the app reads them, so tests
// exercise the same parsing and danfo typing that staff get.
import { readFileSync } from "node:fs";
import { readString } from "react-papaparse";
import rowsToFrame from "./components/csvframe";

/** CSV text -> DataFrame, exactly as an uploaded file is read. */
export function frameFromCsv(text) {
  let rows;
  readString(text, { complete: (results) => { rows = results.data; } });
  return rowsToFrame(rows);
}

export function readFixture(url) {
  return frameFromCsv(readFileSync(url, "utf8"));
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
export const SURVEY_FIELDS = ["date", "strti", "dowee", "sexo", "mood", "act3h", "act3m", "act3p", "endti"];

/**
 * One participant's REDCap export, in long format: an enrollment row, then a
 * row per daily-survey event. Each day's fields sit between that survey's
 * _timestamp and _complete columns, which is how REDCap lays them out and
 * what the completion check relies on.
 *
 * @param {Object} days - {dayNumber: {timestamp, date, strti, ...}}; days
 *   left out have no row at all.
 */
export function redcapExport({ id = "9001", startdt, days }) {
  const columns = ["participant_id", "redcap_event_name", "startdt"];
  const form = (n) => `day_${n}_${WEEKDAYS[(n - 1) % 7]}_daily_survey`;
  for (let n = 1; n <= 14; ++n) {
    columns.push(`${form(n)}_timestamp`, ...SURVEY_FIELDS.map((f) => `t${n}${f}`), `${form(n)}_complete`);
  }
  const rows = [{ participant_id: id, redcap_event_name: "enrollment_arm_1", startdt }];
  for (const [n, answers] of Object.entries(days)) {
    const row = { participant_id: id, redcap_event_name: `day_${n}_arm_1` };
    row[`${form(n)}_timestamp`] = answers.timestamp;
    for (const f of SURVEY_FIELDS) row[`t${n}${f}`] = answers[f];
    row[`${form(n)}_complete`] = answers.timestamp ? 2 : 0;
    rows.push(row);
  }
  return frameFromCsv(toCsv(columns, rows));
}
