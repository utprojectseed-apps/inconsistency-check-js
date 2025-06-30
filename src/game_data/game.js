import {parseISO, differenceInSeconds, format} from 'date-fns';
import {REPORT_DT_FORMAT} from './constants.js';

export default class Game {
    constructor(data) {
        if (this.constructor === Game) {
            throw new Error("Abstract classes can't be instantiated");
        }
        this.data = data;
        this.data = this.data.asType("day", "int32")
        this.days = Array(Game.TotalDays).fill().map(() => []);
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
}