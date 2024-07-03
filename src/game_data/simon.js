import Game from "./game";
import * as dfd from 'danfojs';
// todo need to remove console.log code bits everywhere
// todo also make the stuff more similar - clean up code later
// reminder to move the 
export default class Simon extends Game {
    constructor(data, participant_id) {
        super(data);
        this.participant_id = participant_id;
        this.meanSessionsAccuracys = Array(Game.TotalDays).fill().map(() => []);
        this.practiceTrialsAmount = Array(Game.TotalDays).fill().map(() => []);
        this.practiceTrialsAccuracys = Array(Game.TotalDays).fill().map(() => []);
        this.noInputTrialsDays = Array(Game.TotalDays).fill().map(() => []);
        this.calculateCompletionsDays();
        this.calculateSessionAccuracyDays();
        this.countPracticeTrialsAmountDays();
        this.calculatePracticeTrialsAccuracys();
        this.countNoInputTrialsDays();
    }

    calculateCompletionsDays() {
        this.completionsDays = Array(Game.TotalDays).fill(0.0);
        this.count = Array(Game.TotalDays).fill(0);
        for (let i = 0; i < Game.TotalDays; ++i) {
            //in case there are multiple sessions //TODO fix multiple sessions by removing it from df? or can find a way to display all?
            let df = this.days[i];
            let sessions = new dfd.Series(df['session_uuid'].values).unique().values;
            this.completionsDays[i] = 0.0; // need to figure this out later - to tired for this jank
            this.numberSessionsDays[i] = sessions.length;

            for(let j = 0; j < sessions.length; ++j) {
                let session = sessions[j]
                let sess_df = df.loc({rows: df['session_uuid'].eq(session)});

                let testing_df = sess_df.loc({rows: sess_df['task_section'].eq('test')});
                let count = testing_df.shape[0];    

                // TODO probably add constants for the number of trials
                let completionRate = (count / 32 * 100).toFixed(2);
                if(completionRate > this.completionsDays[i]) {
                    this.completionsDays[i] = completionRate;
                    this.count[i] = count; // conatins the number of test trials & do we need this?
                    this.days[i] = sess_df; // both test and practice
                }
            }
        }
    }

    calculateSessionAccuracyDays() {
        for (let i = 0; i < Game.TotalDays; ++i) {
            let df = this.days[i];
            let testing_df = df.loc({rows: df['task_section'].eq('test')});

            let numTrials = testing_df.shape[0] !== 0 ? testing_df.shape[0] : 32;
            let accuracyValues = testing_df['Slide1.ACC'].values;
            let count = 0.0;

            for (let j = 0; j < accuracyValues.length; ++j) {
                if (accuracyValues[j] === 'TRUE') {
                    count++;
                }
            }
            let accuracy = (count/numTrials * 100).toFixed(2);
            this.meanSessionsAccuracys[i] = accuracyValues.length !== 0 ? accuracy : 0;
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
            let accuracyValues = practice_df['Slide1.ACC'].values;

            let count = 0.0;
            for (let j = 0; j < accuracyValues.length; ++j) {
                if (accuracyValues[j] === 'TRUE') {
                    count++;
                }
            }

            this.practiceTrialsAccuracys[i] = accuracyValues.length === 0 ? 0 : (count / practice_df.shape[0] * 100).toFixed(2);
        }
    }

    countNoInputTrialsDays() {
        for (let i = 0; i < Game.TotalDays; ++i) {
            let df = this.days[i]; // how did you know i needed this AI????? -.- sus
            // neeed to get only the test trials
            let testing_df = df.loc({rows: df['task_section'].eq('test')});
            let noInput_df = testing_df.loc({rows: testing_df['Slide1.RESP'].eq('none')});
            let noInputString = noInput_df.shape[0] + " out of " + testing_df.shape[0];
            this.noInputTrialsDays[i] = noInputString;
        }
    }

    getSessionAccuracyDays() {
        return this.meanSessionsAccuracys;
    }

    getPracticeTrialsAmountDays() {
        return this.practiceTrialsAmount;
    }

    getPracticeTrialsAccuracyDays() {
        return this.practiceTrialsAccuracys;
    }

    getNoInputTrialsDays() {
        return this.noInputTrialsDays;
    }
}