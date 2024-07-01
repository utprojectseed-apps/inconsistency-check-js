import Game from "./game";
import * as dfd from 'danfojs';

export default class BDS extends Game {
    constructor(data, participant_id) {
        super(data);
        this.participant_id = participant_id
        this.calculateCompletionsDays()
        this.averageDigitSpanDays = Array(Game.TotalDays).fill().map(() => []);
        this.maxDigitSpanDays = Array(Game.TotalDays).fill().map(() => []);
        this.maxCorrectDigitSpanDays = Array(Game.TotalDays).fill().map(() => []);
        this.practiceTrialsAmount = Array(Game.TotalDays).fill().map(() => []);
        this.practiceTrialsAccuracys = Array(Game.TotalDays).fill().map(() => []);
        this.meanSessionsAccuracys = Array(Game.TotalDays).fill().map(() => []);
        this.calculateSessionAccuracyDays();
        this.calculateAverageDigitSpanDays();
        this.calculateMaxDigitSpanDays();
        this.calculateMaxCorrectDigitSpanDays();
        this.countPracticeTrialsAmountDays();
        this.calculatePracticeTrialsAccuracys();
    }

    calculateCompletionsDays() {
        this.count = Array(Game.TotalDays).fill(0);
        for (let i = 0; i < Game.TotalDays; ++i) {
            //in case there are multiple sessions //TODO fix multiple sessions by removing it from df? or can find a way to display all?
            let df = this.days[i];
            let sessions = new dfd.Series(df['session_uuid'].values).unique().values;
            this.completionsDays[i] = 0;
            this.numberSessionsDays[i] = sessions.length;

            for(let j = 0; j < sessions.length; ++j) {
                let session = sessions[j];
                let sess_df = df.loc({rows: df['session_uuid'].eq(session)});

                let testing_df = sess_df.loc({rows: sess_df['task_section'].eq('test')});
                let count = testing_df.shape[0];

                let completionRate = (count/12 * 100).toFixed(2)
                if(completionRate > this.completionsDays[i]) {
                    this.completionsDays[i] = completionRate;
                    this.count[i] = count; // conatins the number of test trials 
                    this.days[i] = sess_df;
                }
            }
        }   
    }

    calculateSessionAccuracyDays() {
        for (let i = 0; i < Game.TotalDays; ++i) {
            let df = this.days[i];
            let testing_df = df.loc({rows: df['task_section'].eq('test')});

            let numTrials = testing_df.shape[0] !== 0 ? testing_df.shape[0] : 12;
            let accuracyValues = testing_df['accuracy'].values;
            let count = 0.0;

            for (let j = 0; j < accuracyValues.length; ++j) {
                if (accuracyValues[j] === 'TRUE') {
                    count++;
                }
            } 
            this.meanSessionsAccuracys[i] = accuracyValues.length === 0 ? 0 : (count / numTrials * 100).toFixed(2);
        }
    }

    calculateAverageDigitSpanDays() {
        for (let i = 0; i < Game.TotalDays; ++i) {
            let df = this.days[i];
            let testing_df = df.loc({rows: df['task_section'].eq('test')});

            let numTrials = 12;
            if (testing_df.shape[0] !== 0) {
                numTrials = testing_df.shape[0];
            }

            let sumLengths = 0;
            let listValues = testing_df['List'].values;
            for (let j = 0; j < listValues.length; ++j) {
                sumLengths += parseFloat(listValues[j]);
            }

            let avgLength = testing_df.shape[0] !== 0 ? (sumLengths / numTrials).toFixed(2) : sumLengths > 0 ? sumLengths / numTrials : 0;
            this.averageDigitSpanDays[i] = avgLength;
        }
    }

    calculateMaxDigitSpanDays() {
        for (let i = 0; i < Game.TotalDays; ++i) {
            let df = this.days[i];
            let testing_df = df.loc({rows: df['task_section'].eq('test')});

            // now we need to loop thru the testing_df
            let maxSpan = 0;
            let listValues = testing_df['List'].values;
            for (let j = 0; j < listValues.length; ++j) {
                let currSpan = parseInt(listValues[j]);
                if (currSpan > maxSpan) {
                    maxSpan = currSpan;
                }
            }
            this.maxDigitSpanDays[i] = maxSpan;
        }
    }

    calculateMaxCorrectDigitSpanDays() {
        for (let i = 0; i < Game.TotalDays; ++i) {
            let day = this.days[i];
            let testing_df = day.loc({rows: day['task_section'].eq('test')});

            let maxCorrectSpan = 0;
            let listValues = testing_df['List'].values;
            let accuracyValues = testing_df['accuracy'].values;
            for (let j = 0; j < listValues.length; ++j) {
                if (accuracyValues[j] === 'True') { // TODO: make sure it is correct
                    let currSpan = parseInt(listValues[j]);
                    if (currSpan > maxCorrectSpan) {
                        maxCorrectSpan = currSpan;
                    }
                }
            }
            this.maxCorrectDigitSpanDays[i] = maxCorrectSpan;
        }     
    }

    countPracticeTrialsAmountDays() {
        for (let i = 0; i < Game.TotalDays; ++i) {
            let df = this.days[i];
            this.practiceTrialsAmount[i] = 0;
            let practice_df = df.loc({rows: df['task_section'].eq('training')});
            let practiceTrials = practice_df.shape[0];
            this.practiceTrialsAmount[i] = practiceTrials;
        }
    }

    calculatePracticeTrialsAccuracys() {
        for (let i = 0; i < Game.TotalDays; ++i) {
            let df = this.days[i];
            let practice_df = df.loc({rows: df['task_section'].eq('training')});
            let accuracyValues = practice_df['accuracy'].values;
            let count = 0.0;

            for (let j = 0; j < accuracyValues.length; ++j) {
                if (accuracyValues[j] === 'TRUE') {
                    count++;
                }
            }
            this.practiceTrialsAccuracys[i] = accuracyValues.length === 0 ? 0 : (count / practice_df.shape[0] * 100).toFixed(2);
        }
    } 

    getHighlights() {
        let longestMaxCorrect = Math.max(...this.maxCorrectDigitSpanDays);
        let countNotZero = this.maxCorrectDigitSpanDays.reduce((count, span) => span === 0 ? count : count + 1, 0);
        let sumOfMaxCorrects = this.maxCorrectDigitSpanDays.reduce((sum, maxCorrectSpan) => sum + maxCorrectSpan, 0);
        let averageMaxCorrect = sumOfMaxCorrects / countNotZero;
        let longestMaxCorrectHighlight = "Your longest correct digit span was " + longestMaxCorrect + " digits.";
        let averageMaxCorrectRounded = Math.round(averageMaxCorrect * 100) / 100;
        let averageMaxCorrectHighlight = "Your average correct digit span was " + averageMaxCorrectRounded.toFixed(2) + " digits.";
        return [longestMaxCorrectHighlight, averageMaxCorrectHighlight];
    }

    getSessionAccuracyDays() {
        return this.meanSessionsAccuracys;
    }

    getAverageDigitSpanDays() {
        return this.averageDigitSpanDays;
    }

    getMaxDigitSpanDays() {
        return this.maxDigitSpanDays;
    }

    getMaxCorrectDigitSpanDays() {
        return this.maxCorrectDigitSpanDays;
    }

    getPracticrlTrialsAmountDays() {
        return this.practiceTrialsAmount;
    }

    getPracticeTrialsAccuracyDays() {
        return this.practiceTrialsAccuracys;
    }
}