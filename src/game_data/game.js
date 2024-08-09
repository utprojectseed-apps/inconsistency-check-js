import {parseISO, differenceInSeconds} from 'date-fns';

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
        this.gameTimes = Array(Game.TotalDays).fill().map(() => []);
        this.currDays = Array(Game.TotalDays).fill().map(() => []);

        this.#splitDays();
        this.calculateCompletionsDays();
        this.storeCurrentDay();
        this.storeLanguagePlayedForSessions();
        this.getFirstAndLastTrialTimeStamps();
        this.calculateGameTimes();
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

    calculateCompletionsDays() {
        throw new Error("abstract method");
    }

    // lowkey might only work for brain-games TODO look at fortune decks columns
    getFirstAndLastTrialTimeStamps() {
        for (let i = 0; i < Game.TotalDays; ++i) {
            let df = this.days[i];
            let firstTrialTimestamp = '--/--/-- --:--:--'
            let lastTrialTimestamp = '--/--/-- --:--:--'
            let trialTimestamps = df['trial_timestamp'].values;

            if (trialTimestamps.length > 0) {
                firstTrialTimestamp = trialTimestamps[0].slice(0, 19);
                lastTrialTimestamp = trialTimestamps[trialTimestamps.length - 1].slice(0, 19);
            }
            this.firstTrialTimestamps[i] = firstTrialTimestamp
            this.lastTrialTimestamps[i] = lastTrialTimestamp            
        }  
    }

    // lowkey might only work for brain-games TODO look at fortune decks columns
    calculateGameTimes() {
        for (let i = 0; i < Game.TotalDays; ++i) {

            let bdsFirst = this.firstTrialTimestamps[i];
            let bdsLast = this.lastTrialTimestamps[i];
            if (bdsFirst !== '--/--/-- --:--:--' && bdsLast !== '--/--/-- --:--:--') {
                let start = parseISO(bdsFirst);
                let end = parseISO(bdsLast);
                let game_time = differenceInSeconds(end, start);
                let gameTimeMinutes = (game_time / 60).toFixed(2);
                let string = gameTimeMinutes + " mins";
                this.gameTimes[i] = string
            } else {
                this.gameTimes[i] = '0 mins'
            }  
        }
    }

    // return current day 
    storeCurrentDay() {
        for(let i = 0; i < Game.TotalDays; ++i) {
            let df = this.days[i];
            
            let currDate = "----/--/--"
            if (df && df["CurrentDate"].values.length > 0) {
                currDate = df["CurrentDate"].values
                currDate = currDate[0].slice(0, 10);
            }
            this.currDays[i] = currDate
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
}