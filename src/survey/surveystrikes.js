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
    console.log(day, this.strikes[day])
    return this.strikes[day] || []; // Return strikes for the day or an empty array
  }

  evaluateStrikes(participant) {
    const days = participant.constructor.getDays();

    // Pre-pass: determine effective submission for each survey day.
    // effectiveSubmissions[d] = { submitted: bool, submitDate: Date, localHour: number }
    const effectiveSubmissions = Array(days).fill(null).map(() => ({ submitted: false, submitDate: null, localHour: null }));

    // First pass: mark same-day submissions
    for (let k = 0; k < days; ++k) {
      const sd = participant.submitDateTimes ? participant.submitDateTimes[k] : null;
      if (sd instanceof Date && !isNaN(sd.getTime())) {
        const pad = (n) => (n < 10 ? '0' + n : n);
        const sdDateStr = `${sd.getFullYear()}-${pad(sd.getMonth() + 1)}-${pad(sd.getDate())}`;
        const participantDayStr = participant.dates ? participant.dates[k] : null;
        if (participantDayStr && participantDayStr === sdDateStr) {
          effectiveSubmissions[k] = { submitted: true, submitDate: sd, localHour: sd.getHours() };
        }
      }
    }

    // Second pass: for each survey day, if any submission falls in the window
    // [survey day 20:00, next day graceEndHour) mark that survey day as submitted/safe
    for (let i = 0; i < days; ++i) {
      const participantDayStr = participant.dates ? participant.dates[i] : null;
      if (!participantDayStr || participantDayStr === 'Skipped' || participantDayStr === 'Unanswered' || participantDayStr === 'Not Started') continue;
      const parts = participantDayStr.split('-').map(Number);
      if (parts.length !== 3) continue;
      const [y, m, d] = parts;
      const startWindow = new Date(y, m - 1, d, 20, 0, 0);
      const endWindow = new Date(y, m - 1, d + 1, this.options.graceEndHour, 0, 0);
      for (let j = 0; j < days; ++j) {
        const sd = participant.submitDateTimes ? participant.submitDateTimes[j] : null;
        if (!(sd instanceof Date) || isNaN(sd.getTime())) continue;
        if (sd >= startWindow && sd < endWindow) {
          // mark survey day i as submitted and safe (localHour 20)
          effectiveSubmissions[i] = { submitted: true, submitDate: sd, localHour: 20 };
          // ensure the submission's own day is also recorded
          // always mark the submission's own day as submitted and treat it as late/safe
          effectiveSubmissions[j] = { submitted: true, submitDate: sd, localHour: 20 };
          break;
        }
      }
    }

    for (let i = 0; i < days; ++i) {
      // Always evaluate Strike A for incomplete days
      if (participant.percentComplete[i] < 0.75) {
        this.addStrike(i, "Strike A: Large portion unanswered");
      }

      // Skip further checks if the cycle hasn't passed for the day
      if (!participant.cyclePassed(i)) continue;

      // Strike B: Duration < 3 min
      let durationMin = participant.durationDeltas[i] / (1000 * 60);
      if (durationMin < 3) {
        this.addStrike(i, "Strike B: Duration < 3 min");
      }

      // Strike C: Use effectiveSubmissions computed earlier. If a submission
      // was mapped to this survey day or recorded on this day, check the
      // effective local hour. Only flag if local hour < 20. If no effective
      // submission exists for the day, fall back to a conservative parse
      // of the raw timestamp but do not map across midnight here.
      const eff = effectiveSubmissions[i];
      if (eff && eff.submitted) {
        if (typeof eff.localHour === 'number' && eff.localHour < 20) {
          console.log(`[Strikes] Adding Strike C for day ${i}. eff=${JSON.stringify(eff)}, participant.dates[i]=${participant.dates ? participant.dates[i] : 'N/A'}, submitDateTimes[i]=${participant.submitDateTimes ? participant.submitDateTimes[i] : 'N/A'}`);
          this.addStrike(i, "Strike C: Submitted before 8 PM");
        }
      } else {
        // fallback: parse raw timestamp if available and matches participant.dates
        try {
          let timestampCol = `day_${i + 1}_${participant.constructor.getWeekDay(i)}_daily_survey_timestamp`;
          let rawTs = participant.data[timestampCol]?.values[0];
          if (rawTs && rawTs !== "" && rawTs !== "[not completed]") {
            let [datePart, timePart] = rawTs.split(" ");
            if (datePart && timePart) {
              const participantDayStr = participant.dates ? participant.dates[i] : null;
              if (participantDayStr && participantDayStr === datePart) {
                let [hourStr, minuteStr] = timePart.split(":");
                let hour = parseInt(hourStr);
                if (!isNaN(hour) && hour < 20) {
                  console.log(`[Strikes] Fallback: adding Strike C for day ${i}. rawTs=${rawTs}, participant.dates[i]=${participant.dates ? participant.dates[i] : 'N/A'}`);
                  this.addStrike(i, "Strike C: Submitted before 8 PM");
                }
              }
            }
          }
        } catch (e) {
          // swallow parsing errors and do not flag
        }
      }

      // Strike H: Duration > 45 min
      if (durationMin > 45) {
        this.addStrike(i, "Strike H: Duration > 45 min");
      }

      // Strike K: Lights off 2 hours after survey submission
      let sleepTimeCol = `t${i + 1}lgtsoffti`;
      let lightsOff = participant.data[sleepTimeCol]?.values[0];
      if (lightsOff) {
        // Prefer effective submission hour if available
        const effSub = effectiveSubmissions[i];
        let submitHour = null, submitMin = null;
        if (effSub && effSub.submitted && typeof effSub.localHour === 'number') {
          submitHour = effSub.localHour;
          submitMin = 0;
        } else if (participant.submitTimes[i] && participant.submitTimes[i] !== "--:--") {
          [submitHour, submitMin] = participant.submitTimes[i].split(":").map(Number);
        }
        if (submitHour !== null) {
        let [sleepHour, sleepMin] = lightsOff.split(":").map(Number);
        let submitTotal = submitHour * 60 + submitMin;
        let sleepTotal = sleepHour * 60 + sleepMin;
        if (sleepTotal - submitTotal > 120) {
          this.addStrike(i, "Strike K: Lights off 2 hours after survey submission");
        }
        }
      }
    }
  }
}

export default Strikes;