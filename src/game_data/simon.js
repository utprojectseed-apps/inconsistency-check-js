import Game from "./game";
import * as dfd from 'danfojs';

export default class Simon extends Game {
    constructor(data, participant_id) {
        super(data);
        this.participant_id = participant_id
        this.calculateCompletionsDays()
        this.meanSessionsAccuracys = Array(Game.TotalDays).fill().map(() => []);
        this.meanReactionTime = Array(Game.TotalDays).fill().map(() => []);
        this.calculateSessionAccuracyDays();
        this.calculateMeanReactionTime();
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

                let completionRate = (count/32 * 100).toFixed(2)
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

            let numTrials = testing_df.shape[0] !== 0 ? testing_df.shape[0] : 32;
            let accuracyValues = testing_df['Slide1.ACC'].values;
            let count = 0.0;

            for (let j = 0; j < accuracyValues.length; ++j) {
                if (accuracyValues[j] === 'True') {
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
            let reactionTimes = testing_df['Slide1.RT'].values;
            let count = 0;
            let sum = 0;
            for (let j = 0; j < reactionTimes.length; ++j) {
                let currentReactionTime = parseInt(reactionTimes[j]);
                if(currentReactionTime === -999) continue;
                sum += currentReactionTime;
                count++;
            }
            this.meanReactionTime[i] = count === 0 ? 0 : (sum / count).toFixed(2);
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
}