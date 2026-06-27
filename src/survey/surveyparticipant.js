import Strikes from "./surveystrikes.js";

export default class SurveyParticipant {
  #rowMap = {};

  #setupRowMapping() {
    if (!this.data.columns || !this.data.columns.includes("redcap_event_name")) {
      return;
    }

    const eventNames = this.data["redcap_event_name"].values || [];
    for (let dayNum = 1; dayNum <= SurveyParticipant.getDays(); dayNum++) {
      for (let rowIdx = 0; rowIdx < eventNames.length; rowIdx++) {
        const eventName = eventNames[rowIdx] || "";
        if (eventName.includes(`day_${dayNum}`) || eventName.startsWith(`day_${dayNum}_`)) {
          this.#rowMap[dayNum - 1] = rowIdx;
          break;
        }
      }
    }
  }

  #getValueForDay(columnName, dayIndex) {
    if (this.data[columnName] === undefined || this.data[columnName].values === undefined) {
      return "";
    }

    const rowIdx = this.#rowMap[dayIndex] !== undefined ? this.#rowMap[dayIndex] : 0;
    const value = this.data[columnName].values[rowIdx];
    return (value === 0 || value === "0") ? "0" : (value || "");
  }

  constructor(data, dataDict) {
    this.data = data;
    this.dataDict = dataDict;
    this.#setupRowMapping();
    this.setupCycles();
    this.percentComplete = Array(SurveyParticipant.getDays()).fill(0);
    this.missingQuestions = Array(SurveyParticipant.getDays())
      .fill()
      .map(() => []);
    this.#findDailyPercent();
    this.#generateDates();
    this.#generateDays();
    this.#collectStartEndTimes();
    this.#collectSubmitTimes();
    this.estCompensation();
    this.strikeArray = new Strikes({ mapEarlyToPrevDay: true, graceEndHour: 8 });
    this.evaluateStrikes();
  }

  static getDays() {
    return 14;
  }

  /**
   * Returns the day of the week corresponding to the given day number.
   *
   * @param {number} day - The day number (0-6, where 0 represents Monday).
   * @return {string} The day of the week corresponding to the given day number.
   */
  static getWeekDay(day) {
    let daysOfWeek = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ];
    return daysOfWeek[day % 7];
  }

  toString() {
    return this.getName() + " " + this.getParticipantId();
  }

  getName() {
    let firstName = "FIRST";
    let lastName = "LAST";
    // TO-DO: Change line below to  if (this.data["tfirname"]!= null) {
    if (this.data["tfirname"] !== undefined || this.data["tfirname"] !== null) {
      firstName = this.data["tfirname"].values[0].trim();
    }
    if (
      this.data["tlastname"] !== undefined ||
      this.data["tlastname"] !== null
    ) {
      lastName = this.data["tlasname"].values[0].trim();
    }
    return firstName + " " + lastName;
  }

  getParticipantId() {
    return this.data["participant_id"].values[0];
  }

  getPercentComplete() {
    return this.percentComplete;
  }

  getDate(day) {
    return this.dates[day];
  }

  static formatDate(date) {
    return (
      date.getUTCFullYear() +
      "-" +
      ("0" + (date.getUTCMonth() + 1)).slice(-2) +
      "-" +
      ("0" + date.getUTCDate()).slice(-2)
    );
  }

  // this method is used to generate the dates for each day and mark them as
  // "Not Started", "Unanswered", "Skipped" or "Completed"
  #generateDates() {
    this.dates = Array(SurveyParticipant.getDays()).fill("");
    for (let i = 0; i < SurveyParticipant.getDays(); ++i) {
      let timestampCol = `day_${i + 1}_${SurveyParticipant.getWeekDay(
        i
      )}_daily_survey_timestamp`;
      let dateValue = this.#getValueForDay(`t${i + 1}date`, i);
      if (dateValue !== "") {
        let date = new Date(dateValue + "T00:00:00Z");
        this.dates[i] = SurveyParticipant.formatDate(date);
      } else {
        // Fall back to timestamp column
        let timestampValue = this.#getValueForDay(timestampCol, i);
        if (timestampValue !== "" && timestampValue !== "[not completed]") {
          let dateOnly = timestampValue.split(" ")[0];
          let date = new Date(dateOnly + "T00:00:00Z");
          this.dates[i] = SurveyParticipant.formatDate(date);
        } else {
          // If no date/timestamp found, check if survey has any data
          if (this.percentComplete[i] === 0) {
            this.dates[i] = "Not Submitted";
          } else {
            this.dates[i] = "Partial/Completed";
          }
        }
      }
    }
  }

  #generateDays() {
    this.days = Array(SurveyParticipant.getDays()).fill(0);
    this.days = this.days.map((_, i) => this.percentComplete[i] > 0);
    this.partialDays = this.days.map(
      (_, i) => 0 < this.percentComplete[i] && this.percentComplete[i] < 0.5
    );
    this.lastFilledDay = -1;
    this.days.forEach((val, i) => {
      if (val == true) {
        this.lastFilledDay = i;
      }
    });
  }

  getLastFilledDay() {
    return this.lastFilledDay;
  }

  getDay(day) {
    if (day > SurveyParticipant.getDays() || day < 0) {
      throw new Error("Invalid day");
    }
    let result = 0;
    if (this.partialDays[day]) {
      result = 1;
    } else if (this.days[day]) {
      result = 2;
    }
    return result;
  }

  setupCycles() {
    this.startDate = new Date(this.data["startdt"].values[0] + "T00:00:00");
    this.currCycle = 0;
    this.userDate = new Date();
    let diff = Math.abs(this.startDate - this.userDate);
    let diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));
    diffDays = Math.min(diffDays, SurveyParticipant.getDays());
    this.currCycle = diffDays;
  }

  getCurrentCycle() {
    return Math.min(this.currCycle, SurveyParticipant.getDays() - 1);
  }

  cyclePassed(day) {
    return day < this.currCycle;
  }

  #collectStartEndTimes() {
    this.timeStringArr = Array(SurveyParticipant.getDays()).fill("N/A");
    this.startTimeArr = Array(SurveyParticipant.getDays()).fill(undefined);
    this.endTimeArr = Array(SurveyParticipant.getDays()).fill(undefined);
    this.durStringArr = Array(SurveyParticipant.getDays()).fill("N/A");
    this.durationDeltas = Array(SurveyParticipant.getDays()).fill(0);

    for (let i = 0; i < SurveyParticipant.getDays(); ++i) {
      let startTimeCol = `t${i + 1}strti`;
      let endTimeCol = `t${i + 1}endti`;

      let startValue = this.#getValueForDay(`${startTimeCol}`, i);
      let endValue = this.#getValueForDay(`${endTimeCol}`, i);
      if (startValue == "" && endValue == "") {
        this.timeStringArr[i] = "--:--";
        continue;
      }

      if (startValue !== "") {
        let [hours, minutes] = startValue.split(":");
        var start = new Date();
        start.setHours(hours, minutes, 0, 0);
        if (5 < start.getHours() && start.getHours() < 12) {
          start.setHours(start.getHours() + 12);
        } else if (12 <= start.getHours() && start.getHours() < 17) {
          start.setHours(start.getHours() - 12);
        }
        this.timeStringArr[i] =
          start.getHours() + ":" + ("0" + start.getMinutes()).slice(-2);
        this.startTimeArr[i] = start; // TODO, may have a issue with the date being weird as it starts on user date not participant survey date
      }

      if (endValue !== "") {
        let [hours, minutes] = endValue.split(":");
        var end = new Date();
        end.setHours(hours, minutes, 0, 0);
        if (5 < end.getHours() && end.getHours() < 12) {
          end.setHours(end.getHours() + 12);
        } else if (12 <= end.getHours() && end.getHours() < 17) {
          end.setHours(end.getHours() - 12);
        }
        if (startValue === "") {
          this.timeStringArr[i] =
            end.getHours() + ":" + ("0" + end.getMinutes()).slice(-2);
        }

        if (startValue !== "") {
          if (end < start) {
            end.setDate(end.getDate() + 1);
          }
        }
        this.endTimeArr[i] = end;
      }

      if (startValue !== "" && endValue !== "") {
        let duration = end - start; // in ms
        this.durationDeltas[i] = duration;

        let durHour = Math.floor(duration / (1000 * 60 * 60));
        let durMin = Math.floor(duration / (1000 * 60)) % 60;

        durHour = durHour < 10 ? "0" + durHour : durHour;
        durMin = durMin < 10 ? "0" + durMin : durMin;
        this.durStringArr[i] = `${durHour}:${durMin}`;
      }
    }
  }

  getDuration(day) {
    if (day > SurveyParticipant.getDays() || day < 0) {
      throw new Error("Invalid day");
    }
    return this.durStringArr[day];
  }

  #collectSubmitTimes() {
    this.submitTimes = Array(SurveyParticipant.getDays()).fill("--:--");
    // store full Date objects for each submit timestamp so strikes can use
    // accurate comparisons across dates (e.g., submissions after midnight)
    this.submitDateTimes = Array(SurveyParticipant.getDays()).fill(null);
    for (let i = 0; i < SurveyParticipant.getDays(); ++i) {
      let timestampCol = `day_${i + 1}_${SurveyParticipant.getWeekDay(
        i
      )}_daily_survey_timestamp`;
      let timestamp = this.#getValueForDay(`${timestampCol}`, i);
      if (timestamp !== "") {
        // timestamp expected like "YYYY-MM-DD HH:MM:SS" (no timezone)
        // store the human-readable HH:MM for display
        let [date, time] = timestamp.split(" ");
        let [hours, minutes, seconds] = time.split(":");
        let submitHour = parseInt(hours);
        if (isNaN(submitHour)) {
          this.submitTimes[i] = "--:--";
          continue;
        }
        this.submitTimes[i] = hours + ":" + minutes;

        // store a Date object for accurate comparisons. Replace the space
        // with a 'T' so Date will parse it as local datetime.
        try {
          let iso = timestamp.replace(' ', 'T');
          let submitDate = new Date(iso);
          if (!isNaN(submitDate.getTime())) {
            this.submitDateTimes[i] = submitDate;
          } else {
            // fallback: try appending seconds if missing
            let iso2 = `${date}T${hours}:${minutes}:00`;
            let submitDate2 = new Date(iso2);
            if (!isNaN(submitDate2.getTime())) {
              this.submitDateTimes[i] = submitDate2;
            }
          }
        } catch (e) {
          // leave as null if parsing fails
          this.submitDateTimes[i] = null;
        }
      }
    }
  }

  getSubmitTime(day) {
    if (day > SurveyParticipant.getDays() || day < 0) {
      throw new Error("Invalid day");
    }
    return this.submitTimes[day];
  }

  estCompensation() {
    const BONUSES = [1, 2, 3, 0, 2, 3, 0, 1, 0, 1, 0, 2, 3, 4];
    const BONUS_TYPES = [
      "SINGLE",
      "DOUBLE",
      "SUPER",
      "",
      "DOUBLE",
      "SUPER",
      "",
      "SINGLE",
      "",
      "SINGLE",
      "",
      "DOUBLE",
      "SUPER",
      "TRIPLE",
    ];
    const BASE_COMP = 2;

    let compRates = Array(SurveyParticipant.getDays()).fill("$ 0.00");
    let cumulativeComp = Array(SurveyParticipant.getDays()).fill(0);
    let potentialCumComp = Array(SurveyParticipant.getDays()).fill(0);

    for (let i = 0; i < SurveyParticipant.getDays(); ++i) {
      if (this.percentComplete[i] > 0.35) {
        cumulativeComp[i] = BASE_COMP + BONUSES[i];
        compRates[i] = `$ ${cumulativeComp[i].toFixed(2)}`;
      } else if (this.percentComplete[i] > 0) {
        cumulativeComp[i] = BASE_COMP;
        compRates[i] = `$ ${cumulativeComp[i].toFixed(2)}`;
      } // if 0 do not set anything.
    }

    for (let i = 1; i < SurveyParticipant.getDays(); ++i) {
      cumulativeComp[i] += cumulativeComp[i - 1];
    }

    for (let i = 0; i < SurveyParticipant.getDays(); ++i) {
      if (this.cyclePassed(i)) {
        potentialCumComp[i] = cumulativeComp[i];
      } else {
        potentialCumComp[i] = potentialCumComp[i - 1] + BASE_COMP + BONUSES[i];
      }
    }

    this.compRates = compRates;
    this.cumulativeComp = cumulativeComp;
    this.potentialCumComp = potentialCumComp;
    this.BONUS_TYPES = BONUS_TYPES;
    // console.log(potentialCumComp);
  }

  getCompRate(day) {
    if (day > SurveyParticipant.getDays() || day < 0) {
      throw new Error("Invalid day");
    }
    return this.compRates[day];
  }

  getCumulativeComp(day) {
    if (day > SurveyParticipant.getDays() || day < 0) {
      throw new Error("Invalid day");
    }
    return this.cumulativeComp[day];
  }

  getPotentialCumulativeComp(day) {
    if (day > SurveyParticipant.getDays() || day < 0) {
      throw new Error("Invalid day");
    }
    return this.potentialCumComp[day];
  }

  getBonusType(day) {
    if (day > SurveyParticipant.getDays() || day < 0) {
      throw new Error("Invalid day");
    }
    return this.BONUS_TYPES[day];
  }

  #findDailyPercent() {
    let answerArray = Array(SurveyParticipant.getDays())
      .fill()
      .map(() => []);
    let columnArray = Array(SurveyParticipant.getDays())
      .fill()
      .map(() => []);
    // find start and end of each day
    let dayStartEnd = Array(SurveyParticipant.getDays())
      .fill()
      .map(() => [-1, -1]);

    /**
     * Ignores fields that are actually optional and mess up the total % calculation,
     * namely the optional "Over the counter medication" fields.
     * @type {Set<string>}
     */

    /** previously ignored for fortune/cognitive survey
    const ignoreCols = new Set([
        't1qdan', 't1qanm1', 't1qanm2', 't1qanm3', 't1qanm4', 't1qanm5',
        't2mna1', 't2mfreq1', 't2mdose1', 't2mna2', 't2mna3', 't2mna4', 't2mna5', 't2mfreq2', 't2mfreq3', 't2mfreq4', 't2mfreq5', 't2mdose2', 't2mdose3', 't2mdose4', 't2mdose5', 't2mnq1', 't2mnq2', 't2mnq3', 't2mnq4', 't2mnq5', 't2mna6', 't2mnq6', 't2sfre1', 't2sfre2', 't2sfre3', 't2sfre4', 't2sfre5', 't2sdos1', 't2sdos2', 't2sdos3', 't2sdos4', 't2sdos5', 't2qdan', 't2use_1', 't2use_2', 't2use_3', 't2use_4', 't2use_5', 't2qdan_2', 't2asmn', 't2asn', 't2asn_2', 't2asn_3', 't2asn_4', 't2asn_5',
        't3qdan', 't3use_1', 't3use_2', 't3use_3', 't3use_4', 't3use_5', 't3use_6', 't3use_7', 't3use_8', 't3use_9', 't3use_10', 't3qdan_2', 't3asmn', 't3asn', 't3asn_2', 't3asn_3', 't3asn_4', 't3asn_5',
        't4qdan', 't4use_1', 't4use_2', 't4use_3', 't4use_4', 't4use_5', 't4use_6', 't4use_7', 't4use_8', 't4use_9', 't4use_10', 't4use_11', 't4use_12', 't4use_13', 't4use_14', 't4use_15', 't4qdan_2', 't4asmn', 't4asn', 't4asn_2', 't4asn_3', 't4asn_4', 't4asn_5',
        't5qdan', 't5use_1', 't5use_2', 't5use_3', 't5use_4', 't5use_5', 't5use_6', 't5use_7', 't5use_8', 't5use_9', 't5use_10', 't5use_11', 't5use_12', 't5use_13', 't5use_14', 't5use_15', 't5use_16', 't5use_17', 't5use_18', 't5use_19', 't5use_20', 't5qdan_2', 't5asmn', 't5asn', 't5asn_2', 't5asn_3', 't5asn_4', 't5asn_5', 't5qms1',
        't6qdan', 't6use_1', 't6use_2', 't6use_3', 't6use_4', 't6use_5', 't6use_6', 't6use_7', 't6use_8', 't6use_9', 't6use_10', 't6use_11', 't6use_12', 't6use_13', 't6use_14', 't6use_15', 't6use_16', 't6use_17', 't6use_18', 't6use_19', 't6use_20', 't6use_21', 't6use_22', 't6use_23', 't6use_24', 't6use_25', 't6qdan_2', 't6asmn', 't6asn', 't6asn_2', 't6asn_3', 't6asn_4', 't6asn_5',
        't7qdan', 't7use_1', 't7use_2', 't7use_3', 't7use_4', 't7use_5', 't7use_6', 't7use_7', 't7use_8', 't7use_9', 't7use_10', 't7use_11', 't7use_12', 't7use_13', 't7use_14', 't7use_15', 't7use_16', 't7use_17', 't7use_18', 't7use_19', 't7use_20', 't7use_21', 't7use_22', 't7use_23', 't7use_24', 't7use_25', 't7use_26', 't7use_27', 't7use_28', 't7use_29', 't7use_30', 't7qdan_2', 't7asmn', 't7asn', 't7asn_2', 't7asn_3', 't7asn_4', 't7asn_5',
        't8qdan', 't8use_1', 't8use_2', 't8use_3', 't8use_4', 't8use_5', 't8use_6', 't8use_7', 't8use_8', 't8use_9', 't8use_10', 't8use_11', 't8use_12', 't8use_13', 't8use_14', 't8use_15', 't8use_16', 't8use_17', 't8use_18', 't8use_19', 't8use_20', 't8use_21', 't8use_22', 't8use_23', 't8use_24', 't8use_25', 't8use_26', 't8use_27', 't8use_28', 't8use_29', 't8use_30', 't8use_31', 't8use_32', 't8use_33', 't8use_34', 't8use_35', 't8qdan_2', 't8asmn', 't8asn', 't8asn_2', 't8asn_3', 't8asn_4', 't8asn_5',
        't9qdan', 't9use_1', 't9use_2', 't9use_3', 't9use_4', 't9use_5', 't9use_6', 't9use_7', 't9use_8', 't9use_9', 't9use_10', 't9use_11', 't9use_12', 't9use_13', 't9use_14', 't9use_15', 't9use_16', 't9use_17', 't9use_18', 't9use_19', 't9use_20', 't9use_21', 't9use_22', 't9use_23', 't9use_24', 't9use_25', 't9use_26', 't9use_27', 't9use_28', 't9use_29', 't9use_30', 't9use_31', 't9use_32', 't9use_33', 't9use_34', 't9use_35', 't9use_36', 't9use_37', 't9use_38', 't9use_39', 't9use_40', 't9qdan_2', 't9asmn', 't9asn', 't9asn_2', 't9asn_3', 't9asn_4', 't9asn_5',
        't10qdan', 't10use_1', 't10use_2', 't10use_3', 't10use_4', 't10use_5', 't10use_6', 't10use_7', 't10use_8', 't10use_9', 't10use_10', 't10use_11', 't10use_12', 't10use_13', 't10use_14', 't10use_15', 't10use_16', 't10use_17', 't10use_18', 't10use_19', 't10use_20', 't10use_21', 't10use_22', 't10use_23', 't10use_24', 't10use_25', 't10use_26', 't10use_27', 't10use_28', 't10use_29', 't10use_30', 't10use_31', 't10use_32', 't10use_33', 't10use_34', 't10use_35', 't10use_36', 't10use_37', 't10use_38', 't10use_39', 't10use_40', 't10use_41', 't10use_42', 't10use_43', 't10use_44', 't10use_45', 't10qdan_2', 't10asmn', 't10asn', 't10asn_2', 't10asn_3', 't10asn_4', 't10asn_5',
        't11qdan', 't11use_1', 't11use_2', 't11use_3', 't11use_4', 't11use_5', 't11use_6', 't11use_7', 't11use_8', 't11use_9', 't11use_10', 't11use_11', 't11use_12', 't11use_13', 't11use_14', 't11use_15', 't11use_16', 't11use_17', 't11use_18', 't11use_19', 't11use_20', 't11use_21', 't11use_22', 't11use_23', 't11use_24', 't11use_25', 't11use_26', 't11use_27', 't11use_28', 't11use_29', 't11use_30', 't11use_31', 't11use_32', 't11use_33', 't11use_34', 't11use_35', 't11use_36', 't11use_37', 't11use_38', 't11use_39', 't11use_40', 't11use_41', 't11use_42', 't11use_43', 't11use_44', 't11use_45', 't11use_46', 't11use_47', 't11use_48', 't11use_49', 't11use_50', 't11qdan_2', 't11asmn', 't11asn', 't11asn_2', 't11asn_3', 't11asn_4', 't11asn_5',
        't12qdan', 't12use_1', 't12use_2', 't12use_3', 't12use_4', 't12use_5', 't12use_6', 't12use_7', 't12use_8', 't12use_9', 't12use_10', 't12use_11', 't12use_12', 't12use_13', 't12use_14', 't12use_15', 't12use_16', 't12use_17', 't12use_18', 't12use_19', 't12use_20', 't12use_21', 't12use_22', 't12use_23', 't12use_24', 't12use_25', 't12use_26', 't12use_27', 't12use_28', 't12use_29', 't12use_30', 't12use_31', 't12use_32', 't12use_33', 't12use_34', 't12use_35', 't12use_36', 't12use_37', 't12use_38', 't12use_39', 't12use_40', 't12use_41', 't12use_42', 't12use_43', 't12use_44', 't12use_45', 't12use_46', 't12use_47', 't12use_48', 't12use_49', 't12use_50', 't12use_51', 't12use_52', 't12use_53', 't12use_54', 't12use_55', 't12qdan_2', 't12asmn', 't12asn', 't12asn_2', 't12asn_3', 't12asn_4', 't12asn_5',
        't13qdan', 't13use_1', 't13use_2', 't13use_3', 't13use_4', 't13use_5', 't13use_6', 't13use_7', 't13use_8', 't13use_9', 't13use_10', 't13use_11', 't13use_12', 't13use_13', 't13use_14', 't13use_15', 't13use_16', 't13use_17', 't13use_18', 't13use_19', 't13use_20', 't13use_21', 't13use_22', 't13use_23', 't13use_24', 't13use_25', 't13use_26', 't13use_27', 't13use_28', 't13use_29', 't13use_30', 't13use_31', 't13use_32', 't13use_33', 't13use_34', 't13use_35', 't13use_36', 't13use_37', 't13use_38', 't13use_39', 't13use_40', 't13use_41', 't13use_42', 't13use_43', 't13use_44', 't13use_45', 't13use_46', 't13use_47', 't13use_48', 't13use_49', 't13use_50', 't13use_51', 't13use_52', 't13use_53', 't13use_54', 't13use_55', 't13use_56', 't13use_57', 't13use_58', 't13use_59', 't13use_60', 't13qdan_2', 't13asmn', 't13asn', 't13asn_2', 't13asn_3', 't13asn_4', 't13asn_5',
        't14qdan', 't14use_1', 't14use_2', 't14use_3', 't14use_4', 't14use_5', 't14use_6', 't14use_7', 't14use_8', 't14use_9', 't14use_10', 't14use_11', 't14use_12', 't14use_13', 't14use_14', 't14use_15', 't14use_16', 't14use_17', 't14use_18', 't14use_19', 't14use_20', 't14use_21', 't14use_22', 't14use_23', 't14use_24', 't14use_25', 't14use_26', 't14use_27', 't14use_28', 't14use_29', 't14use_30', 't14use_31', 't14use_32', 't14use_33', 't14use_34', 't14use_35', 't14use_36', 't14use_37', 't14use_38', 't14use_39', 't14use_40', 't14use_41', 't14use_42', 't14use_43', 't14use_44', 't14use_45', 't14use_46', 't14use_47', 't14use_48', 't14use_49', 't14use_50', 't14use_51', 't14use_52', 't14use_53', 't14use_54', 't14use_55', 't14use_56', 't14use_57', 't14use_58', 't14use_59', 't14use_60', 't14use_61', 't14use_62', 't14use_63', 't14use_64', 't14use_65', 't14qdan_2', 't14asmn', 't14asn', 't14asn_2', 't14asn_3', 't14asn_4', 't14asn_5'
    ]);
    */
   const ignoreCols = new Set([
    // Activity fields 3-5 (optional, no branch logic in data dictionary)
    't1act3', 't1act3h', 't1act3m', 't1act3p', 't1act4', 't1act4h',
    't1act4m', 't1act4p', 't1act5', 't1act5h', 't1act5m', 't1act5p',
    't2act3', 't2act3h', 't2act3m', 't2act3p', 't2act4', 't2act4h',
    't2act4m', 't2act4p', 't2act5', 't2act5h', 't2act5m', 't2act5p',
    't3act3', 't3act3h', 't3act3m', 't3act3p', 't3act4', 't3act4h',
    't3act4m', 't3act4p', 't3act5', 't3act5h', 't3act5m', 't3act5p',
    't4act3', 't4act3h', 't4act3m', 't4act3p', 't4act4', 't4act4h',
    't4act4m', 't4act4p', 't4act5', 't4act5h', 't4act5m', 't4act5p',
    't5act3', 't5act3h', 't5act3m', 't5act3p', 't5act4', 't5act4h',
    't5act4m', 't5act4p', 't5act5', 't5act5h', 't5act5m', 't5act5p',
    't6act3', 't6act3h', 't6act3m', 't6act3p', 't6act4', 't6act4h',
    't6act4m', 't6act4p', 't6act5', 't6act5h', 't6act5m', 't6act5p',
    't7act3', 't7act3h', 't7act3m', 't7act3p', 't7act4', 't7act4h',
    't7act4m', 't7act4p', 't7act5', 't7act5h', 't7act5m', 't7act5p',
    't8act3', 't8act3h', 't8act3m', 't8act3p', 't8act4', 't8act4h',
    't8act4m', 't8act4p', 't8act5', 't8act5h', 't8act5m', 't8act5p',
    't9act3', 't9act3h', 't9act3m', 't9act3p', 't9act4', 't9act4h',
    't9act4m', 't9act4p', 't9act5', 't9act5h', 't9act5m', 't9act5p',
    't10act3', 't10act3h', 't10act3m', 't10act3p', 't10act4', 't10act4h',
    't10act4m', 't10act4p', 't10act5', 't10act5h', 't10act5m', 't10act5p',
    't11act3', 't11act3h', 't11act3m', 't11act3p', 't11act4', 't11act4h',
    't11act4m', 't11act4p', 't11act5', 't11act5h', 't11act5m', 't11act5p',
    't12act3', 't12act3h', 't12act3m', 't12act3p', 't12act4', 't12act4h',
    't12act4m', 't12act4p', 't12act5', 't12act5h', 't12act5m', 't12act5p',
    't13act3', 't13act3h', 't13act3m', 't13act3p', 't13act4', 't13act4h',
    't13act4m', 't13act4p', 't13act5', 't13act5h', 't13act5m', 't13act5p',
    't14act3', 't14act3h', 't14act3m', 't14act3p', 't14act4', 't14act4h',
    't14act4m', 't14act4p', 't14act5', 't14act5h', 't14act5m', 't14act5p',
    't10asacnt', 't10asmn', 't10asmn1', 't10asn', 't10asn_2', 't10asnc1', 't10asnc2', 't10asnc3', 't10asnc4', 't10asnc5',
    't10cmd', 't10cmk', 't10igtfle', 't10igtfls', 't10mdos1', 't10mdos2', 't10mdos3', 't10mdos4', 't10mdos5', 't10mfre1',
    't10mfre2', 't10mfre3', 't10mfre4', 't10mfre5', 't10mna1', 't10mna2', 't10mna3', 't10mna4', 't10mna5', 't10mna6',
    't10mnq1', 't10mnq2', 't10mnq3', 't10mnq4', 't10mnq5', 't10mnq6', 't10otacnt', 't10otc1', 't10otc2', 't10otc3',
    't10otc4', 't10otc5', 't10otn1d', 't10otn1f', 't10otn1n', 't10otn2d', 't10otn2f', 't10otn2n', 't10otnm', 't10otnm1',
    't10otnw', 't10otu1', 't10otu2', 't10otu3', 't10otu4', 't10otu5', 't10qdan', 't10qdan_2', 't10rxacnt', 't10rxn1d',
    't10rxn1f', 't10rxn1n', 't10rxn2d', 't10rxn2f', 't10rxn2n', 't10rxnm', 't10rxnm1', 't10rxnw', 't10rxu1', 't10rxu2',
    't10rxu3', 't10rxu4', 't10rxu5', 't10sdos1', 't10sdos2', 't10sdos3', 't10sdos4', 't10sdos5', 't10sfre1', 't10sfre2',
    't10sfre3', 't10sfre4', 't10sfre5', 't10use_1', 't10use_2', 't10use_3', 't10use_4', 't10use_5', 't10vertic', 't11asacnt',
    't11asmn', 't11asmn1', 't11asn', 't11asn_2', 't11asnc1', 't11asnc2', 't11asnc3', 't11asnc4', 't11asnc5', 't11cmd',
    't11cmk', 't11igtfle', 't11igtfls', 't11mdos1', 't11mdos2', 't11mdos3', 't11mdos4', 't11mdos5', 't11mfre1', 't11mfre2',
    't11mfre3', 't11mfre4', 't11mfre5', 't11mna1', 't11mna2', 't11mna3', 't11mna4', 't11mna5', 't11mna6', 't11mnq1',
    't11mnq2', 't11mnq3', 't11mnq4', 't11mnq5', 't11mnq6', 't11otacnt', 't11otc1', 't11otc2', 't11otc3', 't11otc4',
    't11otc5', 't11otn1d', 't11otn1f', 't11otn1n', 't11otn2d', 't11otn2f', 't11otn2n', 't11otnm', 't11otnm1', 't11otnw',
    't11otu1', 't11otu2', 't11otu3', 't11otu4', 't11otu5', 't11qdan', 't11qdan_2', 't11rxacnt', 't11rxn1d', 't11rxn1f',
    't11rxn1n', 't11rxn2d', 't11rxn2f', 't11rxn2n', 't11rxnm', 't11rxnm1', 't11rxnw', 't11rxu1', 't11rxu2', 't11rxu3',
    't11rxu4', 't11rxu5', 't11sdos1', 't11sdos2', 't11sdos3', 't11sdos4', 't11sdos5', 't11sfre1', 't11sfre2', 't11sfre3',
    't11sfre4', 't11sfre5', 't11use_1', 't11use_2', 't11use_3', 't11use_4', 't11use_5', 't11vertic', 't12asacnt', 't12asmn',
    't12asmn1', 't12asn', 't12asn_2', 't12asnc1', 't12asnc2', 't12asnc3', 't12asnc4', 't12asnc5', 't12cmd', 't12cmk',
    't12igtfle', 't12igtfls', 't12mdos1', 't12mdos2', 't12mdos3', 't12mdos4', 't12mdos5', 't12mfre1', 't12mfre2', 't12mfre3',
    't12mfre4', 't12mfre5', 't12mna1', 't12mna2', 't12mna3', 't12mna4', 't12mna5', 't12mna6', 't12mnq1', 't12mnq2',
    't12mnq3', 't12mnq4', 't12mnq5', 't12mnq6', 't12otacnt', 't12otc1', 't12otc2', 't12otc3', 't12otc4', 't12otc5',
    't12otn1d', 't12otn1f', 't12otn1n', 't12otn2d', 't12otn2f', 't12otn2n', 't12otnm', 't12otnm1', 't12otnw', 't12otu1',
    't12otu2', 't12otu3', 't12otu4', 't12otu5', 't12qdan', 't12qdan_2', 't12rxacnt', 't12rxn1d', 't12rxn1f', 't12rxn1n',
    't12rxn2d', 't12rxn2f', 't12rxn2n', 't12rxnm', 't12rxnm1', 't12rxnw', 't12rxu1', 't12rxu2', 't12rxu3', 't12rxu4',
    't12rxu5', 't12sdos1', 't12sdos2', 't12sdos3', 't12sdos4', 't12sdos5', 't12sfre1', 't12sfre2', 't12sfre3', 't12sfre4',
    't12sfre5', 't12use_1', 't12use_2', 't12use_3', 't12use_4', 't12use_5', 't12vertic', 't13asacnt', 't13asmn', 't13asmn1',
    't13asn', 't13asn_2', 't13asnc1', 't13asnc2', 't13asnc3', 't13asnc4', 't13asnc5', 't13cmd', 't13cmk', 't13igtfle',
    't13igtfls', 't13mdos1', 't13mdos2', 't13mdos3', 't13mdos4', 't13mdos5', 't13mfre1', 't13mfre2', 't13mfre3', 't13mfre4',
    't13mfre5', 't13mna1', 't13mna2', 't13mna3', 't13mna4', 't13mna5', 't13mna6', 't13mnq1', 't13mnq2', 't13mnq3',
    't13mnq4', 't13mnq5', 't13mnq6', 't13otacnt', 't13otc1', 't13otc2', 't13otc3', 't13otc4', 't13otc5', 't13otn1d',
    't13otn1f', 't13otn1n', 't13otn2d', 't13otn2f', 't13otn2n', 't13otnm', 't13otnm1', 't13otnw', 't13otu1', 't13otu2',
    't13otu3', 't13otu4', 't13otu5', 't13qdan', 't13qdan_2', 't13rxacnt', 't13rxn1d', 't13rxn1f', 't13rxn1n', 't13rxn2d',
    't13rxn2f', 't13rxn2n', 't13rxnm', 't13rxnm1', 't13rxnw', 't13rxu1', 't13rxu2', 't13rxu3', 't13rxu4', 't13rxu5',
    't13sdos1', 't13sdos2', 't13sdos3', 't13sdos4', 't13sdos5', 't13sfre1', 't13sfre2', 't13sfre3', 't13sfre4', 't13sfre5',
    't13use_1', 't13use_2', 't13use_3', 't13use_4', 't13use_5', 't13vertic', 't14asacnt', 't14asmn', 't14asmn1', 't14asn',
    't14asn_2', 't14asnc1', 't14asnc2', 't14asnc3', 't14asnc4', 't14asnc5', 't14cmd', 't14cmk', 't14igtfle', 't14igtfls',
    't14mdos1', 't14mdos2', 't14mdos3', 't14mdos4', 't14mdos5', 't14mfre1', 't14mfre2', 't14mfre3', 't14mfre4', 't14mfre5',
    't14mna1', 't14mna2', 't14mna3', 't14mna4', 't14mna5', 't14mna6', 't14mnq1', 't14mnq2', 't14mnq3', 't14mnq4',
    't14mnq5', 't14mnq6', 't14otacnt', 't14otc1', 't14otc2', 't14otc3', 't14otc4', 't14otc5', 't14otn1d', 't14otn1f',
    't14otn1n', 't14otn2d', 't14otn2f', 't14otn2n', 't14otnm', 't14otnm1', 't14otnw', 't14otu1', 't14otu2', 't14otu3',
    't14otu4', 't14otu5', 't14qdan', 't14qdan_2', 't14rxacnt', 't14rxn1d', 't14rxn1f', 't14rxn1n', 't14rxn2d', 't14rxn2f',
    't14rxn2n', 't14rxnm', 't14rxnm1', 't14rxnw', 't14rxu1', 't14rxu2', 't14rxu3', 't14rxu4', 't14rxu5', 't14sdos1',
    't14sdos2', 't14sdos3', 't14sdos4', 't14sdos5', 't14sfre1', 't14sfre2', 't14sfre3', 't14sfre4', 't14sfre5', 't14use_1',
    't14use_2', 't14use_3', 't14use_4', 't14use_5', 't14vertic', 't1bgsfle', 't1bgsfls', 't1cmd', 't1cmk', 't1qanm1',
    't1qanm2', 't1qanm3', 't1qdan', 't1vertic', 't2asacnt', 't2asmn', 't2asmn1', 't2asn', 't2asn_2', 't2asnc1',
    't2asnc2', 't2asnc3', 't2asnc4', 't2asnc5', 't2bgsfle', 't2bgsfls', 't2cmd', 't2cmk', 't2mna1', 't2mna2',
    't2mna3', 't2mna4', 't2mna5', 't2otacnt', 't2otc1', 't2otc2', 't2otc3', 't2otc4', 't2otc5', 't2otn1d',
    't2otn1f', 't2otn1n', 't2otn2d', 't2otn2f', 't2otn2n', 't2otnm', 't2otnm1', 't2otnw', 't2otu1', 't2otu2',
    't2otu3', 't2otu4', 't2otu5', 't2qdan', 't2qdan_2', 't2rxacnt', 't2rxn1d', 't2rxn1f', 't2rxn1n', 't2rxn2d',
    't2rxn2f', 't2rxn2n', 't2rxnm', 't2rxnm1', 't2rxnw', 't2rxu1', 't2rxu2', 't2rxu3', 't2rxu4', 't2rxu5',
    't2use_1', 't2use_2', 't2use_3', 't2use_4', 't2use_5', 't2vertic', 't3asacnt', 't3asmn', 't3asmn1', 't3asn',
    't3asn_2', 't3asnc1', 't3asnc2', 't3asnc3', 't3asnc4', 't3asnc5', 't3bgsfle', 't3bgsfls', 't3cmd', 't3cmk',
    't3mdose1', 't3mdose2', 't3mdose3', 't3mdose4', 't3mdose5', 't3mfreq1', 't3mfreq2', 't3mfreq3', 't3mfreq4', 't3mfreq5',
    't3mna1', 't3mna2', 't3mna3', 't3mna4', 't3mna5', 't3mna6', 't3mnq1', 't3mnq2', 't3mnq3', 't3mnq4',
    't3mnq5', 't3mnq6', 't3otacnt', 't3otc1', 't3otc2', 't3otc3', 't3otc4', 't3otc5', 't3otn1d', 't3otn1f',
    't3otn1n', 't3otn2d', 't3otn2f', 't3otn2n', 't3otnm', 't3otnm1', 't3otnw', 't3otu1', 't3otu2', 't3otu3',
    't3otu4', 't3otu5', 't3qdan', 't3qdan_2', 't3rxacnt', 't3rxn1d', 't3rxn1f', 't3rxn1n', 't3rxn2d', 't3rxn2f',
    't3rxn2n', 't3rxnm', 't3rxnm1', 't3rxnw', 't3rxu1', 't3rxu2', 't3rxu3', 't3rxu4', 't3rxu5', 't3sdose1',
    't3sdose2', 't3sdose3', 't3sdose4', 't3sdose5', 't3sfreq1', 't3sfreq2', 't3sfreq3', 't3sfreq4', 't3sfreq5', 't3use_1',
    't3use_2', 't3use_3', 't3use_4', 't3use_5', 't3vertic', 't4asacnt', 't4asmn', 't4asmn1', 't4asn', 't4asn_2',
    't4asnc1', 't4asnc2', 't4asnc3', 't4asnc4', 't4asnc5', 't4bgsfle', 't4bgsfls', 't4mdose1', 't4mdose2', 't4mdose3',
    't4mdose4', 't4mdose5', 't4mfreq1', 't4mfreq2', 't4mfreq3', 't4mfreq4', 't4mfreq5', 't4mna1', 't4mna2', 't4mna3',
    't4mna4', 't4mna5', 't4mna6', 't4mnq1', 't4mnq2', 't4mnq3', 't4mnq4', 't4mnq5', 't4mnq6', 't4otacnt',
    't4otc1', 't4otc2', 't4otc3', 't4otc4', 't4otc5', 't4otn1d', 't4otn1f', 't4otn1n', 't4otn2d', 't4otn2f',
    't4otn2n', 't4otnm', 't4otnm1', 't4otnw', 't4otu1', 't4otu2', 't4otu3', 't4otu4', 't4otu5', 't4qdan',
    't4qdan_2', 't4rxacnt', 't4rxn1d', 't4rxn1f', 't4rxn1n', 't4rxn2d', 't4rxn2f', 't4rxn2n', 't4rxnm', 't4rxnm1',
    't4rxnw', 't4rxu1', 't4rxu2', 't4rxu3', 't4rxu4', 't4rxu5', 't4sdose1', 't4sdose2', 't4sdose3', 't4sdose4',
    't4sdose5', 't4sfreq1', 't4sfreq2', 't4sfreq3', 't4sfreq4', 't4sfreq5', 't4use_1', 't4use_2', 't4use_3', 't4use_4',
    't4use_5', 't4vertic', 't5asacnt', 't5asmn', 't5asmn1', 't5asn', 't5asn_2', 't5asnc1', 't5asnc2', 't5asnc3',
    't5asnc4', 't5asnc5', 't5bgsfle', 't5bgsfls', 't5cmd', 't5cmk', 't5mdose1', 't5mdose2', 't5mdose3', 't5mdose4',
    't5mdose5', 't5mfreq1', 't5mfreq2', 't5mfreq3', 't5mfreq4', 't5mfreq5', 't5mna1', 't5mna2', 't5mna3', 't5mna4',
    't5mna5', 't5mna6', 't5mnq1', 't5mnq2', 't5mnq3', 't5mnq4', 't5mnq5', 't5mnq6', 't5otacnt', 't5otc1',
    't5otc2', 't5otc3', 't5otc4', 't5otc5', 't5otn1d', 't5otn1f', 't5otn1n', 't5otn2d', 't5otn2f', 't5otn2n',
    't5otnm', 't5otnm1', 't5otnw', 't5otu1', 't5otu2', 't5otu3', 't5otu4', 't5otu5', 't5qdan', 't5qdan_2',
    't5rxacnt', 't5rxn1d', 't5rxn1f', 't5rxn1n', 't5rxn2d', 't5rxn2f', 't5rxn2n', 't5rxnm', 't5rxnm1', 't5rxnw',
    't5rxu1', 't5rxu2', 't5rxu3', 't5rxu4', 't5rxu5', 't5sdose1', 't5sdose2', 't5sdose3', 't5sdose4', 't5sdose5',
    't5sfreq1', 't5sfreq2', 't5sfreq3', 't5sfreq4', 't5sfreq5', 't5use_1', 't5use_2', 't5use_3', 't5use_4', 't5use_5',
    't5vertic', 't6asacnt', 't6asmn', 't6asmn1', 't6asn', 't6asn_2', 't6asnc1', 't6asnc2', 't6asnc3', 't6asnc4',
    't6asnc5', 't6bgsfle', 't6bgsfls', 't6cmd', 't6cmk', 't6mdose1', 't6mdose2', 't6mdose3', 't6mdose4', 't6mdose5',
    't6mfreq1', 't6mfreq2', 't6mfreq3', 't6mfreq4', 't6mfreq5', 't6mna1', 't6mna2', 't6mna3', 't6mna4', 't6mna5',
    't6mna6', 't6mnq1', 't6mnq2', 't6mnq3', 't6mnq4', 't6mnq5', 't6mnq6', 't6otacnt', 't6otc1', 't6otc2',
    't6otc3', 't6otc4', 't6otc5', 't6otn1d', 't6otn1f', 't6otn1n', 't6otn2d', 't6otn2f', 't6otn2n', 't6otnm',
    't6otnm1', 't6otnw', 't6otu1', 't6otu2', 't6otu3', 't6otu4', 't6otu5', 't6qdan', 't6qdan_2', 't6rxacnt',
    't6rxn1d', 't6rxn1f', 't6rxn1n', 't6rxn2d', 't6rxn2f', 't6rxn2n', 't6rxnm', 't6rxnm1', 't6rxnw', 't6rxu1',
    't6rxu2', 't6rxu3', 't6rxu4', 't6rxu5', 't6sdose1', 't6sdose2', 't6sdose3', 't6sdose4', 't6sdose5', 't6sfreq1',
    't6sfreq2', 't6sfreq3', 't6sfreq4', 't6sfreq5', 't6use_1', 't6use_2', 't6use_3', 't6use_4', 't6use_5', 't6vertic',
    't7asacnt', 't7asmn', 't7asmn1', 't7asn', 't7asn_2', 't7asnc1', 't7asnc2', 't7asnc3', 't7asnc4', 't7asnc5',
    't7bgsfle', 't7bgsfls', 't7cmd', 't7cmk', 't7mdose1', 't7mdose2', 't7mdose3', 't7mdose4', 't7mdose5', 't7mfreq1',
    't7mfreq2', 't7mfreq3', 't7mfreq4', 't7mfreq5', 't7mna1', 't7mna2', 't7mna3', 't7mna4', 't7mna5', 't7mna6',
    't7mnq1', 't7mnq2', 't7mnq3', 't7mnq4', 't7mnq5', 't7mnq6', 't7otacnt', 't7otc1', 't7otc2', 't7otc3',
    't7otc4', 't7otc5', 't7otn1d', 't7otn1f', 't7otn1n', 't7otn2d', 't7otn2f', 't7otn2n', 't7otnm', 't7otnm1',
    't7otnw', 't7otu1', 't7otu2', 't7otu3', 't7otu4', 't7otu5', 't7qdan', 't7qdan_2', 't7rxacnt', 't7rxn1d',
    't7rxn1f', 't7rxn1n', 't7rxn2d', 't7rxn2f', 't7rxn2n', 't7rxnm', 't7rxnm1', 't7rxnw', 't7rxu1', 't7rxu2',
    't7rxu3', 't7rxu4', 't7rxu5', 't7sdose1', 't7sdose2', 't7sdose3', 't7sdose4', 't7sdose5', 't7sfreq1', 't7sfreq2',
    't7sfreq3', 't7sfreq4', 't7sfreq5', 't7use_1', 't7use_2', 't7use_3', 't7use_4', 't7use_5', 't7vertic', 't8asacnt',
    't8asmn', 't8asmn1', 't8asn', 't8asn_2', 't8asnc1', 't8asnc2', 't8asnc3', 't8asnc4', 't8asnc5', 't8cmd',
    't8cmk', 't8igtfle', 't8igtfls', 't8mdose1', 't8mdose2', 't8mdose3', 't8mdose4', 't8mdose5', 't8mfreq1', 't8mfreq2',
    't8mfreq3', 't8mfreq4', 't8mfreq5', 't8mna1', 't8mna2', 't8mna3', 't8mna4', 't8mna5', 't8mna6', 't8mnq1',
    't8mnq2', 't8mnq3', 't8mnq4', 't8mnq5', 't8mnq6', 't8otacnt', 't8otc1', 't8otc2', 't8otc3', 't8otc4',
    't8otc5', 't8otn1d', 't8otn1f', 't8otn1n', 't8otn2d', 't8otn2f', 't8otn2n', 't8otnm', 't8otnm1', 't8otnw',
    't8otu1', 't8otu2', 't8otu3', 't8otu4', 't8otu5', 't8qdan', 't8qdan_2', 't8rxacnt', 't8rxn1d', 't8rxn1f',
    't8rxn1n', 't8rxn2d', 't8rxn2f', 't8rxn2n', 't8rxnm', 't8rxnm1', 't8rxnw', 't8rxu1', 't8rxu2', 't8rxu3',
    't8rxu4', 't8rxu5', 't8sdose1', 't8sdose2', 't8sdose3', 't8sdose4', 't8sdose5', 't8sfreq1', 't8sfreq2', 't8sfreq3',
    't8sfreq4', 't8sfreq5', 't8use_1', 't8use_2', 't8use_3', 't8use_4', 't8use_5', 't8vertic', 't9asacnt', 't9asmn',
    't9asmn1', 't9asn', 't9asn_2', 't9asnc1', 't9asnc2', 't9asnc3', 't9asnc4', 't9asnc5', 't9cmd', 't9cmk',
    't9igtfle', 't9igtfls', 't9mdose1', 't9mdose2', 't9mdose3', 't9mdose4', 't9mdose5', 't9mfreq1', 't9mfreq2', 't9mfreq3',
    't9mfreq4', 't9mfreq5', 't9mna1', 't9mna2', 't9mna3', 't9mna4', 't9mna5', 't9mna6', 't9mnq1', 't9mnq2',
    't9mnq3', 't9mnq4', 't9mnq5', 't9mnq6', 't9otacnt', 't9otc1', 't9otc2', 't9otc3', 't9otc4', 't9otc5',
    't9otn1d', 't9otn1f', 't9otn1n', 't9otn2d', 't9otn2f', 't9otn2n', 't9otnm', 't9otnm1', 't9otnw', 't9otu1',
    't9otu2', 't9otu3', 't9otu4', 't9otu5', 't9qdan', 't9qdan_2', 't9rxacnt', 't9rxn1d', 't9rxn1f', 't9rxn1n',
    't9rxn2d', 't9rxn2f', 't9rxn2n', 't9rxnm', 't9rxnm1', 't9rxnw', 't9rxu1', 't9rxu2', 't9rxu3', 't9rxu4',
    't9rxu5', 't9sdose1', 't9sdose2', 't9sdose3', 't9sdose4', 't9sdose5', 't9sfreq1', 't9sfreq2', 't9sfreq3', 't9sfreq4',
    't9sfreq5', 't9use_1', 't9use_2', 't9use_3', 't9use_4', 't9use_5', 't9vertic'
]);

    for (let i = 0; i < SurveyParticipant.getDays(); ++i) {
      let startCol = `day_${i + 1}_${SurveyParticipant.getWeekDay(
        i
      )}_daily_survey_timestamp`;
      let endCol = `day_${i + 1}_${SurveyParticipant.getWeekDay(
        i
      )}_daily_survey_complete`;
      let startIndex = this.data.columns.indexOf(startCol);
      let endIndex = this.data.columns.indexOf(endCol);

      // Handle case where columns might not be found (new CSV format)
      if (startIndex === -1 || endIndex === -1) {
        // Try alternative approach: collect columns that start with t{i+1}
        let dayColumns = [];
        for (let j = 0; j < this.data.columns.length; ++j) {
          let col = this.data.columns[j];
          if (col.startsWith(`t${i + 1}`) && !col.includes('timestamp') && !col.includes('complete')) {
            dayColumns.push({index: j, name: col});
          }
        }
        if (dayColumns.length > 0) {
          dayStartEnd[i] = [dayColumns[0].index - 1, dayColumns[dayColumns.length - 1].index + 1];
        }
        continue;
      }

      dayStartEnd[i] = [startIndex, endIndex];
    }

    // loop through each day and fill in arrays based on day
    for (let i = 1; i <= SurveyParticipant.getDays(); ++i) {
      let startIndex = dayStartEnd[i - 1][0];
      let endIndex = dayStartEnd[i - 1][1];

      // Skip if indices are invalid
      if (startIndex === -1 || endIndex === -1) {
        continue;
      }

      const dayRowIdx = this.#rowMap[i - 1] !== undefined ? this.#rowMap[i - 1] : 0;

      for (let j = startIndex + 1; j < endIndex; ++j) {
        if (j < this.data.columns.length && j >= 0) {
          let currentColumn = this.data.columns[j];
          let value = "";
          if (this.data[currentColumn] && this.data[currentColumn].values) {
            const rawVal = this.data[currentColumn].values[dayRowIdx];
            value = (rawVal === 0 || rawVal === "0") ? "0" : (rawVal || "");
          }
          answerArray[i - 1].push(value);
          columnArray[i - 1].push(currentColumn);
        }
      }
    }

    // calculate daily percent
    for (let i = 0; i < SurveyParticipant.getDays(); ++i) {
      let answersToday = answerArray[i];
      let columnsToday = columnArray[i];

      if (answersToday.length === 0 || columnsToday.length === 0) {
        this.percentComplete[i] = 0;
        continue;
      }

      let rawArray = answersToday.map((_, index) => {
        return this.isCompleted(answersToday[index], columnsToday[index], i);
      });
      for (let j = 0; j < rawArray.length; ++j) {
        if (ignoreCols.has(columnsToday[j])) {
          rawArray[j] = 0;
        }
      }
      let numMissed = 0;
      let possTotal = 0;
      let incompletedQuestions = [];
      for (let j = 0; j < rawArray.length; ++j) {
        if (rawArray[j] === 2) {
          ++numMissed;
          incompletedQuestions.push(columnsToday[j].split("___")[0]);
        }
        if (rawArray[j] > 0) {
          ++possTotal;
        }
      }
      this.percentComplete[i] = possTotal > 0 ? (possTotal - numMissed) / possTotal : 0;
      console.log(`[DEBUG] Day ${i+1}: possTotal=${possTotal}, numMissed=${numMissed}, pct=${(this.percentComplete[i]*100).toFixed(2)}%`);
      console.log(`[DEBUG] Day ${i+1} missed cols:`, incompletedQuestions);
      for (let j = 0; j < incompletedQuestions.length; ++j) {
        try {
          // Safely get question text, handling cases where the field might not be in the data dictionary
          let questionText = this.dataDict.getQuestion(incompletedQuestions[j]);
          if (questionText) {
            this.missingQuestions[i].push(questionText);
          }
        } catch (e) {
          // If the question can't be found in the data dictionary, skip it
          // This can happen with new CSV format fields not yet in the dictionary
        }
      }
    }
  }

  /**
   * Determines if a field is completed based on the provided answer and field name.
   *
   * @param {any} ans - The answer provided for the field.
   * @param {string} field - The name of the field.
   * @return {number} Returns 0 if the field is not checked, 1 if the field is filled, and 2 if the field is not filled.
   */
  isCompleted(ans, field, dayIndex) {
    // 0 is not checked, 1 is filled, 2 is not filled
    if (field.includes("___")) {
      let fieldName = field.split("___")[0];
      // if field is branched and met, OR if field does not require branch
      if (
        !this.dataDict.isBranched(fieldName) ||
        (this.dataDict.isBranched(fieldName) && this.#branchMet(fieldName, dayIndex))
      ) {
        let dictPossVals = this.dataDict.getAnswers(fieldName);
        dictPossVals = Object.keys(dictPossVals);
        if (field !== `${fieldName}___${Math.max(...dictPossVals)}`) {
          return 0;
        } else {
          // check if any of field name has an answer
          for (let i = 0; i < dictPossVals.length; ++i) {
            let checkboxValue = this.#getValueForDay(`${fieldName}___${dictPossVals[i]}`, dayIndex);
            if (parseInt(checkboxValue) === 1) {
              // found an answer that was filled
              return 1;
            }
          }
          return 2;
        }
      }
    } else {
      let fieldName = field;
      if (!this.dataDict.exists(fieldName)) {
        return 0;
      }
      if (this.dataDict.isHidden(fieldName)) {
        return 0;
      }
      if (
        !this.dataDict.isBranched(fieldName) ||
        (this.dataDict.isBranched(fieldName) && this.#branchMet(fieldName, dayIndex))
      ) {
        if (ans === "") {
          return 2;
        } else {
          return 1;
        }
      }
    }
    return 0;
  }

  evaluateStrikes() {
    this.strikeArray.evaluateStrikes(this);
  }

  getValueForDay(columnName, dayIndex) {
    return this.#getValueForDay(columnName, dayIndex);
  }

  getStrikesForDay(day) {
    if (day > SurveyParticipant.getDays() || day < 0) {
      throw new Error("Invalid day");
    }
    return this.strikeArray.getStrikesForDay(day); // Delegate to Strikes class
  }

  #branchMet(varName, dayIndex) {
    let dictRef = this.dataDict.branchConditions(varName);
    for (let key in dictRef) {
      if (key.includes("(")) {
        continue;
      }
      let value = this.#getValueForDay(key, dayIndex !== undefined ? dayIndex : 0);
      if (parseInt(value) === parseInt(dictRef[key])) {
        return true;
      }
    }
    return false;
  }
}
