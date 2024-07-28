import SurveyParticipant from './surveyparticipant';
import DataDict from './dataDict';


export default class FortuneSurvey {

    constructor() {
        this.data = undefined
        this.participants = []
        this.selectedIds = []
        this.loadedIds = []
    }

    static stripTags(text) {
        return text.replace(/<[^>]*>/g, '')
    }

    setData(data) {
        this.data = data
    }

    setSelectedIds(ids) {
        this.selectedIds = ids
        for(let i = 0; i < ids.length; ++i) {
            if(!this.loadedIds.includes(ids[i])) {
                this.loadedIds.push(ids[i])
                this.participants.push(new SurveyParticipant(this.data.loc({ rows: this.data["participant_id"].eq(ids[i])}), this.dataDict))
            }
        }
    }

    getParticipantIds() {
        if (this.data === undefined) {
            return []
        }
        return this.data['participant_id'].values
    }

    getParticipants() {
        return this.participants
    }

    async readFortuneCSV() {
        this.dataDict = new DataDict()
        await this.dataDict.readFortuneCSV()
    }
}