export default class GameStrikes {
  // strike threshold constants
  static COMPLETION_THRESHOLDS = {
    CONTACT_1: 0.8, // text level
    CONTACT_2: 0.5, // phone call level
  };

  static ACCURACY_THRESHOLDS = {
    CONTACT_1: 0.8, // text level
    CONTACT_2: 0.5, // phone call level

    // special thresholds
    BDS: {
      CONTACT_1: 0.25,
      CONTACT_2: 0.15,
    },
  };

  constructor() {
    // 3 categories: [MISSING, COMPLETION, ACCURACY]
    this.strikeArray = Array.from({ length: 3 }, () => []);
    this.strikeDetails = Array.from({ length: 3 }, () => []);
    // Track total missing/incomplete occurrences for escalation (Days 2-10)
    this.totalMissingTrackingDays = 0;
    this.firstStrikeGiven = false;
  }

  /**
   * Reset all tracked strike state to initial values.
   * Useful to ensure strike generation is idempotent when called multiple times.
   */
  reset() {
    this.strikeArray = Array.from({ length: 3 }, () => []);
    this.strikeDetails = Array.from({ length: 3 }, () => []);
    this.totalMissingTrackingDays = 0;
    this.firstStrikeGiven = false;
  }

  static StrikeType = {
    MISSING: 0, // Missing game session
    COMPLETION: 1, // Incomplete game session
    ACCURACY: 2, // Inaccurate game session
  };

  static Severity = {
    CONTACT_1: 1, // Text message needed
    CONTACT_2: 2, // Phone call needed
  };

  static EscalationRules = {
    // Days 11-13: ANY missing/incomplete = phone call
    CRITICAL_DAYS: [11, 12, 13],
    // Days 2-10: odd occurrences = phone call, even = text
    TRACKING_DAYS: [2, 3, 4, 5, 6, 7, 8, 9, 10],
  };

  // helpers to normalize and format values coming from existing game code. (sometimes %, fractions, strings, numbers)
  static _toFraction(value) {
    if (value === undefined || value === null) return NaN;
    // if already a number
    if (typeof value === "number") {
      if (Number.isNaN(value)) return NaN;
      return value > 1 ? value / 100 : value;
    }
    // string handling
    if (typeof value === "string") {
      const s = value.trim();
      if (s.endsWith("%")) {
        const n = parseFloat(s.slice(0, -1));
        return Number.isNaN(n) ? NaN : n / 100;
      }
      const n = parseFloat(s);
      if (Number.isNaN(n)) return NaN;
      return n > 1 ? n / 100 : n;
    }
    return NaN;
  }

  static _formatPercentFromFraction(frac) {
    if (typeof frac !== "number" || Number.isNaN(frac)) return "N/A";
    return (frac * 100).toFixed(2);
  }

  /**
   * Determines escalation severity based on missing day criteria
   * @param {number} day - The day of the strike
   * @param {string} scenario - MISSING or COMPLETION
   * @returns {number} GameStrikes.Severity level
   */
  _determineEscalationSeverity(day, scenario) {
    // Days 11-13: any missing/incomplete = phone call needed
    if (GameStrikes.EscalationRules.CRITICAL_DAYS.includes(day)) {
      return GameStrikes.Severity.CONTACT_2;
    }

    // Day 1: any missing/incomplete = phone call needed
    if (day === 1) {
      return GameStrikes.Severity.CONTACT_2;
    }

    // Days 2-10: alternate severity by total missing/incomplete occurrences
    if (GameStrikes.EscalationRules.TRACKING_DAYS.includes(day)) {
      this.totalMissingTrackingDays += 1;
      return this.totalMissingTrackingDays % 2 === 1
        ? GameStrikes.Severity.CONTACT_2
        : GameStrikes.Severity.CONTACT_1;
    }

    // default for other days
    return GameStrikes.Severity.CONTACT_1;
  }

  /**
   * Determines severity for accuracy strikes
   * @param {number} day - The day of the strike
   * @param {number} defaultSeverity - The threshold-based severity
   * @returns {number} Final severity considering escalation rules
   */
  _determineAccuracySeverity(day, defaultSeverity) {
    // first accuracy strike = text message
    if (!this.firstStrikeGiven) {
      this.firstStrikeGiven = true;
      return GameStrikes.Severity.CONTACT_1;
    }
    const accuracyCount =
      this.strikeArray[GameStrikes.StrikeType.ACCURACY].length;

    return accuracyCount % 2 === 0
      ? GameStrikes.Severity.CONTACT_2
      : GameStrikes.Severity.CONTACT_1;
  }
  /**
   * @returns {number} Total number of strikes across all categories
   */
  countStrikes() {
    let totalStrikes = 0;
    for (let i = 0; i < this.strikeArray.length; i++) {
      totalStrikes += this.strikeArray[i].length;
    }
    return totalStrikes;
  }

  /**
   * @returns {number} Count of strikes with the their severity
   */
  countStrikesBySeverity(severity) {
    let count = 0;
    for (let i = 0; i < this.strikeDetails.length; i++) {
      count += this.strikeDetails[i].filter(
        (strike) => strike.severity === severity
      ).length;
    }
    return count;
  }

  /**
   * Adds a missing strike for a specific day and task
   * @param {string} day - The day of the strike
   * @param {string} task - The task associated with the strike
   * @param {string} message - (Optional) message for the strike -> Only if needed later
   */
  addMissingStrike(day, task, message = null) {
    const severity = this._determineEscalationSeverity(day, "MISSING");
    this.strikeArray[GameStrikes.StrikeType.MISSING].push(day);
    this.strikeDetails[GameStrikes.StrikeType.MISSING].push({
      day: day,
      task: task,
      scenario: "MISSING",
      message: message || `${task} Task was not performed by participant.`,
      severity: severity,
    });
  }

  /**
   * Adds a completion strike for a specific day and task
   * @param {string} day - Day of the strike
   * @param {string} task - The task associated with the strike
   * @param {number} completionRate - The completion rate for the task
   * @param {number} severity - The threshold-based severity
   */
  addCompletionStrike(day, task, completionRate, severity) {
    const escalatedSeverity = this._determineEscalationSeverity(
      day,
      "COMPLETION"
    );
    const frac = GameStrikes._toFraction(completionRate);
    const pct = GameStrikes._formatPercentFromFraction(frac);
    this.strikeArray[GameStrikes.StrikeType.COMPLETION].push(day);
    this.strikeDetails[GameStrikes.StrikeType.COMPLETION].push({
      day: day,
      task: task,
      scenario: "COMPLETION",
      // store normalized fraction for later business logic
      value: frac,
      message: `Mean session completion (${pct}% of test trials)`,
      severity: escalatedSeverity,
    });
  }

  /**
   * Adds an accuracy strike for a specific day and task.
   * @param {number} day - Day of the strike
   * @param {string} task - The task associated with the strike
   * @param {number} accuracyRate - The accuracy rate for the task
   * @param {number} severity - The threshold-based severity
   */
  addAccuracyStrike(day, task, accuracyRate, severity) {
    const finalSeverity = this._determineAccuracySeverity(day, severity);
    const frac = GameStrikes._toFraction(accuracyRate);
    const pct = GameStrikes._formatPercentFromFraction(frac);
    this.strikeArray[GameStrikes.StrikeType.ACCURACY].push(day);
    this.strikeDetails[GameStrikes.StrikeType.ACCURACY].push({
      day: day,
      task: task,
      scenario: "ACCURACY",
      value: frac,
      message: `Mean session accuracy (${pct}% of test trials)`,
      severity: finalSeverity,
    });
  }

  /**
   * Get all strikes for a specific day
   * @param {number} day - Day of the strike
   * @returns {Array} List of strikes for the specified day
   */
  getStrikesForDay(day) {
    let dayStrikes = [];
    for (let i = 0; i < this.strikeDetails.length; i++) {
      dayStrikes.push(
        ...this.strikeDetails[i].filter((strike) => strike.day === day)
      );
    }
    return dayStrikes;
  }

  /**
   * @returns {Object} Summary of strikes (total counts, counts by severity)
   */
  getStrikeSummary() {
    return {
      totalStrikes: this.countStrikes(),
      contact1Strikes: this.countStrikesBySeverity(
        GameStrikes.Severity.CONTACT_1
      ),
      contact2Strikes: this.countStrikesBySeverity(
        GameStrikes.Severity.CONTACT_2
      ),
      missingCount: this.strikeArray[GameStrikes.StrikeType.MISSING].length,
      completionCount:
        this.strikeArray[GameStrikes.StrikeType.COMPLETION].length,
      accuracyCount: this.strikeArray[GameStrikes.StrikeType.ACCURACY].length,
    };
  }

  // Check if there's strikes
  hasStrikes() {
    return this.countStrikes() > 0;
  }
}
