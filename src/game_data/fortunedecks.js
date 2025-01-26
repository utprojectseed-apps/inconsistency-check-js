import Game from "./game";
import * as dfd from 'danfojs';
import {format} from 'date-fns';

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
        const EXPECTED_TRIALS = 80
        this.count = Array(Game.TotalDays).fill(0);
        for (let i = 0; i < Game.TotalDays; ++i) {
            //in case there are multiple sessions //TODO fix multiple sessions by removing it from df? or can find a way to display all?
            let df = this.days[i];
            let sessions = new dfd.Series(df['session_uuid'].values).unique().values
            this.completionsDays[i] = 0
            for (let j = 0; j < sessions.length; ++j) {
                let session = sessions[j]
                let sess_df = df.loc({rows: df['session_uuid'].eq(session)})
                let count = sess_df.shape[0]
                let completionRate = (count/EXPECTED_TRIALS * 100)
                completionRate = parseFloat(completionRate.toFixed(2))

                if (completionRate > this.completionsDays[i]) {
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

    getPoints() {
        return this.points
    }

    getBlockProportions() {
        const EXPECTED_TRIALS = 80
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

    getGraphPoints() {
        let allPoints = Array(Game.TotalDays).fill(undefined)
        for (let i = 0; i < Game.TotalDays; ++i) {
            if (this.count[i] === 0) {
                continue;
            }
            let df = this.days[i]
            let startAmt = parseFloat(df.head(1)['totalsum'].values[0]) - parseFloat(df.head(1)['var'].values[0])
            let adjustment = startAmt === 2000 ? 500 : 0 
            let x = df['List1_Sample'].asType('float32').values
            let y = df['totalsum'].asType('float32')
            y = y.add(adjustment).values
            let points = x.map((val, index) => { return {x: val, y: y[index]}})
            // points = simplify(points) removed package for now.
            allPoints[i] = points
        }
        console.log(allPoints)
        return allPoints
    }

    getHighlights(selectedReport) {
        this.getGraphPoints()
        let points = this.points
        let trialCounts = this.count
        let accumulatedScores = this.accumulatedScore
        let bonus = this.bonus
        let accumulatedBonuses = this.accumulatedBonus

        if(selectedReport === 0) {
            // force first week report to only look up to 7 days.
            points = points.slice(0, 7)
            trialCounts = trialCounts.slice(0, 7)
            accumulatedScores = accumulatedScores.slice(0, 7)
            bonus = bonus.slice(0, 7)
            accumulatedBonuses = accumulatedBonuses.slice(0, 7)
        }

        let maxPoints = Math.max(...(points.filter(x => !isNaN(x))))
        let countNotZero = trialCounts.reduce((total, count) => count === 0 ? total : total + 1, 0);
        let averagePoints = points.reduce((a, b) =>    isNaN(b) ? a : a + b, 0) / countNotZero
        let totalAccumulatedScore = accumulatedScores[accumulatedScores.length - 1];
        let maxBonus = Game.MoneyFormat.format(Math.max(...(bonus.filter(x => !isNaN(x)))))
        let totalAccumulatedBonus = Game.MoneyFormat.format(accumulatedBonuses[accumulatedBonuses.length - 1]);
        
        return [maxPoints, averagePoints.toFixed(2), totalAccumulatedScore, maxBonus, totalAccumulatedBonus]
    }

    storeCurrentDay() {
        const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
        for (let i = 0; i < Game.TotalDays; ++i) {
            let df = this.days[i]
            let currDate = "--";
            if (df && this.firstTrialTimestamps && this.firstTrialTimestamps[i] instanceof Date && !isNaN(this.firstTrialTimestamps[i])) {
                currDate = format(this.firstTrialTimestamps[i], 'yyyy-MM-dd');
            }
            this.currDays[i] = currDate;
            this.weekDays[i] = weekdays[i % 7];
        }        
    }
}