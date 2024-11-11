// import { SurveyParticipant } from "./surveyparticipant";

class Strikes {
   constructor(participant) {
    this.participant = participant; // Should be an instance of SurveyParticipant
    this.strikes = 0;
    this.maxStrikes = 3;
  }

  countStrikes() {
    if (this.__runConfig.weekdayToggle) { // change this if statement, copied from old
      this.maxStrikes = Math.max(...this.__totalStrikeCount['t'].filter((_, i) => this.toPrint.includes(i)));
    } else {
      this.maxStrikes = Math.max(...this.__totalStrikeCount['t'].slice(this.__iBegin, this.__iEnd + 1));
    }
    
  }

  // Count all the types of strikes
 // Dummy dedicated check functions
 dedicatedCheckA() {
  return ["A1", "A2", "A3"];
}
dedicatedCheckB() {
  return [["B1", "B2", "B3"], ["W1", "W2", "W3"]];
}
dedicatedCheckC() {
  return [["C1", "C2", "C3"], ["W1", "W2", "W3"]];
}
//... other check functions

collectStrikeData() {
  // Iterate through scenarios in runConfig.specScen
  for (let scenario of Object.keys(this.runConfig.specScen)) {
    if (!this.runConfig.specScen[scenario]) continue; // Skip if scenario is not enabled

    switch (scenario) {
      case 'A':
        const unansMarkdown = this.dedicatedCheckA();
        this.totalMarkdown = this.totalMarkdown.map(
          (item, i) => `${item}${unansMarkdown[i] || ""}`
        );
        break;

      case 'B':
        const [durMarkdown, durWarn] = this.dedicatedCheckB();
        this.totalMarkdown = this.totalMarkdown.map(
          (item, i) => `${item}${durMarkdown[i] || ""}${durWarn[i] || ""}`
        );
        break;

      case 'C':
        const [timeMarkdown, timeWarn] = this.dedicatedCheckC();
        this.totalMarkdown = this.totalMarkdown.map(
          (item, i) => `${item}${timeMarkdown[i] || ""}${timeWarn[i] || ""}`
        );
        break;

      case 'D':
        const [doweeMarkdown, doweeWarn] = this.dedicatedCheckD();
        this.totalMarkdown = this.totalMarkdown.map(
          (item, i) => `${item}${doweeMarkdown[i] || ""}${doweeWarn[i] || ""}`
        );
        break;

      case 'E':
        const covidMarkdown = this.dedicatedCheckE();
        this.totalMarkdown = this.totalMarkdown.map(
          (item, i) => `${item}${covidMarkdown[i] || ""}`
        );
        break;

      case 'FG':
        const sect12Markdown = this.dedicatedCheckFG();
        this.totalMarkdown = this.totalMarkdown.map(
          (item, i) => `${item}${sect12Markdown[i] || ""}`
        );
        break;

      case 'J':
        const sexoMarkdown = this.dedicatedCheckJ();
        this.totalMarkdown = this.totalMarkdown.map(
          (item, i) => `${item}${sexoMarkdown[i] || ""}`
        );
        break;

      case 'H':
        const [hDurMarkdown, hDurWarn] = this.dedicatedCheckH();
        this.totalMarkdown = this.totalMarkdown.map(
          (item, i) => `${item}${hDurMarkdown[i] || ""}${hDurWarn[i] || ""}`
        );
        break;

      case 'K':
        const [bedMarkdown, bedWarn] = this.dedicatedCheckK();
        this.totalMarkdown = this.totalMarkdown.map(
          (item, i) => `${item}${bedMarkdown[i] || ""}${bedWarn[i] || ""}`
        );
        break;

      default:
        console.log(`Unknown scenario: ${scenario}`);
        break;
    }
  }
}
// refDict = {
//   "A": "(A.) Large portion of unanswered questions",
//   "B": "(B.) Duration length (&lt; 3 min)",
//   "C": "(C.) Survey Taken Before 8 P.M.",
//   "D": "(D.) Day of the Week Question",
//   "E": "(E.) COVID Vaccine Question",
//   "F": f"(F.) Inconsistent Answers for Sections {sections}",
//   "G": f"(G.) Inconsistent Answers for Sections {sections}",
//   "H": "(H.) Duration length (&gt; 45 min)",
//   "J": "(J.) Inconsistent Answers for Sex Question",
//   "K": "(K.) Lights off time 2 hours after survey submission time"
// }