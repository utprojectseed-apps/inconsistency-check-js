import * as dfd from 'danfojs';
// import { usePapaParse } from 'react-papaparse';
// import * as Papa from 'papaparse';
import data from './FortuneDataDict.csv'
import SurveyParticipant from './surveyparticipant';


export default class FortuneSurvey {

    constructor(data) {
        this.data = data;
        this.participants = []
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
    }

    async readFortuneCSV() {
        let config = {
            header: true,
        }
        let df = await dfd.readCSV(data, config)
            .then(df => {
                return df
            }).catch(err => {
                console.log(err)
            })
        this.df = df
    }
}