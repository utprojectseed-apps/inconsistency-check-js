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

    static stripTags(text) {
        return text.replace(/<[^>]*>/g, '')
    }

    setData(data) {
        console.log(this.branchConditions('t1mint'))
        console.log(this.branchConditions('t1qsexo'))
        console.log(this.branchConditions('t1pbar1'))
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
            questionSplit[i] = FortuneSurvey.stripTags(questionSplit[i]) // remove < > and text between them
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

    getAnswers(varName) {
        let index = this.df['Variable / Field Name'].values.indexOf(varName)
        let answers = this.df['Choices, Calculations, OR Slider Labels'].values[index]
        if (answers === undefined || answers === null) {
            return {}
        }
        answers = FortuneSurvey.stripTags(answers) // remove < > and text between them
        answers = answers.trim()
        let splitAnswers = answers.split("|")
        let resultDict = {}
        for (let i = 0; i < splitAnswers.length; ++i) {
            let currentAnswer = splitAnswers[i]
            currentAnswer = currentAnswer.trim()
            let splitCurrent = currentAnswer.split(",")
            for(let j = 0; j < splitCurrent.length; ++j) {
                splitCurrent[j] = splitCurrent[j].trim()
            }
            resultDict[splitCurrent[0]] = splitCurrent[1]
        }
        return resultDict
    }

    isBranched(varName) {
        let index = this.df['Variable / Field Name'].values.indexOf(varName)
        let branch = this.df['Branching Logic (Show field only if...)'].values[index]
        return branch !== null && branch !== undefined
    }

    isHidden(varName) {
        let index = this.df['Variable / Field Name'].values.indexOf(varName)
        let annotations = this.df['Field Annotation'].values[index]
        if(annotations === null || annotations === undefined) {
            return false
        }
        return annotations.includes("@HIDDEN")
    }

    branchConditions(varName) {
        console.log("starting " + varName)
        let index = this.df['Variable / Field Name'].values.indexOf(varName)
        let branch = this.df['Branching Logic (Show field only if...)'].values[index]
        if(branch === null || branch === undefined) {
            return {}
        }
        let conditions = branch.split("or")
        let resultDict = {}
        for(let i = 0; i < conditions.length; ++i) {
            let condition = conditions[i]
            condition = condition.trim()
            let currentCondition = condition.match(/\[(.*?)\]/)[1];
            let afterBracket = condition.split("]")[1]
            console.log(afterBracket)
            if(afterBracket.includes("=")) {
                afterBracket = afterBracket.replace(/['"=]/g, '') // removes ', ", =
                resultDict[currentCondition] = parseInt(afterBracket)
            } else {
                resultDict[currentCondition] = "<>"
            }
            console.log(condition)
        }
        return resultDict
    }
}