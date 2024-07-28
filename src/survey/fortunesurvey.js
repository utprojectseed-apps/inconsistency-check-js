import SurveyParticipant from './surveyparticipant';
import DataDict from './dataDict';


export default class FortuneSurvey {

    constructor(data) {
        this.data = data;
        this.participants = []
    }

    static stripTags(text) {
        return text.replace(/<[^>]*>/g, '')
    }

    setData(data) {
        this.data = data
        for (let i = 0; i < data['participant_id'].values.length; ++i) {
            let currentParticipant = data['participant_id'].values[i]
            if (currentParticipant === undefined || currentParticipant === null || currentParticipant === '') {
                continue
            }
            this.participants.push(new SurveyParticipant(data.loc({ rows: this.data["participant_id"].eq(currentParticipant)})))
        }
        for (let i = 0; i < this.participants.length; ++i) {
            console.log(this.participants[i].toString())
        }
    }

    async readFortuneCSV() {
        this.dataDict = new DataDict()
        await this.dataDict.readFortuneCSV()
    }
}