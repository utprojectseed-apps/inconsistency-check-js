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
    return value || "";
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
        let date = new Date(dateValue + "T00:00:00");
        this.dates[i] = SurveyParticipant.formatDate(date);
      } else {
        // Fall back to timestamp column
        let timestampValue = this.#getValueForDay(timestampCol, i);
        if (timestampValue !== "" && timestampValue !== "[not completed]") {
          let date = new Date(timestampValue + "T00:00:00");
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
            value = this.data[currentColumn].values[dayRowIdx] || "";
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
