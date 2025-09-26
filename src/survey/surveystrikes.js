class Strikes {
  constructor() {
    this.strikes = {}; // Example structure: { day: [strike1, strike2, ...] }
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
    for (let i = 0; i < participant.constructor.getDays(); ++i) {
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

      // Strike C: Submitted before 8 PM
      let [hourStr, minuteStr] = participant.submitTimes[i].split(":");
      let hour = parseInt(hourStr);
      if (!isNaN(hour) && hour < 20) {
        this.addStrike(i, "Strike C: Submitted before 8 PM");
      }

      // Strike H: Duration > 45 min
      if (durationMin > 45) {
        this.addStrike(i, "Strike H: Duration > 45 min");
      }

      // Strike K: Lights off 2 hours after survey submission
      let sleepTimeCol = `t${i + 1}lgtsoffti`;
      let lightsOff = participant.data[sleepTimeCol]?.values[0];
      if (lightsOff && participant.submitTimes[i] !== "--:--") {
        let [submitHour, submitMin] = participant.submitTimes[i].split(":").map(Number);
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

export default Strikes;
