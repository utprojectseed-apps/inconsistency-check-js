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
        this.calculateAverageDigitSpanDays();
        this.calculateMaxDigitSpanDays();
        this.calculateMaxCorrectDigitSpanDays();
        this.countPracticeTrialsAmountDays();
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
                if (accuracyValues[j] === 'TRUE') { // TODO: make sure it is correct
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
}