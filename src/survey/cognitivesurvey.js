import DataDict from './dataDict';
import Survey from './survey';
import CognitiveForm from './CognitiveDataDict.csv'


export default class CognitiveSurvey extends Survey{

    async readFortuneCSV() {
        this.dataDict = new DataDict()
        await this.dataDict.readDataDict(CognitiveForm)
    }
}