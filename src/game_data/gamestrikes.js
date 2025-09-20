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
  }

  static StrikeType = {
    MISSING: 0, // Missing game session
    COMPLETION: 1, // Incomplete game session
    ACCURACY: 2, // Inaccurate game session
  };

  static Severity = {
    CONTACT_1: 1, // Low concern
    CONTACT_2: 2, // High concern
  };

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
    this.strikeArray[GameStrikes.StrikeType.MISSING].push(day);
    this.strikeDetails[GameStrikes.StrikeType.MISSING].push({
      day: day,
      task: task,
      scenario: "MISSING",
      message: message || `${task} Task was not performed by participant.`,
      severity: GameStrikes.Severity.CONTACT_1,
    });
  }

  /**
   * Adds a completion strike for a specific day and task
   * @param {string} day - Day of the strike
   * @param {string} task - The task associated with the strike
   * @param {number} completionRate - The completion rate for the task
   * @param {number} severity - The severity of the strike
   */
  addCompletionStrike(day, task, completionRate, severity) {
    this.strikeArray[GameStrikes.StrikeType.COMPLETION].push(day);
    this.strikeDetails[GameStrikes.StrikeType.COMPLETION].push({
      day: day,
      task: task,
      scenario: "COMPLETION",
      message: `Mean session completion (${completionRate.toFixed(
        2
      )}% of test trials)`,
      severity: severity,
    });
  }

  /**
   * Adds an accuracy strike for a specific day and task.
   * @param {number} day - Day of the strike
   * @param {string} task - The task associated with the strike
   * @param {number} accuracyRate - The accuracy rate for the task
   * @param {number} severity - The severity of the strike
   */
  addAccuracyStrike(day, task, accuracyRate, severity) {
    this.strikeArray[GameStrikes.StrikeType.ACCURACY].push(day);
    this.strikeDetails[GameStrikes.StrikeType.ACCURACY].push({
      day: day,
      task: task,
      scenario: "ACCURACY",
      message: `Mean session accuracy (${accuracyRate.toFixed(
        2
      )}% of test trials)`,
      severity: severity,
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
