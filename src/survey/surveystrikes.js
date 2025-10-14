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
                let rawTs = participant.data[timestampCol]?.values[0];
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
                    let rawTs = participant.data[timestampCol]?.values[0];
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

  // K: Lights off 2 hours after survey submission
  let sleepTimeCol = `t${i + 1}lgtsoffti`;
      let lightsOff = participant.data[sleepTimeCol]?.values[0];
      if (lightsOff) {
  // compute effective submit hour for this day using same logic as C
        let submitHour = null, submitMin = null;

        // helper: compute the night window for day i
        const getParticipantDayWindow = (dayIndex) => {
          const participantDayStr = participant.dates ? participant.dates[dayIndex] : null;
          if (!participantDayStr) return null;
          const parts = participantDayStr.split('-').map(Number);
          if (parts.length !== 3) return null;
          const [y, m, d] = parts;
          const startWindow = new Date(y, m - 1, d, 20, 0, 0);
          const endWindow = new Date(y, m - 1, d + 1, this.options.graceEndHour, 0, 0);
          return { startWindow, endWindow, participantDayStr };
        };

        const wnd = getParticipantDayWindow(i);
        if (wnd) {
          const startMs = Date.UTC(parseInt(wnd.participantDayStr.split('-')[0],10), parseInt(wnd.participantDayStr.split('-')[1],10)-1, parseInt(wnd.participantDayStr.split('-')[2],10), 20, 0, 0);
          const endMs = Date.UTC(parseInt(wnd.participantDayStr.split('-')[0],10), parseInt(wnd.participantDayStr.split('-')[1],10)-1, parseInt(wnd.participantDayStr.split('-')[2],10)+1, this.options.graceEndHour, 0, 0);
          if (hasSubmissionInWindow(startMs, endMs)) {
            submitHour = 20;
            submitMin = 0;
          } else {
            // look for parsed same-day submission
            const participantDayStr = wnd.participantDayStr;
            if (participantDayStr) {
              for (const s of submissions) {
                const pad = n => (n < 10 ? '0' + n : '' + n);
                const sDateStr = `${s.getUTCFullYear()}-${pad(s.getUTCMonth() + 1)}-${pad(s.getUTCDate())}`;
                if (sDateStr === participantDayStr) {
                  submitHour = s.getUTCHours();
                  submitMin = s.getUTCMinutes();
                  break;
                }
              }
            }
          }
        }
        

        // fallback to raw submitTimes string
        if (submitHour === null && participant.submitTimes[i] && participant.submitTimes[i] !== "--:--") {
          [submitHour, submitMin] = participant.submitTimes[i].split(":").map(Number);
        }

        if (submitHour !== null) {
          let [sleepHour, sleepMin] = lightsOff.split(":").map(Number);
          let submitTotal = submitHour * 60 + (submitMin || 0);
          let sleepTotal = sleepHour * 60 + sleepMin;
          if (sleepTotal - submitTotal > 120) {
            this.addStrike(i, "K: Lights off 2 hours after survey submission");
          }
        }
      }
    }
  }
}

export default Strikes;