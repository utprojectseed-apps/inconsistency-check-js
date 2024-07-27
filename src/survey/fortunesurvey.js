import * as dfd from 'danfojs';
// import { usePapaParse } from 'react-papaparse';
// import * as Papa from 'papaparse';
import data from './FortuneDataDict.csv'


export default class FortuneSurvey {

    constructor(data) {
        console.log("creating survey")
        this.data = data;
    }

    setData(data) {
        console.log(data)
        this.data = data
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
        console.log(df)
        this.df = df
    }
}