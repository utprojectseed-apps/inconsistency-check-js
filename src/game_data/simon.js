import Game from "./game";
import * as dfd from 'danfojs';

export default class Simon extends Game {
    constructor(data, participant_id) {
        super(data);
        this.participant_id = participant_id;
        this.meanSessionsAccuracys = Array(Game.TotalDays).fill().map(() => []);
        this.meanReactionTime = Array(Game.TotalDays).fill().map(() => []);
        this.meanCorrectReactionTime = Array(Game.TotalDays).fill().map(() => []);
        this.practiceTrialsAmount = Array(Game.TotalDays).fill().map(() => []);
        this.practiceTrialsAccuracys = Array(Game.TotalDays).fill().map(() => []);
        this.noInputTrialsDays = Array(Game.TotalDays).fill().map(() => []);
        
        this.calculateCompletionsDays();
        this.calculateSessionAccuracyDays();
        this.calculateMeanReactionTime();
        this.calculateMeanCorrectReactionTime();
        this.countPracticeTrialsAmountDays();
        this.calculatePracticeTrialsAccuracys();
        this.countNoInputTrialsDays();
        this.getHighlights();
    }

    /**
     * Calculates and sets the completion rate for each day in the game.
     *
     * This function iterates over each day in the game and calculates the completion rate for each day.
     * It does this by iterating over each session in the day and calculating the number of test trials.
     * The completion rate is calculated by dividing the number of test trials by 32 and multiplying by 100.
     * If the calculated completion rate is greater than the current completion rate for the day,
     * the completion rate for the day is updated and the corresponding count and session data are stored.
     *
     * @return {void} This function does not return anything.
     */
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

                let completionRate = (count / 32 * 100)
                completionRate = parseFloat(completionRate.toFixed(2))
                
                if(completionRate > this.completionsDays[i]) {
                    this.completionsDays[i] = completionRate;
                    this.count[i] = count; // conatins the number of test trials 
                    this.days[i] = sess_df;
                }
            }
        }   
    }

    /**
     * Calculates and sets the session accuracy for each day in the game.
     *
     * This function iterates over each day in the game and calculates the session accuracy for each day.
     * It does this by iterating over each session in the day and calculating the number of test trials.
     * The session accuracy is calculated by counting the number of 'True' values in the 'Slide1.ACC' column
     * of the testing dataframe and dividing it by the total number of trials. The result is then multiplied
     * by 100 and rounded to 2 decimal places.
     *
     * @return {void}
     */
    calculateSessionAccuracyDays() {
        for (let i = 0; i < Game.TotalDays; ++i) {
            let df = this.days[i];
            let testing_df = df.loc({rows: df['task_section'].eq('test')});

            let numTrials = testing_df.shape[0] !== 0 ? testing_df.shape[0] : 33;
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

    calculateMeanCorrectReactionTime() { //TODO: probably combine this with previous function somehow
        for (let i = 0; i < Game.TotalDays; ++i) {
            let df = this.days[i];
            let testing_df = df.loc({rows: df['task_section'].eq('test')});
            testing_df = testing_df.loc({rows: testing_df['Slide1.ACC'].eq('True')});
            let reactionTimes = testing_df['Slide1.RT'].values;

            let count = 0;
            let sum = 0;
            for (let j = 0; j < reactionTimes.length; ++j) {
                let currentReactionTime = parseInt(reactionTimes[j]);
                if(currentReactionTime === -999) continue;
                sum += currentReactionTime;
                count++;
            }
            this.meanCorrectReactionTime[i] = count === 0 ? 0 : (sum / count).toFixed(2);
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
                if (accuracyValues[j] === 'True') { // TODO: check
                    count++;
                }
            }
            this.practiceTrialsAccuracys[i] = accuracyValues.length === 0 ? 0 : (count / practice_df.shape[0] * 100).toFixed(2);
        }
    }

    countNoInputTrialsDays() {
        for (let i = 0; i < Game.TotalDays; ++i) {
            let df = this.days[i];
            let testing_df = df.loc({rows: df['task_section'].eq('test')});
            let noInput_df = testing_df.loc({rows: testing_df['Slide1.RESP'].eq('none')});
            let noInputString = noInput_df.shape[0] + " out of " + testing_df.shape[0];
            this.noInputTrialsDays[i] = noInputString;
        }
    }

    getHighlights(selectedReport) {
        let maxAccuracy = Math.max(...this.meanSessionsAccuracys);
        let countNotZero = this.meanSessionsAccuracys.filter(Boolean).length;
        let averageAccuracy = this.meanSessionsAccuracys.reduce((a, b) => a + parseFloat(b), 0) / countNotZero;
        let minReactionTime = Math.min.apply(null, this.meanCorrectReactionTime.filter(Boolean));
        let firstDayReactionTime = this.meanCorrectReactionTime.find(rt => rt !== 0) || 0;
        let improvement = (firstDayReactionTime - minReactionTime).toFixed(2);
        let improvementPercentage = (improvement / firstDayReactionTime * 100).toFixed(2);

        if(selectedReport === 0) {
            return [maxAccuracy, parseFloat(averageAccuracy).toFixed(2), firstDayReactionTime, minReactionTime];
        } else {
            return [maxAccuracy, parseFloat(averageAccuracy).toFixed(2), firstDayReactionTime, minReactionTime, improvement, improvementPercentage];
        }
    }

    getMeanSessionsAccuracys() { // TODO:call this method instead of getSessionAccuracyDays
        return this.meanSessionsAccuracys;
    }

    getMeanReactionTime() {
        return this.meanReactionTime;
    }

    getMeanCorrectReactionTime() {
        return this.meanCorrectReactionTime;
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