import * as dfd from 'danfojs';
import FortuneDeck from './fortunedecks';
import {FORTUNE_NAME} from "./constants";

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
                    this.game = new FortuneDeck(this.data);
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


}