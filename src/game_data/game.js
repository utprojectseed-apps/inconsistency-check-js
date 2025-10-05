import {parseISO, differenceInSeconds, format} from 'date-fns';
import {REPORT_DT_FORMAT} from './constants.js';
import GameStrikes from './gamestrikes.js';

export default class Game {
    constructor(data) {
        if (this.constructor === Game) {
            throw new Error("Abstract classes can't be instantiated");
        }
        this.data = data;
        this.data = this.data.asType("day", "int32")
        this.days = Array(Game.TotalDays).fill().map(() => []);
        //this.setupCycles();
        this.completionsDays = Array(Game.TotalDays).fill().map(() => []);
        this.numberSessionsDays = Array(Game.TotalDays).fill().map(() => []);
        this.languagePlayedForSessions = Array(Game.TotalDays).fill().map(() => []);
        this.firstTrialTimestamps = Array(Game.TotalDays).fill().map(() => []);
        this.lastTrialTimestamps = Array(Game.TotalDays).fill().map(() => []);
        this.startTimes = Array(Game.TotalDays).fill().map(() => []);
        this.endTimes = Array(Game.TotalDays).fill().map(() => []);
        this.gameTimes = Array(Game.TotalDays).fill().map(() => []);
        this.currDays = Array(Game.TotalDays).fill().map(() => []);
        this.weekDays = Array(Game.TotalDays).fill().map(() => []);

        this.#splitDays();
        this.calculateCompletionsDays();
        this.storeLanguagePlayedForSessions();
        this.getFirstAndLastTrialTimeStamps();
        this.calculateGameTimes();
        this.storeCurrentDay();
        this.strikes = new GameStrikes();
    }

    static get TotalDays() {return 14; }

    /**
     * Returns an instance of the Intl.NumberFormat object that formats numbers as US currency.
     * To use call Game.MoneyFormat.format(number)
     *
     * @return {Intl.NumberFormat} An instance of the Intl.NumberFormat object.
     */
    static get MoneyFormat() {return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    });}

    #splitDays() {
        for (let i = 0; i < Game.TotalDays; ++i) {
            let df = this.data.loc({ rows: this.data["day"].eq(i + 1)});
            this.days[i] = df;
        }
    }

    /**
     * Stores the language played for each session in the `languagePlayedForSessions` array.
     *
     * This function iterates over each day in the `days` array and retrieves the language played for that day
     * from the `lang` column of the corresponding DataFrame. If the language is not available, it sets it to "---".
     * The language is then stored in the `languagePlayedForSessions` array at the corresponding index.
     *
     * @return {void} This function does not return anything.
     */
    storeLanguagePlayedForSessions() {
        for (let i = 0; i < Game.TotalDays; ++i) {
            let df = this.days[i];
            let language = df['lang'].values[0];
            if (!language) {
                language = "---"
            }
            this.languagePlayedForSessions[i] = language;
        }
    }

    /**
     * Calculates and sets the completion rate for each day in the game.
     *
     * @throws {Error} Throws an error indicating that this is an abstract method.
     */
    calculateCompletionsDays() {
        throw new Error("abstract method");
    }

    // recently added methods will mainly only work for brain games 
    /**
     * Retrieves the first and last trial timestamps for each day from the data and stores them in the corresponding arrays.
     *
     * @return {void} This function does not return anything.
     */
    getFirstAndLastTrialTimeStamps() {
        for (let i = 0; i < Game.TotalDays; ++i) {
            let df = this.days[i];

            this.firstTrialTimestamps[i] = '--/--/-- --:--:--'
            this.lastTrialTimestamps[i] = '--/--/-- --:--:--'
            this.startTimes[i] = '--/--/-- --:--'
            this.endTimes[i] = '---/--/-- --:--'
            let trialTimestamps = df['trial_timestamp'].values;
            if (trialTimestamps.length > 0) {
                let firstValue = trialTimestamps[0];
                let lastValue = trialTimestamps[trialTimestamps.length - 1];
                
                if (typeof firstValue === 'string') {
                    let firstTrialTimestamp = firstValue.slice(0, 19);
                    this.firstTrialTimestamps[i] = parseISO(firstTrialTimestamp)
                    this.startTimes[i] = format(this.firstTrialTimestamps[i], REPORT_DT_FORMAT);
                }
                
                if (typeof lastValue === 'string') {
                    let lastTrialTimestamp = lastValue.slice(0, 19);
                    this.lastTrialTimestamps[i] = parseISO(lastTrialTimestamp)
                    this.endTimes[i] = format(this.lastTrialTimestamps[i], REPORT_DT_FORMAT);  
                }
            }
        }  
    }

    // setupCycles() {
    //     let id = this.data['Subject'].values[0]
    //     this.startDate = new Date(this.data['cycle_start_date'].values[0]+"T00:00:00")
    //     this.currCycle = 0

    //     // find the last day that the user played the game, this is userDate
    //     let lastIndex = -1;
    //     const subjects = this.data['Subject'].values;
    //     for (let i = subjects.length - 1; i >= 0; i--) {
    //         if (subjects[i] === id) {
    //             lastIndex = i;
    //             break;
    //         }
    //     }

    //     this.userDate = new Date(this.data['CurrentDate'].values[lastIndex]);
    //     let diff = Math.abs(this.startDate - this.userDate)
    //     let diffDays = Math.floor(diff / (1000 * 60 * 60 * 24))
    //     diffDays = Math.min(diffDays, Game.TotalDays)
    //     this.currCycle = diffDays
    // }

    /**
     * Calculates the game times for each day in the game based on the first and last trial timestamps.
     *
     * @return {void}
     */
    calculateGameTimes() {
        for (let i = 0; i < Game.TotalDays; ++i) {

            let bdsFirst = this.firstTrialTimestamps[i];
            let bdsLast = this.lastTrialTimestamps[i];
            if (bdsFirst !== '--/--/-- --:--:--' && bdsLast !== '--/--/-- --:--:--') {
                let start = bdsFirst;
                let end = bdsLast;
                let game_time = differenceInSeconds(end, start);
                let gameTimeMinutes = (game_time / 60).toFixed(2);
                let string = gameTimeMinutes + " mins";
                this.gameTimes[i] = string
            } else {
                this.gameTimes[i] = '0 mins'
            }  
        }
    }

   /**
     * Stores the current day and weekday for each day in the game.
     *
     * This function iterates over the days of the game and retrieves the current date and weekday for each day.
     * If the current date is available, it is stored in the `currDays` array. The weekday is determined based on the index of the day in the `weekdays` array.
     *
     * @return {void} This function does not return a value.
     */
    storeCurrentDay() {
        const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
        for (let i = 0; i < Game.TotalDays; ++i) {
            let df = this.days[i];

            let currDate = "--";
            if (df && df["CurrentDate"] && df["CurrentDate"].values && df["CurrentDate"].values.length > 0) {
                currDate = df["CurrentDate"].values[0].slice(0, 10);
            }
            this.currDays[i] = currDate;
            this.weekDays[i] = weekdays[i % 7];
        }
    }

    generateStrikes() {
        const task = this.constructor.name;
        for (let i = 0; i < Game.TotalDays; ++i) {
            const day = i + 1;
            const sessionsRaw = this.numberSessionsDays?.[i];
            let sessions = 0;
            if (Array.isArray(sessionsRaw)) {
                sessions = sessionsRaw.length;
            } else if (typeof sessionsRaw === 'number') {
                sessions = sessionsRaw;
            } else if (typeof sessionsRaw === 'string') {
                const n = parseInt(sessionsRaw, 10);
                sessions = Number.isNaN(n) ? 0 : n;
            } else {
                sessions = Number(sessionsRaw) || 0;
            }
            const completionRaw = this.completionsDays?.[i];
            const accuracyRaw = this.meanSessionsAccuracys?.[i];

            // Missing session
            if (!sessions || sessions === 0) {
                this.strikes.addMissingStrike(day, task);
                continue; // nothing else to check for this day
            }

            // Completion checks
            const compFrac = GameStrikes._toFraction(completionRaw);
            if (!Number.isNaN(compFrac)) {
                let compSeverity = null;
                if (compFrac < GameStrikes.COMPLETION_THRESHOLDS.CONTACT_2) {
                    compSeverity = GameStrikes.Severity.CONTACT_2;
                } else if (compFrac < GameStrikes.COMPLETION_THRESHOLDS.CONTACT_1) {
                    compSeverity = GameStrikes.Severity.CONTACT_1;
                }
                if (compSeverity) {
                    this.strikes.addCompletionStrike(day, task, compFrac, compSeverity);
                }
            }

            // Accuracy checks
            if (typeof accuracyRaw !== 'undefined') {
                const accFrac = GameStrikes._toFraction(accuracyRaw);
                if (!Number.isNaN(accFrac)) {
                    let accSeverity = null;
                    const isBDS = this.constructor.name === 'BDS';
                    const thresholds = isBDS && GameStrikes.ACCURACY_THRESHOLDS.BDS ? GameStrikes.ACCURACY_THRESHOLDS.BDS : GameStrikes.ACCURACY_THRESHOLDS;

                    if (accFrac < thresholds.CONTACT_2) {
                        accSeverity = GameStrikes.Severity.CONTACT_2;
                    } else if (accFrac < thresholds.CONTACT_1) {
                        accSeverity = GameStrikes.Severity.CONTACT_1;
                    }

                    if (accSeverity) {
                        this.strikes.addAccuracyStrike(day, task, accFrac, accSeverity);
                    }
                }
            }
            if (this.constructor.name === 'FortuneDeck') {
                const ptsRaw = this.points?.[i];
                if (typeof ptsRaw !== 'undefined' && !Number.isNaN(ptsRaw)) {
                    const cutoff = GameStrikes.FORTUNE.POINT_CUTOFF;
                    const maxPoints = GameStrikes.FORTUNE.MAX_POINTS;
                    const ptsFrac = Math.max(0, Math.min(1, ptsRaw / maxPoints));
                    if (typeof cutoff === 'number' && !Number.isNaN(cutoff) && ptsRaw < cutoff) {
                        this.strikes.addAccuracyStrike(day, task, ptsFrac, GameStrikes.Severity.CONTACT_1);
                    } else {
                        let fortuneSeverity = null;
                        const thresholds = GameStrikes.ACCURACY_THRESHOLDS;
                        if (ptsFrac < thresholds.CONTACT_2) {
                            fortuneSeverity = GameStrikes.Severity.CONTACT_2;
                        } else if (ptsFrac < thresholds.CONTACT_1) {
                            fortuneSeverity = GameStrikes.Severity.CONTACT_1;
                        }
                        if (fortuneSeverity) {
                            this.strikes.addAccuracyStrike(day, task, ptsFrac, fortuneSeverity);
                        }
                    }
                }
            }
        }
    }

    getCurrentCycle() { // returns the current cycle for brain games
        return Math.min(this.currCycle, Game.TotalDays - 1);
    }

    cyclePassed(day) { // for brain games
        return day < this.currCycle;
    }


    getNumberSessionsDays() {
        return this.numberSessionsDays;
    }

    getCompletedDays() {
        return this.completionsDays;
    }

    getCycleStartDate() {
        return this.data["cycle_start_date"].values[0];
    }

    getCurrentDay() {
        return this.currDays;
    }

    getWeekDay() {
        return this.weekDays;
    }

    getLanguagePlayedForSessions() {
        return this.languagePlayedForSessions
    }

    getGameTimes() {
        return this.gameTimes;
    }

    getFirstTrialTimestamps() {
        return this.firstTrialTimestamps;
    }

    getLastTrialTimestamps() {
        return this.lastTrialTimestamps;
    }

    getStartTimes() {
        return this.startTimes;
    }

    getEndTimes() {
        return this.endTimes;
    }

    /**
     * Generate strikes for the game using normalized values.
     * Reads per-day completion and mean-session accuracy arrays that
     * subclasses populate, normalizes them and records missing,
     * completion, and accuracy strikes using thresholds from
     * `GameStrikes`.
     */
    
}