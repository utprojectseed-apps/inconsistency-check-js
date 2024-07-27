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

    getQuestion(varName) {
        let index = this.df['Variable / Field Name'].values.indexOf(varName)
        // console.log(this.df)
        let question = this.df['Field Label'].values[index]
        let questionSplit = question.split("\n")
        for (let i = 0; i < questionSplit.length; ++i) {
            questionSplit[i] = questionSplit[i].replace(/<[^>]*>/g, '') // remove < > and text between them
            questionSplit[i] = questionSplit[i].trim()
        }
        questionSplit = questionSplit.filter(str => str !== '')
        // if questionSplit is still size 1, it is a one liner like Hour/Hora or t1act3h
        // need to split along the / except for the AM/PM
        if (questionSplit.length === 1 && !questionSplit[0].includes("AM")) {
            questionSplit = questionSplit[0].split("/")
        } else if (questionSplit.length === 1 && questionSplit[0].includes("AM")) {
            questionSplit = [questionSplit[0], questionSplit[0]]
        }

        let questionResult = {
            eng: [],
            span: []
        }
        // if questionSplit size is > 2, then it is alternating english and spanish
        for (let i = 0; i < questionSplit.length; i += 2) {
            questionResult.eng.push(questionSplit[i])
            questionResult.span.push(questionSplit[i + 1])
        }

        return questionResult
    }
}