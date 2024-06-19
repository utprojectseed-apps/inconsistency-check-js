import * as dfd from 'danfojs';
import FortuneDeck from './fortunedecks';
import BDS from './bds';
import {FORTUNE_NAME, BDS_NAME, SIMON_NAME, CS_NAME} from "./constants";

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
                    break;
                case CS_NAME:
                    this.gameName = "CS Task";
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

}