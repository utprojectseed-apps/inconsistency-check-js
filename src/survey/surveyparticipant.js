export default class SurveyParticipant {

    constructor(data, dataDict) {
        this.data = data
        this.dataDict = dataDict
        this.setupCycles()
        this.percentComplete = Array(SurveyParticipant.getDays()).fill(0)
        this.missingQuestions = Array(SurveyParticipant.getDays()).fill().map(() => [])
        this.#findDailyPercent()
        this.#generateDates()
        this.#generateDays()
        this.#collectStartEndTimes()
        this.#collectSubmitTimes()
        this.estCompensation()
    }

    static getDays() {
        return 14
    }

    /**
     * Returns the day of the week corresponding to the given day number.
     *
     * @param {number} day - The day number (0-6, where 0 represents Monday).
     * @return {string} The day of the week corresponding to the given day number.
     */
    static getWeekDay(day) {
        let daysOfWeek = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
        return daysOfWeek[(day % 7)]
    }

    toString() {
        return this.getName() + " " + this.getParticipantId()
    }

    getName() {
        let firstName = "FIRST"
        let lastName = "LAST"
        if(this.data['tfirname'] !== undefined || this.data['tfirname'] !== null) {
            firstName = this.data['tfirname'].values[0].trim()
        }
        if (this.data['tlastname'] !== undefined || this.data['tlastname'] !== null) {
            lastName = this.data['tlasname'].values[0].trim()
        }
        return firstName + " " + lastName
    }

    getParticipantId() {
        return this.data['participant_id'].values[0]
    }

    getPercentComplete() {
        return this.percentComplete
    }

    getDate(day) {
        return this.dates[day]
    }

    static formatDate(date) {
        return date.getUTCFullYear() + "-" + 
            ("0" + (date.getUTCMonth() + 1)).slice(-2) + "-" + 
            ("0" + date.getUTCDate()).slice(-2)
    }

    #generateDates() {
        this.dates = Array(SurveyParticipant.getDays()).fill("")
        for (let i = 0; i < SurveyParticipant.getDays(); ++i) {
            let timestampCol = `day_${i + 1}_${SurveyParticipant.getWeekDay(i)}_daily_survey_timestamp`
            if(this.data[`t${i + 1}date`].values[0] !== "") {
                let date = new Date(this.data[`t${i + 1}date`].values[0]+"T00:00:00")
                this.dates[i] = SurveyParticipant.formatDate(date)
            } else if(this.data[timestampCol].values[0] !== "" && this.data[timestampCol].values[0] !== '[not completed]') {
                let date = new Date(this.data[timestampCol].values[0]+"T00:00:00")
                this.dates[i] = SurveyParticipant.formatDate(date)
            } else if(this.#cyclePassed(i)) {
                if(this.percentComplete[i] === 0) {
                    this.dates[i] = "Skipped"
                } else {
                    this.dates[i] = "Unanswered"
                }
            } else {
                this.dates[i] = "Not Started"
            }
        }
    }

    #generateDays() {
        this.days = Array(SurveyParticipant.getDays()).fill(0)
        this.days = this.days.map((_, i) => this.percentComplete[i] > 0)
        this.partialDays = this.days.map((_, i) => 0 < this.percentComplete[i] && this.percentComplete[i] < 0.5)
        this.lastFilledDay = -1
        this.days.forEach((val, i) => { if(val == true) { this.lastFilledDay = i } })
    }

    getLastFilledDay() {
        return this.lastFilledDay
    }

    getDay(day) {
        if(day > SurveyParticipant.getDays() || day < 0) {
            throw new Error("Invalid day")
        }
        let result = 0
        if(this.partialDays[day]) {
            result = 1
        } else if(this.days[day]) {
            result = 2
        }
        return result
    }

    setupCycles() {
        this.startDate = new Date(this.data['startdt'].values[0]+"T00:00:00")
        this.currCycle = 0
        this.userDate = new Date()
        let diff = Math.abs(this.startDate - this.userDate)
        let diffDays = Math.floor(diff / (1000 * 60 * 60 * 24))
        diffDays = Math.min(diffDays, SurveyParticipant.getDays())
        this.currCycle = diffDays
    }

    getCurrentCycle() {
        return this.currCycle
    }

    #cyclePassed(day) {
        return day < this.currCycle
    }

    #collectStartEndTimes() {
        this.timeStringArr = Array(SurveyParticipant.getDays()).fill("N/A")
        this.startTimeArr = Array(SurveyParticipant.getDays()).fill(undefined)
        this.endTimeArr = Array(SurveyParticipant.getDays()).fill(undefined)
        this.durStringArr = Array(SurveyParticipant.getDays()).fill("N/A")
        this.durationDeltas = Array(SurveyParticipant.getDays()).fill(0)

        for(let i = 0; i < SurveyParticipant.getDays(); ++i) {
            if(this.#cyclePassed(i)) {
                let startTimeCol = `t${i + 1}strti`
                let endTimeCol = `t${i + 1}endti`

                let startValue = this.data[`${startTimeCol}`].values[0]
                let endValue = this.data[`${endTimeCol}`].values[0]
                if(startValue == "" && endValue == "") {
                    this.timeStringArr[i] = "--:--"
                    continue
                }

                if(startValue !== "") {
                    let [hours, minutes] = startValue.split(":")
                    var start = new Date()
                    start.setHours(hours, minutes, 0, 0)
                    if(5 < start.getHours() && start.getHours() < 12) {
                        start.setHours(start.getHours() + 12)
                    } else if (12 <= start.getHours() && start.getHours() < 17) {
                        start.setHours(start.getHours() - 12)
                    }
                    this.timeStringArr[i] = start.getHours() + ":" + ("0" + start.getMinutes()).slice(-2)
                    this.startTimeArr[i] = start // TODO, may have a issue with the date being weird as it starts on user date not participant survey date
                }

                if(endValue !== "") {
                    let [hours, minutes] = endValue.split(":")
                    var end = new Date()
                    end.setHours(hours, minutes, 0, 0)
                    if(5 < end.getHours() && end.getHours() < 12) {
                        end.setHours(end.getHours() + 12)
                    } else if (12 <= end.getHours() && end.getHours() < 17) {
                        end.setHours(end.getHours() - 12)
                    }
                    if(startValue === "") {
                        this.timeStringArr[i] = end.getHours() + ":" + ("0" + end.getMinutes()).slice(-2)
                    }

                    if(startValue !== "") {
                        if (end < start) {
                            end.setDate(end.getDate() + 1)
                        }
                    }
                    this.endTimeArr[i] = end
                }

                if(startValue !== "" && endValue !== "") {
                    let duration = end - start // in ms
                    this.durationDeltas[i] = duration
                    
                    let durHour = Math.floor(duration / (1000 * 60 * 60))
                    let durMin = Math.floor(duration / (1000 * 60)) % 60

                    durHour = durHour < 10 ? "0"+durHour : durHour
                    durMin = durMin < 10 ? "0"+durMin : durMin
                    this.durStringArr[i] = `${durHour}:${durMin}`                  
                }
            }
        }
    }

    getDuration(day) {
        if(day > SurveyParticipant.getDays() || day < 0) {
            throw new Error("Invalid day")
        }
        return this.durStringArr[day]
    }

    #collectSubmitTimes() {
        this.submitTimes = Array(SurveyParticipant.getDays()).fill("--:--")
        for(let i = 0; i < SurveyParticipant.getDays(); ++i) {
            let timestampCol = `day_${i + 1}_${SurveyParticipant.getWeekDay(i)}_daily_survey_timestamp`
            let timestamp = this.data[`${timestampCol}`].values[0]
            if(timestamp !== "") {
                let [date, time] = timestamp.split(" ")
                let [hours, minutes, seconds] = time.split(":")
                let submitHour = parseInt(hours)
                if(isNaN(submitHour)) {
                    this.submitTimes[i] = "--:--"
                    continue
                } 
                this.submitTimes[i] = hours + ":" + minutes
            }
        }
    }

    getSubmitTime(day) {
        if(day > SurveyParticipant.getDays() || day < 0) {
            throw new Error("Invalid day")
        }
        return this.submitTimes[day]
    }

    estCompensation() {
        const BONUSES = [1, 2, 3, 0, 2, 3, 0, 1, 0, 1, 0, 2, 3, 4]
        const BONUS_TYPES = ['SINGLE', 'DOUBLE', 'SUPER', '', 'DOUBLE', 'SUPER', '', 'SINGLE', '', 'SINGLE', '', 'DOUBLE',
                      'SUPER', 'TRIPLE']
        const BASE_COMP = 2

        let compRates = Array(SurveyParticipant.getDays()).fill("")
        let cumulativeComp = Array(SurveyParticipant.getDays()).fill(0)
        let potentialCumComp = Array(SurveyParticipant.getDays()).fill(0)

        for (let i = 0; i < SurveyParticipant.getDays(); ++i) {
            if(this.percentComplete[i] > 0.35) {
                cumulativeComp[i] = BASE_COMP + BONUSES[i]
                compRates[i] = `$ ${cumulativeComp[i].toFixed(2)}`
            } else if(this.percentComplete[i] > 0) {
                cumulativeComp[i] = BASE_COMP
                compRates[i] = `$ ${cumulativeComp[i].toFixed(2)}`
            } // if 0 do not set anything.
        }

        for (let i = 1; i < SurveyParticipant.getDays(); ++i) {
            cumulativeComp[i] += cumulativeComp[i - 1]
        }

        for (let i = 0; i < SurveyParticipant.getDays(); ++i) {
            if(this.#cyclePassed(i)) {
                potentialCumComp[i] = cumulativeComp[i]
            } else {
                potentialCumComp[i] = cumulativeComp[i - 1] + BASE_COMP + BONUSES[i]
            }
        }

        this.compRates = compRates
        this.cumulativeComp = cumulativeComp
        this.potentialCumComp = potentialCumComp
        this.BONUS_TYPES = BONUS_TYPES
    }

    getCompRate(day) {
        if(day > SurveyParticipant.getDays() || day < 0) {
            throw new Error("Invalid day")
        }
        return this.compRates[day]
    }

    getCumulativeComp(day) {
        if(day > SurveyParticipant.getDays() || day < 0) {
            throw new Error("Invalid day")
        }
        return this.cumulativeComp[day]
    }

    getPotentialCumulativeComp(day) {
        if(day > SurveyParticipant.getDays() || day < 0) {
            throw new Error("Invalid day")
        }
        return this.potentialCumComp[day]
    }

    getBonusType(day) {
        if(day > SurveyParticipant.getDays() || day < 0) {
            throw new Error("Invalid day")
        }
        return this.BONUS_TYPES[day]
    }

    #findDailyPercent() {
        let answerArray = Array(SurveyParticipant.getDays()).fill().map(() => [])
        let columnArray = Array(SurveyParticipant.getDays()).fill().map(() => [])
        // find start and end of each day
        let dayStartEnd = []
        for(let i = 0; i < SurveyParticipant.getDays(); ++i) {
            if(!this.#cyclePassed(i)) {
                continue;
            }
            let startCol = `day_${i + 1}_${SurveyParticipant.getWeekDay(i)}_daily_survey_timestamp`
            let endCol = `day_${i + 1}_${SurveyParticipant.getWeekDay(i)}_daily_survey_complete`
            let startIndex = this.data.columns.indexOf(startCol)
            let endIndex = this.data.columns.indexOf(endCol)
            dayStartEnd.push([startIndex, endIndex])
        }
        // loop through each day and fill in arrays based on day
        for(let i = 1; i <= SurveyParticipant.getDays(); ++i) {
            if(!this.#cyclePassed(i - 1)) {
                continue;
            }
            let startIndex = dayStartEnd[i - 1][0]
            let endIndex = dayStartEnd[i - 1][1]
            for(let j = startIndex + 1; j < endIndex; ++j) {
                let currentColumn = this.data.columns[j]
                answerArray[i - 1].push(this.data[currentColumn].values[0])
                columnArray[i - 1].push(currentColumn)
            }
        }
  
        // calculate daily percent
        for(let i = 0; i < SurveyParticipant.getDays(); ++i) {
            if(!this.#cyclePassed(i)) {
                continue;
            }
            let answersToday = answerArray[i]
            let columnsToday = columnArray[i]
            let rawArray = answersToday.map((_, index) => {
                return this.isCompleted(answersToday[index], columnsToday[index])
            })
            let numMissed = 0
            let possTotal = 0
            let incompletedQuestions = []
            for (let j = 0; j < rawArray.length; ++j) {
                if (rawArray[j] === 2) {
                    ++numMissed
                    incompletedQuestions.push(columnsToday[j].split("___")[0])
                }
                if (rawArray[j] > 0) {
                    ++possTotal
                }
            }
            this.percentComplete[i] = (possTotal - numMissed) / possTotal
            for (let j = 0; j < incompletedQuestions.length; ++j) {
                this.missingQuestions[i].push(this.dataDict.getQuestion(incompletedQuestions[j]))
            }
            console.log(this.missingQuestions[i])
        }
    }

    /**
     * Determines if a field is completed based on the provided answer and field name.
     *
     * @param {any} ans - The answer provided for the field.
     * @param {string} field - The name of the field.
     * @return {number} Returns 0 if the field is not checked, 1 if the field is filled, and 2 if the field is not filled.
     */
    isCompleted(ans, field) {
        // 0 is not checked, 1 is filled, 2 is not filled
        if (field.includes("___")) {
            let fieldName = field.split("___")[0]
            // if field is branched and met, OR if field does not require branch
            if(!this.dataDict.isBranched(fieldName) || (this.dataDict.isBranched(fieldName) && this.#branchMet(fieldName))) {
                let dictPossVals = this.dataDict.getAnswers(fieldName)
                dictPossVals = Object.keys(dictPossVals)
                if(field !== `${fieldName}___${Math.max(...dictPossVals)}`) {
                    return 0
                } else { // check if any of field name has an answer
                    for(let i = 0; i < dictPossVals.length; ++i) {
                        if(parseInt(this.data[`${fieldName}___${dictPossVals[i]}`].values[0]) === 1) {
                            // found an answer that was filled
                            return 1
                        }
                    }
                    return 2
                }
            }
        } else {
            let fieldName = field
            if (this.dataDict.isHidden(fieldName)) {
                return 0
            }
            if (!this.dataDict.isBranched(fieldName) || (this.dataDict.isBranched(fieldName) && this.#branchMet(fieldName))) {
                if(ans === "") {
                    return 2
                } else {
                    return 1
                }
            }
        }
        return 0
    }


    #branchMet(varName) {
        let dictRef = this.dataDict.branchConditions(varName)
        for (let key in dictRef) {
            if (key.includes("(")) {
                continue;
            }
            if (parseInt(this.data[key].values[0]) === parseInt(dictRef[key])) {
                return true
            }
        }
        return false
    }

}