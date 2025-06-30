import DataDict from "./dataDict";
import Survey from "./survey";
import Mindmix1Form from "./Mindmix1DataDict.csv";

export default class Mindmix1Survey extends Survey {
  async readFortuneCSV() {
    this.dataDict = new DataDict();
    await this.dataDict.readDataDict(Mindmix1Form);
  }
}
