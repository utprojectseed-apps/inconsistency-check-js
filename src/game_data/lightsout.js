// Strike L: the lights-off time reported in the survey is 2 or more hours after
// the participant finished playing that day's game.
//
// This is the games-side twin of survey Strike K, and deliberately mirrors the
// web implementation of K rather than the desktop one:
//
//   - the bedtime for night N is read from day N+1's survey, because the
//     question asks about *last night*
//   - nothing is ever substituted. No sister day, no baseline "general bedtime"
//     from a separate REDCap project. A blank answer on a survey that was taken
//     is itself the finding
//   - a day whose following survey has not been collected is silent, because
//     the answer does not exist through no fault of the participant
//   - the last day of the cycle is never evaluated, since its bedtime would come
//     from a day 15 that does not exist
//
// One thing K needed and this does not: a timezone conversion. K compares a
// bedtime against a REDCap *server* timestamp, so it has to derive the
// participant's offset per day. The game's trial_timestamp is written by
// new Date() on the participant's own device, so both sides of this comparison
// are already the participant's wall clock.

import GameStrikes from "./gamestrikes";

const TOTAL_DAYS = 14;
const THRESHOLD_MINUTES = 120;

// Beyond this gap the other AM/PM reading is nearer, so the answer is genuinely
// ambiguous. Two readings are 12 hours apart, so 6 is exactly the midpoint.
const AMBIGUITY_WINDOW_MINUTES = 6 * 60;

const MS_PER_MINUTE = 60 * 1000;

const WEEKDAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

// The REDCap columns this needs, and nothing else. The export is several
// hundred columns wide, so pulling only these keeps the pass cheap.
function neededColumns() {
  const columns = ["participant_id"];
  for (let n = 1; n <= TOTAL_DAYS; ++n) {
    columns.push(`t${n}act3h`, `t${n}act3m`, `t${n}act3p`);
    columns.push(`day_${n}_${WEEKDAYS[(n - 1) % 7]}_daily_survey_timestamp`);
  }
  return columns;
}

function isBlank(value) {
  return (
    value === undefined ||
    value === null ||
    value === "" ||
    value === "[not completed]"
  );
}

/**
 * Reads one day's lights-off answer.
 *
 * t{n}act3m is a dropdown index, not a number of minutes: 1 -> :00, 2 -> :10,
 * up to 6 -> :50. t{n}act3p is 1 = PM, 2 = AM, which is the reverse of what
 * most people assume.
 *
 * @returns {Object|null} null when the hour is missing, which is the only part
 *   that cannot be worked around.
 */
function readBedtime(row, dayNumber) {
  const rawHour = row[`t${dayNumber}act3h`];
  if (isBlank(rawHour)) return null;

  const hour = parseInt(rawHour, 10);
  if (!Number.isFinite(hour) || hour < 1 || hour > 12) return null;

  const rawMinute = row[`t${dayNumber}act3m`];
  const minuteAnswered = !isBlank(rawMinute);
  let minutes = 0;
  if (minuteAnswered) {
    const index = parseInt(rawMinute, 10);
    minutes = Number.isFinite(index) ? (index - 1) * 10 : 0;
    if (minutes < 0 || minutes > 59) minutes = 0;
  }

  const rawPm = row[`t${dayNumber}act3p`];
  let statedPm = null;
  if (!isBlank(rawPm)) {
    statedPm = String(rawPm) === "1"; // 1 = PM, 2 = AM
  }

  return { hour, minutes, statedPm, minuteAnswered };
}

function formatClock(ms) {
  const date = new Date(ms);
  const pad = (n) => (n < 10 ? "0" + n : "" + n);
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatGap(minutes) {
  const whole = Math.round(minutes);
  const hours = Math.floor(whole / 60);
  const mins = whole % 60;
  if (hours && mins) return `${hours}h ${mins}m`;
  if (hours) return `${hours}h`;
  return `${mins}m`;
}

export default class LightsOut {
  /**
   * @param {Object} dataFrame - the REDCap export, as danfo hands it over.
   *   Anything exposing `.columns` and `[col].values` works.
   */
  constructor(dataFrame) {
    this.byParticipant = new Map();
    if (!dataFrame || !Array.isArray(dataFrame.columns)) return;

    const available = new Set(dataFrame.columns);
    const columns = neededColumns().filter((c) => available.has(c));
    if (!columns.includes("participant_id")) return;

    const series = {};
    for (const column of columns) {
      const holder = dataFrame[column];
      series[column] = holder && Array.isArray(holder.values)
        ? holder.values
        : [];
    }

    const ids = series["participant_id"];
    // REDCap long format: one row per participant-event, so a participant's
    // answers are spread across several rows. Collapse to the first non-blank
    // value seen for each field.
    for (let r = 0; r < ids.length; ++r) {
      const id = ids[r];
      if (isBlank(id)) continue;
      const key = String(id).trim();
      let row = this.byParticipant.get(key);
      if (!row) {
        row = {};
        this.byParticipant.set(key, row);
      }
      for (const column of columns) {
        if (column === "participant_id") continue;
        const value = series[column][r];
        if (!isBlank(value) && isBlank(row[column])) row[column] = value;
      }
    }
  }

  /** Whether any participant data was read at all. */
  hasData() {
    return this.byParticipant.size > 0;
  }

  /** Whether this participant appears in the uploaded export. */
  hasParticipant(participantId) {
    return this.byParticipant.has(String(participantId).trim());
  }

  /**
   * Was the survey for this day actually taken?
   *
   * Survey K also accepts a survey that is 75% complete without a timestamp.
   * That completion figure is computed by the survey report's own participant
   * class, which the games report does not build, so this goes on the
   * submission timestamp alone. The effect is conservative: a survey with no
   * timestamp is treated as not collected, and stays silent rather than
   * striking.
   */
  _surveyHappened(row, dayNumber) {
    const stamp =
      row[`day_${dayNumber}_${WEEKDAYS[(dayNumber - 1) % 7]}_daily_survey_timestamp`];
    return !isBlank(stamp);
  }

  /**
   * Evaluate Strike L for one participant on one day.
   *
   * @param {string|number} participantId
   * @param {number} dayNumber - 1-indexed study day
   * @param {Date} anchor - when the participant finished playing that day
   * @returns {Object|null} `{ message, notes }` when the day should be struck,
   *   or null when it should stay silent.
   */
  evaluate(participantId, dayNumber, anchor) {
    if (!(anchor instanceof Date) || isNaN(anchor.getTime())) return null;

    const row = this.byParticipant.get(String(participantId).trim());
    if (!row) return null;

    // The bedtime for tonight is reported tomorrow morning, so the last day of
    // the cycle can never be evaluated.
    if (dayNumber >= TOTAL_DAYS) return null;
    const reportingDay = dayNumber + 1;

    // Not collected yet is not the participant's fault on this day.
    if (!this._surveyHappened(row, reportingDay)) return null;

    const source = readBedtime(row, reportingDay);
    if (!source) {
      return this._strike(
        dayNumber,
        `not checked — day ${reportingDay}'s survey was completed but the` +
          " lights-off time was left blank, so this night's bedtime is unknown",
        []
      );
    }

    const anchorMs = anchor.getTime();

    // A bedtime is a bare clock reading with no date, so it has to be placed on
    // a calendar day. Do not anchor it to any date the participant typed: put
    // it at whichever occurrence sits nearest the game, which needs no date at
    // all and cannot produce a phantom 12-hour gap when play runs past
    // midnight. Midnights are built through the Date constructor rather than by
    // adding 24h, so a daylight-saving boundary does not shift them.
    const midnightOffsetBy = (days) =>
      new Date(
        anchor.getFullYear(),
        anchor.getMonth(),
        anchor.getDate() + days,
        0,
        0,
        0,
        0
      ).getTime();

    const nearestOccurrence = (clockMinutes) => {
      let best = null;
      for (const shift of [-1, 0, 1]) {
        const candidate = midnightOffsetBy(shift) + clockMinutes * MS_PER_MINUTE;
        if (
          best === null ||
          Math.abs(candidate - anchorMs) < Math.abs(best - anchorMs)
        ) {
          best = candidate;
        }
      }
      return best;
    };

    // The same answer read two ways, always exactly 12 hours apart.
    const hour12 = source.hour % 12; // 12 -> 0, so 12 AM is midnight, 12 PM noon
    const pmClock = (hour12 + 12) * 60 + source.minutes;
    const amClock = hour12 * 60 + source.minutes;
    const asPm = nearestOccurrence(pmClock);
    const asAm = nearestOccurrence(amClock);

    // How plausible a reading is as a bedtime, judged by nearness to midnight.
    // A "10 in the morning" bedtime is almost always a mis-tapped 10 at night.
    const fromMidnight = (clock) => Math.min(clock, 1440 - clock);

    let chosenIsPm;
    if (source.statedPm === null) {
      chosenIsPm = fromMidnight(pmClock) <= fromMidnight(amClock);
    } else {
      const statedMs = source.statedPm ? asPm : asAm;
      const statedGap = Math.abs(statedMs - anchorMs);
      if (statedGap <= AMBIGUITY_WINDOW_MINUTES * MS_PER_MINUTE) {
        chosenIsPm = source.statedPm;
      } else {
        const statedClock = source.statedPm ? pmClock : amClock;
        const otherClock = source.statedPm ? amClock : pmClock;
        chosenIsPm =
          fromMidnight(statedClock) <= fromMidnight(otherClock)
            ? source.statedPm
            : !source.statedPm;
      }
    }
    const bedtimeMs = chosenIsPm ? asPm : asAm;

    const gapMinutes = (bedtimeMs - anchorMs) / MS_PER_MINUTE;
    if (!(gapMinutes >= THRESHOLD_MINUTES)) return null;

    const notes = [];
    if (source.statedPm !== null && source.statedPm !== chosenIsPm) {
      const stated = `${source.hour}${
        source.minutes ? ":" + String(source.minutes).padStart(2, "0") : ""
      } ${source.statedPm ? "PM" : "AM"}`;
      notes.push(
        `bedtime was answered as ${stated} but read as ${
          chosenIsPm ? "PM" : "AM"
        }, because ${stated} is not a plausible time to go to bed`
      );
    }
    if (source.statedPm === null) {
      notes.push(`bedtime AM/PM unanswered, read as ${chosenIsPm ? "PM" : "AM"}`);
    }
    if (!source.minuteAnswered) {
      notes.push("bedtime minutes unanswered, treated as :00");
    }

    return this._strike(
      dayNumber,
      `finished playing ${formatClock(anchorMs)} → lights off ` +
        `${formatClock(bedtimeMs)} (gap ${formatGap(gapMinutes)}), ` +
        `reported on day ${reportingDay}`,
      notes
    );
  }

  /**
   * A strike object shaped the way StrikesSummary expects, so lights-out
   * findings drop in beside the per-game strikes without special casing.
   *
   * Severity is always NONE. Strike L reports a contradiction for staff to
   * review, not an action: the day's contact banner reduces on severity, so a
   * lights-out finding never turns a day into a text message or a phone call.
   */
  _strike(day, message, notes) {
    return {
      day: day,
      task: "Lights out",
      taskName: "",
      scenario: "LIGHTS_OUT",
      message: message,
      notes: notes,
      severity: GameStrikes.Severity.NONE,
      isBDS: false,
    };
  }

  static get TotalDays() {
    return TOTAL_DAYS;
  }

  static get ThresholdMinutes() {
    return THRESHOLD_MINUTES;
  }
}
