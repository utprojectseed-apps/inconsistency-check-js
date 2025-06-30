import DataDict from "./dataDict";
import Survey from "./survey";
import Mindmix2Form from "./Mindmix2DataDict.csv";

export default class Mindmix2Survey extends Survey {
  async readFortuneCSV() {
    this.dataDict = new DataDict();
    await this.dataDict.readDataDict(Mindmix2Form);
  }
}
