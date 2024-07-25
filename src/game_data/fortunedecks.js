import Game from "./game";
import * as dfd from 'danfojs';

const BLOCK_SIZE = 20;
export default class FortuneDeck extends Game {
    constructor(data, participant_id) {
        super(data);
        this.participant_id = participant_id;
        this.calculateCompletionsDays();
        this.calculateScore();
        this.calculateEndPoints();
        this.calculateBonus();
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
            this.score[i] = (((countC + countD) - (countA + countB))/this.count[i]).toFixed(2)
        }
    }

    
    /**
     * Calculates the end points and accumulated score for each day in the FortuneDeck.
     * 
     * @return {void} This function does not return a value.
     */
    calculateEndPoints() {
        this.points = Array(Game.TotalDays).fill(0);
        this.accumulatedScore = Array(Game.TotalDays).fill(0);
        for (let i = 0; i < Game.TotalDays; ++i) {
            let df = this.days[i]
            let startAmt = parseFloat(df.head(1)['totalsum'].values[0]) - parseFloat(df.head(1)['var'].values[0])
            let adjustment = 0
            // if starting amount is 2000, then we need to add 500 to end amount.
            if (startAmt === 2000) {
                adjustment = 500
            }
            this.points[i] = parseFloat(df.tail(1)['totalsum'].values[0]) + adjustment
            if (i === 0) {
                this.accumulatedScore[i] = !isNaN(this.points[i]) ? this.points[i] : 0
            } else {
                this.accumulatedScore[i] = !isNaN(this.points[i]) ? this.accumulatedScore[i - 1] + this.points[i] : this.accumulatedScore[i - 1];
            }
        }
    }

    /**
     * Calculates the bonus for each day based on the number of points earned.
     * The bonus is calculated as a percentage of the maximum bonus (MAX_BONUS),
     * where the percentage is determined by the points earned for each day.
     * Currently the points are clamped between 0 and 5000 to enforce a minimum of 0 and and max of MAX_BONUS.
     * The bonus is then accumulated for each day.
     *
     * @return {void} This function does not return a value.
     */
    calculateBonus() {
        const MAX_BONUS = 1;
        //TODO: add dollar formatting someplace else?
        this.bonus = Array(Game.TotalDays).fill(0);
        this.accumulatedBonus = Array(Game.TotalDays).fill(0);
        for (let i = 0; i < Game.TotalDays; ++i) {
            if (this.count[i] === 0) {
                this.bonus[i] = undefined
                continue;
            }
            // clamps the points between 0 and 5000
            let clampedPoints = Math.max(Math.min(this.points[i], 5000), 0);
            let percentage = clampedPoints / 5000;
            let bonus = percentage * MAX_BONUS;
            this.bonus[i] = bonus
        }
        this.accumulatedBonus[0] = !isNaN(this.bonus[0]) ? this.bonus[0] : 0;
        for(let i = 0; i < Game.TotalDays; ++i) {
            if(i === 0) {
                this.accumulatedBonus[i] = !isNaN(this.bonus[i]) ? this.bonus[i] : 0
            } else {
                this.accumulatedBonus[i] = !isNaN(this.bonus[i]) ? this.accumulatedBonus[i - 1] + this.bonus[i] : this.accumulatedBonus[i - 1];
            }

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
        let maxPoints = Math.max(...(this.points.filter(x => !isNaN(x))))
        let countNotZero = this.count.reduce((total, count) => count === 0 ? total : total + 1, 0);
        let averagePoints = this.points.reduce((a, b) =>    isNaN(b) ? a : a + b, 0) / countNotZero
        let accumulatedScore = this.accumulatedScore[this.accumulatedScore.length - 1];
        let maxBonus = Game.MoneyFormat.format(Math.max(...(this.bonus.filter(x => !isNaN(x)))))
        let accumulatedBonus = Game.MoneyFormat.format(this.accumulatedBonus[this.accumulatedBonus.length - 1]);

        let maxPointsMessage = `Your best points earned in a single day: ${maxPoints}`
        let averagePointsMessage = `Your average points earned across all days: ${averagePoints.toFixed(2)}`
        let accumulatedScoreMessage = `Your accumulated score: ${accumulatedScore}`
        let maxBonusMessage = `Your best bonus earned in a single day: ${maxBonus}`
        let accumulatedBonusMessage = `Your accumulated bonus: ${accumulatedBonus}`

        
        if (selectedReport === 0) {
            return [maxPointsMessage, averagePointsMessage, accumulatedScoreMessage, maxBonusMessage, accumulatedBonusMessage]
        } else {
            return [maxPointsMessage, averagePointsMessage, accumulatedScoreMessage, maxBonusMessage, accumulatedBonusMessage]
        }
    }
}