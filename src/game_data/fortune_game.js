import Game from "./game";
import * as dfd from 'danfojs';


export default class FortuneGame extends Game {
    // constructor(data) {
    //     super(data);
    // }  

    calculateCompletionsDays() {
        const EXPECTED_TRIALS = 100
        for (let i = 0; i < Game.TotalDays; ++i) {
            //in case there are multiple sessions
            let df = this.days[i];
            let sessions = new dfd.Series(df['session_uuid'].values).unique().values
            this.completionsDays[i] = 0
            for(let j = 0; j < sessions.length; ++j) {
                let session = sessions[j]
                let sess_df = df.loc({rows: df['session_uuid'].eq(session)});
                let count = sess_df.shape[0]
                this.completionsDays[i] = Math.max(this.completionsDays[i], count/EXPECTED_TRIALS);
            }
        }
    }
}