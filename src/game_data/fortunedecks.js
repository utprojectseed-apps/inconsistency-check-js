import Game from "./game";
import * as dfd from 'danfojs';


export default class FortuneDeck extends Game {
    constructor(data) {
        super(data);
        this.calculateScore();
    }  

    calculateCompletionsDays() {
        const EXPECTED_TRIALS = 100
        this.count = Array(Game.TotalDays).fill(0);
        for (let i = 0; i < Game.TotalDays; ++i) {
            //in case there are multiple sessions //TODO fix multiple sessions by removing it from df? or can find a way to display all?
            let df = this.days[i];
            let sessions = new dfd.Series(df['session_uuid'].values).unique().values
            this.completionsDays[i] = 0
            for(let j = 0; j < sessions.length; ++j) {
                let session = sessions[j]
                let sess_df = df.loc({rows: df['session_uuid'].eq(session)});
                let count = sess_df.shape[0]
                let completionRate = (count/EXPECTED_TRIALS * 100).toFixed(2)
                if(completionRate > this.completionsDays[i]) {
                    this.completionsDays[i] = completionRate
                    this.count[i] = count
                    this.days[i] = sess_df
                }
            }
        }
    }

    calculateScore() {
        this.score = Array(Game.TotalDays).fill(0);
        // score is calculated [(C + D) - (A + B)]/count
        for (let i = 0; i < Game.TotalDays; ++i) {
            if (this.count[i] === 0) {
                continue;
            }
            let df = this.days[i]
            let countA = df.loc({rows: df['Deck_RESP'].eq('A')}).shape[0]
            let countB = df.loc({rows: df['Deck_RESP'].eq('B')}).shape[0]
            let countC = df.loc({rows: df['Deck_RESP'].eq('C')}).shape[0]
            let countD = df.loc({rows: df['Deck_RESP'].eq('D')}).shape[0]
            this.score[i] = (((countC + countD) - (countA + countB))/this.count[i]).toFixed(2)
        }
    }

    getScores() {
        return this.score
    }

    getScore(day) {
        return this.score[day - 1]
    }

    getCounts() {
        return this.count
    }

    getCount(day) {
        return this.count[day - 1]
    }
}