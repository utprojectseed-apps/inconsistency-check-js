// import * as dfd from 'danfojs';
import Participant from "./participant";


export default class ParticipantList {
    /**
     * Constructs a new ParticipantList object.
     * Receives a list of participant IDs and a DataFrame containing all participant information.
     *
     * @param {Array} ids - The list of participant IDs.
     * @param {DataFrame} data - The data containing participant information.
     */
    constructor(ids, data) {
        this.ids = ids;
        this.data = data;
        this.participants = [];
        this.#constructParticipants(ids);
    }

    #constructParticipants() {
        for (let id of this.ids.values) {
            if(id === undefined || id === null) {
                continue;
            }
            const df = this.data.loc({ rows: this.data["subject_id"].eq(id)});
            const participant = new Participant(id, df);
            this.participants.push(participant);
        }
    }

    getIds() {
        if (this.ids === null) {
            throw new Error('ids is null');
        }
        return this.ids.values;
    }
}