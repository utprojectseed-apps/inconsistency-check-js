import * as dfd from 'danfojs';
import FortuneDeck from './fortunedecks';
import BDS from './bds';
import {FORTUNE_NAME, BDS_NAME, SIMON_NAME, CS_NAME} from "./constants";
import Simon from './simon';
import ColorShape from './colorshape';

export default class Participant {
    constructor(id, data) {
        this.id = id;
        this.data = data;
        this.#constructGames()
    }

    #constructGames() {
        let games = new dfd.Series(this.data['experiment_name'].values).unique().values
        for(let i = 0; i < games.length; ++i) {
            switch(games[i]) {
                case FORTUNE_NAME:
                    this.gameName = "Fortune Decks";
                    this.game = new FortuneDeck(this.data, this.id);
                    break;
                case BDS_NAME:
                    this.gameName = "BDS Task";
                    this.game = new BDS(this.data, this.id);
                    break;
                case SIMON_NAME:
                    this.gameName = "Simon Task";
                    this.game = new Simon(this.data, this.id);
                    break;
                case CS_NAME:
                    this.gameName = "CS Task";
                    this.game = new ColorShape(this.data, this.id);
                    break;
                default:
                    throw new Error("Unknown experiment: " + games[i]);
            }
        }
    }

    getCompletions() {
        if (this.game === null) {
            throw new Error('game is null');
        }
        return this.game.getCompletedDays();
    }

    getNumberSessions(){
        if (this.game === null) {
            throw new Error('game is null');
        }
        return this.game.getNumberSessionsDays();
    }

    getLanguages() {
        if (this.game === null) {
            throw new Error('game is null');
        }
        return this.game.getLanguagePlayedForSessions();
    }

    getGameName() {
        return this.gameName;
    }

    getAverageDigitSpans() {
        if(this.gameName === "BDS Task") {
            return this.game.getAverageDigitSpanDays();
        } else {
            throw new Error("getAverageDigitSpans not implemented for this game.");
        }
    }

    getMaxDigitSpans() {
        if(this.gameName === "BDS Task") {
            return this.game.getMaxDigitSpanDays();
        } else {
            throw new Error("getMaxDigitSpans not implemented for this game.");
        }
    }

    getMaxCorrectDigitSpans() {
        if(this.gameName === "BDS Task") {
            return this.game.getMaxCorrectDigitSpanDays();
        } else {
            throw new Error("getMaxCorrectDigitSpans not implemented for this game.");
        }
    }

    getPracticeTrialsAmount() {
        if(this.gameName === "BDS Task" || this.gameName === "Simon Task" || this.gameName === "CS Task") {
            return this.game.getPracticrlTrialsAmountDays();
        } else {
            throw new Error("getPracticeTrials not implemented for this game.");
        }
    }

    getPracticeTrialsAccuracy() {
        if(this.gameName === "BDS Task" || this.gameName === "Simon Task" || this.gameName === "CS Task") {
            return this.game.getPracticeTrialsAccuracyDays();
        } else {
            throw new Error("getPracticeTrialsAccouracy not implemented for this game.");
        }
    }

    getMeanSessionAccuracy() {
        if(this.gameName === "BDS Task" || this.gameName === "Simon Task" || this.gameName === "CS Task") {
            return this.game.getSessionAccuracyDays();
        } else {
            throw new Error("getMeanSessionAccuracy not implemented for this game.");
        }
    }

}