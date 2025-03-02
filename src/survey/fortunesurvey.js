import DataDict from './dataDict';
import Survey from './survey';
import FortuneForm from './FortuneDataDict.csv'


export default class FortuneSurvey extends Survey{

    async readFortuneCSV() {
        this.dataDict = new DataDict()
        await this.dataDict.readDataDict(FortuneForm)
    }
}