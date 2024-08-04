export default class SurveyParticipant {

    constructor(data, dataDict) {
        this.data = data
        this.dataDict = dataDict
        this.percentComplete = Array(SurveyParticipant.getDays()).fill(0)
        this.#findDailyPercent()
    }

    static getDays() {
        return 14
    }

    toString() {
        let firstName = "FIRST"
        let lastName = "LAST"
        if(this.data['tfirname'] !== undefined || this.data['tfirname'] !== null) {
            firstName = this.data['tfirname'].values[0].trim()
        }
        if (this.data['tlastname'] !== undefined || this.data['tlastname'] !== null) {
            lastName = this.data['tlasname'].values[0].trim()
        }
        return firstName + " " + lastName + " " + this.getParticipantId()
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

    #findDailyPercent() {
        let answerArray = Array(SurveyParticipant.getDays()).fill().map(() => [])
        let columnArray = Array(SurveyParticipant.getDays()).fill().map(() => [])
        // find start and end of each day
        let dayStartEnd = []
        let days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        for(let i = 1; i <= SurveyParticipant.getDays(); ++i) {
            let startCol = `day_${i}_${days[(i - 1) % 7]}_daily_survey_timestamp`
            let endCol = `day_${i}_${days[(i - 1) % 7]}_daily_survey_complete`
            let startIndex = this.data.columns.indexOf(startCol)
            let endIndex = this.data.columns.indexOf(endCol)
            dayStartEnd.push([startIndex, endIndex])
        }
        // loop through each day and fill in arrays based on day
        for(let i = 1; i <= SurveyParticipant.getDays(); ++i) {
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
            let answersToday = answerArray[i]
            let columnsToday = columnArray[i]
            let rawArray = answersToday.map((_, index) => {
                return this.isCompleted(answersToday[index], columnsToday[index])
            })
            let possTotal = rawArray.filter(num => num > 0).length
            let numMissed = rawArray.filter(num => num === 2).length
            //TODO save missed questions for display

            this.percentComplete[i] = (possTotal - numMissed) / possTotal
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