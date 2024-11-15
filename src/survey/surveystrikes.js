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

  // add a strike for large portion of unanswered questions
  addStrikeA(day) {
    this.strikeArray[0].push(day);
  }

  // add a strike for duration length < 3 min
  addStrikeB(day) {
    this.strikeArray[1].push(day);
  }

  // add a strike for survey taken before 8 P.M.
  addStrikeC(day) {
    this.strikeArray[2].push(day);
  }

  // add a strike for day of the week question
  addStrikeD(day) {
    this.strikeArray[3].push(day);
  }

  // add a strike for COVID vaccine question
  addStrikeE(day) {
    this.strikeArray[4].push(day);
  }

  // add a strike for inconsistent answers for sections {sections}
  addStrikeF(day) {
    this.strikeArray[5].push(day);
  }

  // add a strike for inconsistent answers for sections {sections}
  addStrikeG(day) {
    this.strikeArray[5].push(day);
  }

  // add a strike for duration length > 45 min
  addStrikeH(day) {
    this.strikeArray[6].push(day);
  }

  // add a strike for inconsistent answers
  addStrikeJ(day) {
    this.strikeArray[7].push(day);
  }

  // add a strike for lights off time 2 hours after survey submission time
  addStrikeK(day) {
    this.strikeArray[8].push(day);
  }

  
}
