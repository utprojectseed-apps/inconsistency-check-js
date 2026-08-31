// ---------------------------------------------------------------------------
// Strike K support
// ---------------------------------------------------------------------------

// Strike K never substitutes a bedtime from another night. If the survey that
// would have reported this night's bedtime was completed and the question was
// left blank, that is itself the finding and the strike says so.
//
// Worth knowing for whoever revisits this: nothing else in the tool reports a
// missing bedtime. t{n}act3h/act3m/act3p sit on the ignoreCols list in
// surveyparticipant.js, so a blank bedtime is excluded from Strike A's
// completion percentage and never reaches missingQuestions. This strike is the
// only place it is ever surfaced.

// Bedtime must be at least this far after the submission to earn a strike.
const K_THRESHOLD_MINUTES = 120;

// The point past which a stated bedtime stops being taken at face value.
// Not a tuned number: the two readings of a 12-hour answer sit exactly 12 hours
// apart, so 6 hours is precisely where the other one becomes the nearer of the
// two. Inside that window the participant's answer is honoured; outside it, the
// two readings are genuinely ambiguous and plausibility decides. Judging
// plausibility by the time itself rather than by nearness to the submission
// matters here because 45% of these surveys are finished after midnight, which
// is exactly where a submission-relative test is least able to tell them apart.
const AMBIGUITY_WINDOW_MINUTES = 6 * 60;


// A day's derived clock offset is annotated when it disagrees with the
// participant's other days by more than this many minutes.
const ODD_OFFSET_TOLERANCE_MINUTES = 60;

// t{n}dowee is coded 1 = Monday through 7 = Sunday.
const WEEKDAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

// A survey finished at or before this time may name the following day for
// Strike D without being wrong, since the participant is up past midnight.
const EARLY_HOURS_CUTOFF_MINUTES = 5 * 60;

// Strikes F and G tolerate up to this many off-baseline answers in a section
// before treating the block as inconsistent.
const SECTION_INCONSISTENCY_ALLOWANCE = 3;

const MS_PER_MINUTE = 60 * 1000;
const MS_PER_DAY = 24 * 60 * MS_PER_MINUTE;

// JavaScript's % keeps the sign of the dividend; this is a true modulo.
function mod(n, m) {
  return ((n % m) + m) % m;
}

// "HH:MM" (or "HH:MM:SS") -> minutes since midnight, or null.
function parseClock(value) {
  if (typeof value !== "string") return null;
  const match = value.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

// "YYYY-MM-DD HH:MM[:SS]" -> { y, mo, d, h, mi }, or null.
function parseRedcapTimestamp(value) {
  if (!value || value === "[not completed]") return null;
  const match = String(value)
    .trim()
    .match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{1,2}):(\d{2})/);
  if (!match) return null;
  return {
    y: Number(match[1]),
    mo: Number(match[2]),
    d: Number(match[3]),
    h: Number(match[4]),
    mi: Number(match[5]),
  };
}

// Both bedtimes and submissions are built in the UTC frame so that arithmetic is
// free of the browser's own timezone; the UTC getters read back the participant's
// wall clock exactly as it went in.
function formatClock(ms) {
  const date = new Date(ms);
  const pad = (n) => (n < 10 ? "0" + n : "" + n);
  return `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;
}

function formatGap(minutes) {
  const whole = Math.round(minutes);
  const hours = Math.floor(whole / 60);
  const mins = whole % 60;
  if (hours <= 0) return `${mins}m`;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}



class Strikes {
  /**
   * options: {
   *   mapEarlyToPrevDay: boolean, // if true, submissions between 00:00 and graceEndHour map to previous day
   *   graceEndHour: number // hour (0-23) exclusive end of grace window
   * }
   */
  constructor(options = {}) {
    this.strikes = {}; // Example structure: { day: [strike1, strike2, ...] }
    this.options = {
      mapEarlyToPrevDay: !!options.mapEarlyToPrevDay,
      graceEndHour: typeof options.graceEndHour === 'number' ? options.graceEndHour : 8,
    };
  }

  addStrike(day, strikeType) {
    if (!this.strikes[day]) {
      this.strikes[day] = [];
    }
    this.strikes[day].push(strikeType);
  }

  getStrikesForDay(day) {
    return this.strikes[day] || []; // Return strikes for the day or an empty array
  }

  evaluateStrikes(participant) {
    const days = participant.constructor.getDays();

    // collect all parsed submission datetimes for quick lookup
    const submissions = [];
    for (let k = 0; k < days; ++k) {
      const sd = participant.submitDateTimes ? participant.submitDateTimes[k] : null;
      if (sd instanceof Date && !isNaN(sd.getTime())) submissions.push(sd);
    }

    // helper: returns true if any submission falls in [startMs, endMs) (ms since epoch)
    const hasSubmissionInWindow = (startMs, endMs) => submissions.some(s => {
      const t = s.getTime();
      return t >= startMs && t < endMs;
    });

    // Strike K works in the participant's own clock. REDCap writes its survey
    // timestamps on the server clock, so for each day we derive the offset
    // between the two from that day's own "End time" answer, and use it to
    // translate that day's timestamp. Nothing is averaged across days, so a
    // participant who changes timezone mid-cycle still reads correctly.
    const submitOffsets = this._buildSubmitOffsets(participant);

    // Strike J compares every day against the first answer the participant gave,
    // so the baseline has to be found before the per-day loop starts.
    const sexBaseline = this._findSexBaseline(participant);

    for (let i = 0; i < days; ++i) {
  // Always evaluate A for incomplete days
      if (participant.percentComplete[i] < 0.75) {
  this.addStrike(i, "A: Large portion unanswered");
      }

      // Skip further checks if the cycle hasn't passed for the day
      if (!participant.cyclePassed(i)) continue;

  // B: Duration < 3 min
      let durationMin = participant.durationDeltas[i] / (1000 * 60);
      if (durationMin < 3) {
  this.addStrike(i, "B: Duration < 3 min");
      }

  // C: For survey day i check if any submission exists in the
  // 'night window' [surveyDay 20:00, nextDay graceEndHour). If so, it's
  // considered on-time for the survey day (no C). Otherwise, if
  // there's a same-day submission before 20:00, it's flagged as C.
      const participantDayStr = participant.dates ? participant.dates[i] : null;
      if (participantDayStr && participantDayStr !== 'Skipped' && participantDayStr !== 'Unanswered' && participantDayStr !== 'Not Started') {
        const parts = participantDayStr.split('-').map(Number);
        if (parts.length === 3) {
          const [y, m, d] = parts;
          // build UTC-based window (participant.dates uses UTC components)
          const startMs = Date.UTC(y, m - 1, d, 20, 0, 0);
          const endMs = Date.UTC(y, m - 1, d + 1, this.options.graceEndHour, 0, 0);

          if (hasSubmissionInWindow(startMs, endMs)) {
            // submission exists in the night window -> safe for this day
          } else {
            // no night-window submission; check for same-day submit time (raw or parsed)
            let flagged = false;
            // check parsed date for same-day submissions before 20:00
            submissions.forEach(s => {
              const pad = n => (n < 10 ? '0' + n : '' + n);
              // use UTC components to match participantDayStr which was generated with UTC
              const sDateStr = `${s.getUTCFullYear()}-${pad(s.getUTCMonth() + 1)}-${pad(s.getUTCDate())}`;
              if (sDateStr === participantDayStr && s.getUTCHours() < 20) flagged = true;
            });
            // fallback: check raw timestamp column when parsed submissions don't indicate a same-day submit
            if (!flagged) {
              try {
                let timestampCol = `day_${i + 1}_${participant.constructor.getWeekDay(i)}_daily_survey_timestamp`;
                let rawTs = participant.getValueForDay(timestampCol, i);
                if (rawTs && rawTs !== "" && rawTs !== "[not completed]") {
                  let [datePart, timePart] = rawTs.split(" ");
                  if (datePart === participantDayStr && timePart) {
                      let [hourStr] = timePart.split(":");
                      let hour = parseInt(hourStr);
                      if (!isNaN(hour) && hour < 20) flagged = true;
                    }
                }
              } catch (e) {
                // ignore
              }
            }
            if (flagged) {
              // If any submission for this survey day occurred between 20:00 and 08:00 local,
              // do NOT count C (per new rule: never flag between 8pm and 8am).
              const participantDayStr = participant.dates ? participant.dates[i] : null;
              let hasNightSubmission = false;
              if (participantDayStr) {
                // check parsed submissions
                for (const s of submissions) {
                  const pad = n => (n < 10 ? '0' + n : '' + n);
                  const sDateStr = `${s.getFullYear()}-${pad(s.getMonth() + 1)}-${pad(s.getDate())}`;
                  if (sDateStr === participantDayStr) {
                    const h = s.getHours();
                    if (h >= 20 || h < 8) { hasNightSubmission = true; break; }
                  }
                }
                // fallback: check raw timestamp
                if (!hasNightSubmission) {
                  try {
                    let timestampCol = `day_${i + 1}_${participant.constructor.getWeekDay(i)}_daily_survey_timestamp`;
                    let rawTs = participant.getValueForDay(timestampCol, i);
                    if (rawTs && rawTs !== "" && rawTs !== "[not completed]") {
                      let [datePart, timePart] = rawTs.split(" ");
                      if (datePart === participantDayStr && timePart) {
                        let [hourStr] = timePart.split(":");
                        let hour = parseInt(hourStr);
                        if (!isNaN(hour) && (hour >= 20 || hour < 8)) hasNightSubmission = true;
                      }
                    }
                  } catch (e) {}
                }
              }

              if (!hasNightSubmission) {
                this.addStrike(i, "C: Submitted before 8 PM");
              }
            }
          }
        }
      }

  // H: Duration > 45 min
        if (durationMin > 45) {
        this.addStrike(i, "H: Duration > 45 min");
      }

      // D: Day of the week question
      this._evaluateStrikeD(participant, i);

      // F / G: inconsistent answers across the parent sections
      this._evaluateStrikeFG(participant, i);

      // J: sex answered inconsistently across the cycle
      this._evaluateStrikeJ(participant, i, sexBaseline);

      // K: Lights off 2 hours after survey submission
      this._evaluateStrikeK(participant, i, submitOffsets);
    }
  }

  /**
   * Strike D: does the participant know what day it is?
   *
   * t{n}dowee is a 1-7 radio (1 = Monday). A blank answer is flagged, and so is
   * one that does not match the study day. A survey finished between midnight
   * and 05:00 may legitimately name the following day, so that is accepted too.
   */
  _evaluateStrikeD(participant, i) {
    // Only judge a day the participant actually took; an unfilled survey is
    // Strike A's business.
    if (!this._surveyHappened(participant, i)) return;

    const raw = participant.getValueForDay(`t${i + 1}dowee`, i);
    if (raw === "" || raw === null || raw === undefined) {
      this.addStrike(
        i,
        "D: Day of the week question" +
          "\n  this day's survey was completed but the day-of-week answer was" +
          " left blank"
      );
      return;
    }

    const answer = parseInt(raw, 10);
    if (!Number.isFinite(answer) || answer < 1 || answer > 7) return;

    const expected = (i % 7) + 1;
    // A survey finished in the small hours may name the next day instead.
    const start = parseClock(participant.getValueForDay(`t${i + 1}strti`, i));
    const end = parseClock(participant.getValueForDay(`t${i + 1}endti`, i));
    const finishedOvernight =
      (start !== null && start <= EARLY_HOURS_CUTOFF_MINUTES) ||
      (end !== null && end <= EARLY_HOURS_CUTOFF_MINUTES);
    const tolerated = ((i + 1) % 7) + 1;

    if (answer === expected) return;
    if (finishedOvernight && answer === tolerated) return;

    this.addStrike(
      i,
      "D: Day of the week question" +
        `\n  answered ${WEEKDAY_NAMES[answer - 1]}, but day ${i + 1} is a ${
          WEEKDAY_NAMES[expected - 1]
        }` +
        (finishedOvernight
          ? `\n  ⚠ finished after midnight, so ${WEEKDAY_NAMES[tolerated - 1]} would also have been accepted`
          : "")
    );
  }

  /**
   * The first sex answer the participant gave, which every later day is judged
   * against. Returns null when they never answered it at all.
   */
  _findSexBaseline(participant) {
    const days = participant.constructor.getDays();
    for (let i = 0; i < days; ++i) {
      const raw = participant.getValueForDay(`t${i + 1}sexo`, i);
      if (raw !== "" && raw !== null && raw !== undefined) {
        return { value: String(raw), dayNumber: i + 1 };
      }
    }
    return null;
  }

  /**
   * Strike J: the sex question is asked every day and should never change. A
   * day that disagrees with the first answer given, or that leaves it blank,
   * is flagged.
   *
   * Unlike the desktop tool, a participant who never answered it at all is
   * flagged only on the days they actually took, rather than on all fourteen.
   */
  _evaluateStrikeJ(participant, i, baseline) {
    if (!this._surveyHappened(participant, i)) return;

    if (baseline === null) {
      this.addStrike(
        i,
        "J: Sex question answered inconsistently" +
          "\n  no answer to the sex question was given on any day of the cycle"
      );
      return;
    }

    const raw = participant.getValueForDay(`t${i + 1}sexo`, i);
    if (raw === "" || raw === null || raw === undefined) {
      this.addStrike(
        i,
        "J: Sex question answered inconsistently" +
          "\n  this day's survey was completed but the sex question was left blank"
      );
      return;
    }

    if (String(raw) === baseline.value) return;

    this.addStrike(
      i,
      "J: Sex question answered inconsistently" +
        `\n  answered ${this._answerLabel(participant, `t${i + 1}sexo`, raw)}` +
        `, but day ${baseline.dayNumber} answered ${this._answerLabel(
          participant,
          `t${baseline.dayNumber}sexo`,
          baseline.value
        )}`
    );
  }

  /**
   * Strikes F and G: too many off-baseline answers inside the repeated parent
   * sections, which is what straight-lining or careless clicking looks like.
   *
   * The four sections are found by field prefix rather than by column position
   * (the desktop tool scans the export header for offsets, which breaks the
   * moment REDCap reorders anything). A section is only judged when the
   * participant said they did NOT translate for that parent, matching the
   * desktop's tranm/tranf == 2 gate.
   *
   * F is one side, G is both.
   */
  _evaluateStrikeFG(participant, i) {
    if (!this._surveyHappened(participant, i)) return;

    const n = i + 1;
    // tranm / tranf are 1 = Yes, 2 = No. The desktop gates on == 2, i.e. only
    // judges a section when the participant said they did NOT translate it.
    const motherApplies =
      String(participant.getValueForDay(`t${n}tranm`, i)) === "2";
    const fatherApplies =
      String(participant.getValueForDay(`t${n}tranf`, i)) === "2";

    const sections = [
      { label: "1A", prefix: `t${n}mstr`, baseline: "1", enabled: motherApplies, side: "mother" },
      { label: "1B", prefix: `t${n}fstr`, baseline: "1", enabled: fatherApplies, side: "father" },
      { label: "2A", prefix: `t${n}mag`, baseline: "0", enabled: motherApplies, side: "mother" },
      { label: "2B", prefix: `t${n}fag`, baseline: "0", enabled: fatherApplies, side: "father" },
    ];

    const flagged = [];
    let motherFlagged = false;
    let fatherFlagged = false;

    for (const section of sections) {
      if (!section.enabled) continue;
      const offBaseline = this._countOffBaseline(
        participant,
        i,
        section.prefix,
        section.baseline
      );
      if (offBaseline > SECTION_INCONSISTENCY_ALLOWANCE) {
        flagged.push({ label: section.label, side: section.side, count: offBaseline });
        if (section.side === "mother") motherFlagged = true;
        else fatherFlagged = true;
      }
    }

    if (!flagged.length) return;

    const bothSides = motherFlagged && fatherFlagged;
    const letter = bothSides ? "G" : "F";
    const sides = bothSides
      ? "their mother or their father"
      : motherFlagged
      ? "their mother"
      : "their father";

    this.addStrike(
      i,
      `${letter}: Inconsistent answers for sections ${flagged
        .map((f) => f.label)
        .join(", ")}` +
        `\n  said they did not translate for ${sides} today, but still answered` +
        ` ${flagged
          .map((f) => `${f.count} questions about it in section ${f.label}`)
          .join(" and ")}` +
        (bothSides
          ? "\n  ⚠ both the mother and the father sections contradict the answer"
          : "")
    );
  }

  /**
   * How many answers in a section are valid but differ from the section's
   * baseline value. Fields are enumerated from the export's own column list, so
   * a section that is absent simply contributes nothing.
   */
  _countOffBaseline(participant, dayIndex, prefix, baseline) {
    const columns =
      participant.data && Array.isArray(participant.data.columns)
        ? participant.data.columns
        : [];
    const pattern = new RegExp(`^${prefix}\\d+$`);
    let count = 0;
    for (const column of columns) {
      if (!pattern.test(column)) continue;
      const value = participant.getValueForDay(column, dayIndex);
      if (value === "" || value === null || value === undefined) continue;
      if (!this._isValidAnswer(participant, column, value)) continue;
      if (String(value) !== baseline) count++;
    }
    return count;
  }

  // Whether a value is one of the coded answers the data dictionary allows.
  _isValidAnswer(participant, field, value) {
    try {
      const answers = participant.dataDict.getAnswers(field);
      return !!answers && answers[String(value)] !== undefined;
    } catch (e) {
      return false;
    }
  }

  // The human-readable label for a coded answer, falling back to the code.
  _answerLabel(participant, field, value) {
    try {
      const answers = participant.dataDict.getAnswers(field);
      const label = answers && answers[String(value)];
      if (label) return `${String(label).trim()} (${value})`;
    } catch (e) {
      /* fall through */
    }
    return String(value);
  }

  // Raw REDCap survey timestamp string for a day, or null.
  _rawTimestamp(participant, dayIndex) {
    try {
      const column = `day_${dayIndex + 1}_${participant.constructor.getWeekDay(
        dayIndex
      )}_daily_survey_timestamp`;
      return participant.getValueForDay(column, dayIndex);
    } catch (e) {
      return null;
    }
  }

  /**
   * Per-day offset between the server clock and the participant's clock, in
   * minutes (server minus participant). Derived from each day's own "End time"
   * answer, so no timezone is ever assumed.
   */
  _buildSubmitOffsets(participant) {
    const days = participant.constructor.getDays();
    const offsets = Array(days).fill(null);
    for (let i = 0; i < days; ++i) {
      const endMinutes = parseClock(
        participant.getValueForDay(`t${i + 1}endti`, i)
      );
      const stamp = parseRedcapTimestamp(this._rawTimestamp(participant, i));
      if (endMinutes === null || stamp === null) continue;

      const serverMinutes = stamp.h * 60 + stamp.mi;
      // Wrap into (-720, +720] so an overnight submission does not read as ~23h.
      const raw = mod(serverMinutes - endMinutes + 720, 1440) - 720;
      offsets[i] = {
        // Exact difference, used to translate this day's own submission so the
        // result lands precisely on the finish time the participant entered.
        raw,
        // Every real-world clock difference is a multiple of 15 minutes.
        // Snapping clears the +/-1 minute jitter of HH:MM against HH:MM:SS, and
        // is what other days borrow and what the "unusual" check compares.
        snapped: Math.round(raw / 15) * 15,
      };
    }
    return offsets;
  }

  /**
   * The moment the participant finished day i's survey, expressed on their own
   * clock in the UTC frame. Returns null when it cannot be established.
   */
  _localSubmission(participant, dayIndex, offsets) {
    const stamp = parseRedcapTimestamp(this._rawTimestamp(participant, dayIndex));
    if (stamp) {
      // This day recorded its own finish time: use the exact difference, so the
      // result is precisely the time the participant entered.
      let offset = offsets[dayIndex] ? offsets[dayIndex].raw : null;
      let compareOffset = offsets[dayIndex] ? offsets[dayIndex].snapped : null;
      let borrowedFrom = null;
      if (offset === null) {
        // No finish time that day: borrow from the nearest day that has one,
        // preferring the earlier day when two are equally close.
        let bestDistance = Infinity;
        for (let j = 0; j < offsets.length; ++j) {
          if (!offsets[j]) continue;
          const distance = Math.abs(j - dayIndex);
          if (distance < bestDistance) {
            bestDistance = distance;
            offset = offsets[j].snapped;
            compareOffset = offsets[j].snapped;
            borrowedFrom = j;
          }
        }
      }
      if (offset === null) return null;
      const serverMs = Date.UTC(
        stamp.y,
        stamp.mo - 1,
        stamp.d,
        stamp.h,
        stamp.mi
      );
      return {
        ms: serverMs - offset * MS_PER_MINUTE,
        offset: compareOffset,
        borrowedFrom,
      };
    }

    // No machine timestamp: fall back to the participant's own date + end time.
    const endMinutes = parseClock(
      participant.getValueForDay(`t${dayIndex + 1}endti`, dayIndex)
    );
    const dateStr = participant.dates ? participant.dates[dayIndex] : null;
    if (
      endMinutes !== null &&
      typeof dateStr === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(dateStr)
    ) {
      const [y, mo, d] = dateStr.split("-").map(Number);
      return {
        ms: Date.UTC(y, mo - 1, d) + endMinutes * MS_PER_MINUTE,
        offset: null,
        borrowedFrom: null,
      };
    }
    return null;
  }


  /**
   * True when a day's clock offset disagrees with the days on *both* sides of
   * it, which is the signature of a mistyped finish time.
   *
   * Deliberately not a comparison against the participant's median. The REDCap
   * server clock itself changed partway through December 2025 — from UTC to
   * local time — so a cycle straddling that switch has one block of days at +6h
   * and another at 0. Against a median, the later (correct) days look like
   * outliers and every one of them gets blamed on the participant. Comparing
   * with immediate neighbours instead lets a sustained shift pass quietly while
   * still catching a single day that stands alone.
   */
  _offsetLooksIsolated(offsets, dayIndex) {
    const own = offsets[dayIndex] ? offsets[dayIndex].snapped : null;
    if (own === null) return false;

    let before = null;
    for (let j = dayIndex - 1; j >= 0; --j) {
      if (offsets[j]) { before = offsets[j].snapped; break; }
    }
    let after = null;
    for (let j = dayIndex + 1; j < offsets.length; ++j) {
      if (offsets[j]) { after = offsets[j].snapped; break; }
    }
    // With a neighbour missing there is no way to tell an isolated typo from the
    // start of a sustained shift, so stay quiet.
    if (before === null || after === null) return false;

    return (
      Math.abs(own - before) > ODD_OFFSET_TOLERANCE_MINUTES &&
      Math.abs(own - after) > ODD_OFFSET_TOLERANCE_MINUTES
    );
  }

  /**
   * Whether a day's survey was genuinely taken, rather than merely opened.
   *
   * participant.days[] is only percentComplete > 0, so a participant who
   * answered two questions and stopped counts as "collected" there. Treating
   * that as a completed survey turns every abandoned day into a missing-bedtime
   * strike. A submission timestamp, or the same 75% bar Strike A uses, is the
   * honest test of whether the bedtime question was ever reached.
   */
  _surveyHappened(participant, dayIndex) {
    const stamp = parseRedcapTimestamp(this._rawTimestamp(participant, dayIndex));
    if (stamp) return true;
    const pct = Array.isArray(participant.percentComplete)
      ? participant.percentComplete[dayIndex]
      : 0;
    return typeof pct === "number" && pct >= 0.75;
  }

  /**
   * The lights-off answer from a given survey day, or null if unanswered.
   * act3h is the hour (1-12), act3m a dropdown index (1 -> :00 ... 6 -> :50),
   * act3p is coded 1 = PM, 2 = AM.
   */
  _readBedtime(participant, dayNumber) {
    const index = dayNumber - 1;
    const hour = parseInt(
      participant.getValueForDay(`t${dayNumber}act3h`, index),
      10
    );
    if (!Number.isFinite(hour) || hour < 1 || hour > 12) return null;

    const minuteCode = parseInt(
      participant.getValueForDay(`t${dayNumber}act3m`, index),
      10
    );
    const minuteAnswered =
      Number.isFinite(minuteCode) && minuteCode >= 1 && minuteCode <= 6;
    const minutes = minuteAnswered ? (minuteCode - 1) * 10 : 0;

    const meridiemCode = parseInt(
      participant.getValueForDay(`t${dayNumber}act3p`, index),
      10
    );
    const statedPm =
      meridiemCode === 1 ? true : meridiemCode === 2 ? false : null;

    return { dayNumber, hour, minutes, minuteAnswered, statedPm };
  }

  /**
   * Strike K: did the participant turn the lights off two or more hours after
   * submitting that night's survey?
   *
   * The bedtime for the night of day i is reported the next morning, in day
   * i+1's survey ("Last night, at what time did you turn off the lights?").
   */
  _evaluateStrikeK(participant, i, offsets) {
    const days = participant.constructor.getDays();

    // The bedtime for this night is reported the next morning. Day 14 has no
    // following survey by design, so it can never be evaluated.
    if (i === days - 1) return;
    const nextIndex = i + 1;

    // Both days have to have actually happened. Not collected yet, or barely
    // opened, means the bedtime answer does not exist through no fault of the
    // participant on this day; a survey they never did is Strike A's business,
    // not this one.
    if (!this._surveyHappened(participant, nextIndex)) return;
    if (!this._surveyHappened(participant, i)) return;

    const submission = this._localSubmission(participant, i, offsets);
    if (!submission) return;

    const source = this._readBedtime(participant, nextIndex + 1);
    if (!source) {
      // The survey that should carry this night's bedtime was completed and the
      // question was left blank. There is nothing to compare, and nothing else
      // in the report would ever mention it.
      this.addStrike(
        i,
        "K: Lights off 2 hours after survey submission" +
          `\n  not checked — day ${nextIndex + 1}'s survey was completed but the` +
          " lights-off time was left blank, so this night's bedtime is unknown"
      );
      return;
    }

    // The bedtime is a bare clock reading, so it has to be placed on a calendar
    // day. Do not anchor it to a stated date: a participant finishing at 00:40
    // writes the post-midnight date into "Today's date", which would put the
    // anchor a day late and turn a 1 AM bedtime into a phantom ~12h gap.
    //
    // Instead, place each reading on whichever day puts it nearest the
    // submission. Bedtime and submission are always within hours of each other,
    // so the nearest occurrence is the right one, and it needs no date at all.
    const nearestOccurrence = (clockMinutes) => {
      const midnight =
        Math.floor(submission.ms / MS_PER_DAY) * MS_PER_DAY;
      let best = null;
      for (const shift of [-MS_PER_DAY, 0, MS_PER_DAY]) {
        const candidate = midnight + shift + clockMinutes * MS_PER_MINUTE;
        if (
          best === null ||
          Math.abs(candidate - submission.ms) < Math.abs(best - submission.ms)
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
      // Nothing was stated, so there is nothing to honour.
      chosenIsPm = fromMidnight(pmClock) <= fromMidnight(amClock);
    } else {
      const statedMs = source.statedPm ? asPm : asAm;
      const statedGap = Math.abs(statedMs - submission.ms);
      if (statedGap <= AMBIGUITY_WINDOW_MINUTES * MS_PER_MINUTE) {
        // Their answer gives a sane result: take them at their word.
        chosenIsPm = source.statedPm;
      } else {
        // Beyond this point the other reading would sit closer to the
        // submission, so the two are genuinely ambiguous. Break the tie on
        // which is a more plausible time to go to bed rather than on which is
        // nearer the submission, keeping their answer when it is a draw.
        const statedClock = source.statedPm ? pmClock : amClock;
        const otherClock = source.statedPm ? amClock : pmClock;
        chosenIsPm =
          fromMidnight(statedClock) <= fromMidnight(otherClock)
            ? source.statedPm
            : !source.statedPm;
      }
    }
    const bedtimeMs = chosenIsPm ? asPm : asAm;

    const gapMinutes = (bedtimeMs - submission.ms) / MS_PER_MINUTE;
    if (!(gapMinutes >= K_THRESHOLD_MINUTES)) return;

    const notes = [];
    if (source.statedPm !== null && source.statedPm !== chosenIsPm) {
      const stated = `${source.hour}${source.minutes ? ":" + String(source.minutes).padStart(2, "0") : ""} ${
        source.statedPm ? "PM" : "AM"
      }`;
      notes.push(
        `bedtime was answered as ${stated} but read as ${
          chosenIsPm ? "PM" : "AM"
        }, because ${stated} is not a plausible time to go to bed — treated as a mis-tapped AM/PM`
      );
    }
    if (source.statedPm === null) {
      notes.push(
        `bedtime AM/PM unanswered, read as ${chosenIsPm ? "PM" : "AM"}`
      );
    }
    if (!source.minuteAnswered) {
      notes.push("bedtime minutes unanswered, treated as :00");
    }
    if (submission.borrowedFrom !== null && submission.borrowedFrom !== undefined) {
      notes.push(
        "participant did not record what time they finished the survey today, " +
          `so the submission time was worked out using day ${
            submission.borrowedFrom + 1
          }'s recorded finish time as a reference`
      );
    }
    if (this._offsetLooksIsolated(offsets, i)) {
      notes.push(
        "the finish time the participant entered today does not match the days " +
          "either side of it, so it may be a typo — worth checking before acting " +
          "on this strike"
      );
    }

    // Verdict first, then the numbers, then each caveat on its own line. The
    // day card renders strikes with white-space: pre-wrap, so the newlines and
    // the two-space indent survive.
    let message = "K: Lights off 2 hours after survey submission";
    message += `\n  submitted ${formatClock(submission.ms)} → lights off ${formatClock(
      bedtimeMs
    )}  (gap ${formatGap(gapMinutes)})`;
    for (const note of notes) message += `\n  ⚠ ${note}`;

    this.addStrike(i, message);
  }
}

export default Strikes;