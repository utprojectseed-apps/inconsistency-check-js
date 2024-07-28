export default class SurveyParticipant {

    constructor(data) {
        this.data = data
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
        return firstName + " " + lastName + " " + this.data['participant_id'].values[0]
    }

}