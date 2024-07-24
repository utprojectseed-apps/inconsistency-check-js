import Game from "./game";
import * as dfd from 'danfojs';

// TODO rename to color-shape

export default class ColorShape extends Game {
    constructor(data, participant_id) {
        super(data);

        this.participant_id = participant_id
        this.meanSessionsAccuracys = Array(Game.TotalDays).fill().map(() => []);
        this.meanReactionTime = Array(Game.TotalDays).fill().map(() => []);
        this.practiceTrialsAmount = Array(Game.TotalDays).fill().map(() => []);
        this.practiceTrialsAccuracys = Array(Game.TotalDays).fill().map(() => []);
        this.noInputTrialsDays = Array(Game.TotalDays).fill().map(() => []);

        this.calculateSessionAccuracyDays();
        this.calculateMeanReactionTime()
        this.countPracticeTrialsAmountDays();
        this.calculatePracticeTrialsAccuracys();
        this.countNoInputTrialsDays();
        this.getHighlights();
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

                let completionRate = (count / 33 * 100).toFixed(2)
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

            let numTrials = testing_df.shape[0] !== 0 ? testing_df.shape[0] : 33;
            let accuracyValues = testing_df['CriticalSlide.ACC'].values;
            
            let count = 0.0;
            for (let j = 0; j < accuracyValues.length; ++j) {
                if (accuracyValues[j] === 'True') { // need to check 
                    count++;
                }
            } 
            this.meanSessionsAccuracys[i] = accuracyValues.length === 0 ? 0 : (count / numTrials * 100).toFixed(2);
        }
    }

    calculateMeanReactionTime() {
        for (let i = 0; i < Game.TotalDays; ++i) {
            let df = this.days[i];
            let testing_df = df.loc({rows: df['task_section'].eq('test')});
            let reactionTimes = testing_df['CriticalSlide.RT'].values;
            let count = 0;
            let sum = 0;
            for (let j = 0; j < reactionTimes.length; ++j) {
                let currentReactionTime = parseInt(reactionTimes[j]);
                if(currentReactionTime === 0) continue;
                sum += currentReactionTime;
                count++;
            }
            this.meanReactionTime[i] = count === 0 ? 0 : (sum / count).toFixed(2);
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
            let accuracyValues = practice_df['CriticalSlide.ACC'].values;

            let count = 0.0;
            for (let j = 0; j < accuracyValues.length; ++j) {
                if (accuracyValues[j] === 'True') { // interesting
                    count++;
                }
            }

            this.practiceTrialsAccuracys[i] = accuracyValues.length === 0 ? 0 : (count/practice_df.shape[0] * 100).toFixed(2);
        }
    }

    countNoInputTrialsDays() {
        for (let i = 0; i < Game.TotalDays; ++i) {
            let df = this.days[i];
            let testing_df = df.loc({rows: df['task_section'].eq('test')});
            let noInput_df = testing_df.loc({rows: testing_df['CriticalSlide.RESP'].eq('none')});
            let noTnputString = noInput_df.shape[0] + " out of " + testing_df.shape[0];
            this.noInputTrialsDays[i] = noTnputString;
        }
    }

    getHighlights(selectedReport) {
        let maxAccuracy = Math.max(...this.meanSessionsAccuracys);
        let countNotZero = this.meanReactionTime.filter(Boolean).length;
        let averageAccuracy = this.meanSessionsAccuracys.reduce((a, b) => a + parseFloat(b), 0) / countNotZero;
        let minReactionTime = Math.min.apply(null, this.meanReactionTime.filter(Boolean));
        let firstDayReactionTime = this.meanReactionTime.find(rt => rt !== 0) || 0;
        let improvement = (firstDayReactionTime - minReactionTime).toFixed(2);
        let improvementPercentage = (improvement / firstDayReactionTime * 100).toFixed(2);
        let maxAccuracyMessage = `Your maximum accuracy: ${maxAccuracy}%`;
        let averageAccuracyMessage = `Your average accuracy: ${parseFloat(averageAccuracy).toFixed(2)}%`;
        let firstDayReactionTimeMessage = `Your first day average reaction time: ${firstDayReactionTime}ms`;
        let minReactionTimeMessage = `Your fastest day average reaction time: ${minReactionTime}ms`;
        let improvementTimeMessage = `Your best improvement from the first day: ${improvement}ms (${improvementPercentage}% improvement)`;

        if(selectedReport === 0) {
            return [maxAccuracyMessage, averageAccuracyMessage, firstDayReactionTimeMessage, minReactionTimeMessage];
        } else {
            return [maxAccuracyMessage, averageAccuracyMessage, firstDayReactionTimeMessage, minReactionTimeMessage, improvementTimeMessage];
        }
    }

    getMeanSessionsAccuracys() { // TODO: come back to fix
        return this.meanSessionsAccuracys
    }

    getMeanReactionTime() {
        return this.meanReactionTime
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