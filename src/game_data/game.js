// import * as dfd from 'danfojs';

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
        this.#splitDays();
        this.calculateCompletionsDays();
        this.storeLanguagePlayedForSessions();
    }

    static get TotalDays() {return 14; }

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

    getNumberSessionsDays() {
        return this.numberSessionsDays;
    }

    getCompletedDays() {
        return this.completionsDays;
    }

    getCycleStartDate() {
        return this.data["cycle_start_date"].values[0];
    }

    getLanguagePlayedForSessions() {
        return this.languagePlayedForSessions
    }
}