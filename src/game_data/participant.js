import * as dfd from 'danfojs';
import FortuneGame from './fortune_game';
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
                    this.game = new FortuneGame(this.data);
                    break;
                default:
                    break;
            }
        }
    }


}