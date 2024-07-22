import Game from "./game";
import * as dfd from 'danfojs';

const BLOCK_SIZE = 20;
export default class FortuneDeck extends Game {
    constructor(data, participant_id) {
        super(data);
        this.participant_id = participant_id;
        this.calculateCompletionsDays();
        this.calculateScore();
        this.calculateEndPoints()
    }  

    calculateCompletionsDays() {
        const POSSIBLE_TRIALS = [100, 80]
        const EXPECTED_TRIALS = POSSIBLE_TRIALS[(this.participant_id - 1) % POSSIBLE_TRIALS.length]
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
        this.goodDeckPercentage = Array(Game.TotalDays).fill(0);
        // score is calculated [(C + D) - (A + B)]/count
        for (let i = 0; i < Game.TotalDays; ++i) {
            if (this.count[i] === 0) {
                this.score[i] = undefined
                continue;
            }
            let df = this.days[i]
            let countA = df.loc({rows: df['Deck_RESP'].eq('A')}).shape[0]
            let countB = df.loc({rows: df['Deck_RESP'].eq('B')}).shape[0]
            let countC = df.loc({rows: df['Deck_RESP'].eq('C')}).shape[0]
            let countD = df.loc({rows: df['Deck_RESP'].eq('D')}).shape[0]
            this.goodDeckPercentage[i] = ((countC + countD)/this.count[i] * 100).toFixed(2)
            this.score[i] = (((countC + countD) - (countA + countB))/this.count[i]).toFixed(2)
        }
    }

    calculateEndPoints() {
        this.points = Array(Game.TotalDays).fill(0);
        for (let i = 0; i < Game.TotalDays; ++i) {
            let df = this.days[i]
            this.points[i] = parseFloat(df.tail(1)['totalsum'].values[0])
        }
    }

    getEndPoints() {
        return this.points
    }

    getStartPoints() {
        //TODO: get start points from df
        return 2000;
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

    getBlockProportions() {
        const POSSIBLE_TRIALS = [100, 80]
        const EXPECTED_TRIALS = POSSIBLE_TRIALS[(this.participant_id - 1) % POSSIBLE_TRIALS.length]
        let blockProportions = Array(Game.TotalDays).fill(0).map(() => Array(EXPECTED_TRIALS/BLOCK_SIZE).fill({}));
        console.log(blockProportions)
        for (let i = 0; i < Game.TotalDays; ++i) {
            if (this.count[i] === 0) {
                continue;
            }
            let df = this.days[i]
            for (let j = 0; j < EXPECTED_TRIALS/BLOCK_SIZE; ++j) {
                let curr_df = df.loc({rows: df['List1_Sample'].gt(j * BLOCK_SIZE)
                    .and(df['List1_Sample'].lt((j + 1) * BLOCK_SIZE + 1))});
                let countA = curr_df.loc({rows: curr_df['Deck_RESP'].eq('A')}).shape[0]
                let countB = curr_df.loc({rows: curr_df['Deck_RESP'].eq('B')}).shape[0]
                let countC = curr_df.loc({rows: curr_df['Deck_RESP'].eq('C')}).shape[0]
                let countD = curr_df.loc({rows: curr_df['Deck_RESP'].eq('D')}).shape[0]
                let obj = {
                    A: countA,
                    B: countB,
                    C: countC,
                    D: countD,
                    total: countA + countB + countC + countD
                }
                blockProportions[i][j] = obj
            }
        }
        return blockProportions
    }

    getHighlights(selectedReport) {
        // let maxScore = Math.max(...(this.score.filter(x => !isNaN(x))))
        let maxPoints = Math.max(...(this.points.filter(x => !isNaN(x))))
        let countNotZero = this.count.reduce((total, count) => count === 0 ? total : total + 1, 0);
        let averagePoints = this.points.reduce((a, b) =>    isNaN(b) ? a : a + b, 0) / countNotZero
        let maxGoodDeckPercentage = Math.max(...(this.goodDeckPercentage.filter(x => !isNaN(x))))
        // let maxScoreMessage = `Your maximum score: ${maxScore}`
        let maxPointsMessage = `Your maximum points earned: ${maxPoints}`
        let averagePointsMessage = `Your average points earned: ${averagePoints.toFixed(2)}`
        let maxGoodDeckPercentageMessage = `Your maximum good deck percentage: ${maxGoodDeckPercentage}%`
        
        if (selectedReport === 0) {
            return [maxPointsMessage, averagePointsMessage]
        } else {
            return [maxPointsMessage, averagePointsMessage, maxGoodDeckPercentageMessage]
        }
    }
}