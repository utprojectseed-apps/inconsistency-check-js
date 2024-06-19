import Game from "./game";
import * as dfd from 'danfojs';

export default class BDS extends Game {
    constructor(data, participant_id) {
        super(data);
        this.participant_id = participant_id
        this.calculateCompletionsDays()
        this.averageDigitSpanDays = Array(Game.TotalDays).fill().map(() => []);
        this.calculateAverageDigitSpanDays();
    }

    calculateCompletionsDays() {
        this.count = Array(Game.TotalDays).fill(0);
        for (let i = 0; i < Game.TotalDays; ++i) {
            //in case there are multiple sessions //TODO fix multiple sessions by removing it from df? or can find a way to display all?
            let df = this.days[i];
            let sessions = new dfd.Series(df['session_uuid'].values).unique().values;
            this.completionsDays[i] = 0;

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

    getAverageDigitSpanDays() {
        return this.averageDigitSpanDays
    }
}