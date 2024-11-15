class Strikes {
  constructor() {
    // 9 types of strikes. append each day number to the corresponding strike type
    this.strikeArray = Array.from({ length: 9 }, () => []);
  }

  // enum for strike types - might not needed but made it anyway
  static StrikeType(key) {
    const StrikeMapping = {
      A: 0, // Large portion of unanswered questions
      B: 1, // Duration length (< 3 min)
      C: 2, // Survey Taken Before 8 P.M.
      D: 3, // Day of the Week Question
      E: 4, // COVID Vaccine Question
      F: 5, // Inconsistent Answers for Sections {sections}
      G: 5, // Inconsistent Answers for Sections {sections}
      H: 6, // Duration length (> 45 min)
      J: 7, // Inconsistent
      K: 8, // Lights off time 2 hours after survey submission time
    };
    return StrikeMapping[key];
  }

  CountStrikes() {
    var totalStrikes = 0;
    for (let i = 0; i < 7; i++) {
      totalStrikes += this.strikeArray[i].length; // count the number of strikes for each day
    }
    return totalStrikes;
  }

  addStrikeA(day) {
    this.strikeArray[0].push(day);
  }

  addStrikeB(day) {
    this.strikeArray[1].push(day);
  }

  addStrikeC(day) {
    this.strikeArray[2].push(day);
  }

  addStrikeD(day) {
    this.strikeArray[3].push(day);
  }

  addStrikeE(day) {
    this.strikeArray[4].push(day);
  }

  addStrikeF(day) {
    this.strikeArray[5].push(day);
  }

  addStrikeG(day) {
    this.strikeArray[5].push(day);
  }

  addStrikeH(day) {
    this.strikeArray[6].push(day);
  }

  addStrikeJ(day) {
    this.strikeArray[7].push(day);
  }

  addStrikeK(day) {
    this.strikeArray[8].push(day);
  }

  // ripped from old code
  // collectStrikeData() {
  //   // Iterate through scenarios in runConfig.specScen
  //   for (let scenario of Object.keys(this.runConfig.specScen)) {
  //     if (!this.runConfig.specScen[scenario]) continue; // Skip if scenario is not enabled

  //     switch (scenario) {
  //       case "A":
  //         const unansMarkdown = this.dedicatedCheckA();
  //         this.totalMarkdown = this.totalMarkdown.map(
  //           (item, i) => `${item}${unansMarkdown[i] || ""}`
  //         );
  //         break;

  //       case "B":
  //         const [durMarkdown, durWarn] = this.dedicatedCheckB();
  //         this.totalMarkdown = this.totalMarkdown.map(
  //           (item, i) => `${item}${durMarkdown[i] || ""}${durWarn[i] || ""}`
  //         );
  //         break;

  //       case "C":
  //         const [timeMarkdown, timeWarn] = this.dedicatedCheckC();
  //         this.totalMarkdown = this.totalMarkdown.map(
  //           (item, i) => `${item}${timeMarkdown[i] || ""}${timeWarn[i] || ""}`
  //         );
  //         break;

  //       case "D":
  //         const [doweeMarkdown, doweeWarn] = this.dedicatedCheckD();
  //         this.totalMarkdown = this.totalMarkdown.map(
  //           (item, i) => `${item}${doweeMarkdown[i] || ""}${doweeWarn[i] || ""}`
  //         );
  //         break;

  //       case "E":
  //         const covidMarkdown = this.dedicatedCheckE();
  //         this.totalMarkdown = this.totalMarkdown.map(
  //           (item, i) => `${item}${covidMarkdown[i] || ""}`
  //         );
  //         break;

  //       case "FG":
  //         const sect12Markdown = this.dedicatedCheckFG();
  //         this.totalMarkdown = this.totalMarkdown.map(
  //           (item, i) => `${item}${sect12Markdown[i] || ""}`
  //         );
  //         break;

  //       case "J":
  //         const sexoMarkdown = this.dedicatedCheckJ();
  //         this.totalMarkdown = this.totalMarkdown.map(
  //           (item, i) => `${item}${sexoMarkdown[i] || ""}`
  //         );
  //         break;

  //       case "H":
  //         const [hDurMarkdown, hDurWarn] = this.dedicatedCheckH();
  //         this.totalMarkdown = this.totalMarkdown.map(
  //           (item, i) => `${item}${hDurMarkdown[i] || ""}${hDurWarn[i] || ""}`
  //         );
  //         break;

  //       case "K":
  //         const [bedMarkdown, bedWarn] = this.dedicatedCheckK();
  //         this.totalMarkdown = this.totalMarkdown.map(
  //           (item, i) => `${item}${bedMarkdown[i] || ""}${bedWarn[i] || ""}`
  //         );
  //         break;

  //       default:
  //         console.log(`Unknown scenario: ${scenario}`);
  //         break;
  //     }
  //   }
  // }
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
}
