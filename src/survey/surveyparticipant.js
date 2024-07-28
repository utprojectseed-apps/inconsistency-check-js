export default class SurveyParticipant {

    constructor(data, dataDict) {
        this.data = data
        this.dataDict = dataDict
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
        this.#findDailyPercent()
        return firstName + " " + lastName + " " + this.getParticipantId()
    }

    getParticipantId() {
        return this.data['participant_id'].values[0]
    }

    #findDailyPercent() {
        console.log(this.#branchMet('t1cvib01'))
        // console.log(this.data.values)
        // console.log(this.data.columns)
    }

    #branchMet(varName) {
        let dictRef = this.dataDict.branchConditions(varName)
        for (let key in dictRef) {
            if (parseInt(this.data[key].values[0]) === parseInt(dictRef[key])) {
                return true
            }
        }
        return false
    }

}