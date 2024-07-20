//import * as dfd from 'danfojs';
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
        this.data = data; // TODO: become a list of dataframes if bds, simon, cs
        this.participants = [];
        this.participantsMap = new Map()
        this.#constructParticipants(ids);
    }

    #constructParticipants() {
        
        for (let id of this.ids.values) {
            if(id === undefined || id === null) {
                continue;
            }
            // TODO: remove once highlights are implemented
            // if(!(id === "77898041" || id === "77898042")) {
            //     continue;
            // }

            let df;
            if (this.data.columns.includes("subject_id")) {
                df = this.data.loc({ rows: this.data["subject_id"].eq(id)});
            } else if (this.data.columns.includes("Subject")) {
                df = this.data.loc({ rows: this.data["Subject"].eq(id)});
            } else {
                throw new Error("No 'subject_id' column found in data, please make sure you have a fortune deck dataset.");
            }
            const participant = new Participant(id, df);
            this.participants.push(participant);
            this.participantsMap.set(id, participant);
        }
    }

    getIds() {
        if (this.ids === null) {
            throw new Error('ids is null');
        }
        return this.ids.values;
    }

    getParticipant(id) {
        return this.participantsMap.get(id);
    }

    getCompletions() {
        return this.participants.map(participant => participant.getCompletions());
    }

    getNumberSessions() {
        return this.participants.map(participant => participant.getNumberSessions());
    }

    getLanguages() {
        return this.participants.map(participant => participant.getLanguages());
    }

    getPracticeTrialsAmount() {
        return this.participants.map(participant => participant.getPracticeTrialsAmount());
    }

    getPracticeTrialsAccuracy() {
        return this.participants.map(participant => participant.getPracticeTrialsAccuracy());
    }

    getMeanSessionAccuracy() {
        return this.participants.map(participant => participant.getMeanSessionAccuracy());
    }

    getAverageDigitSpans() {
        return this.participants.map(participant => participant.getAverageDigitSpans());
    }

    getMaxDigitSpans() {
        return this.participants.map(participant => participant.getMaxDigitSpans());
    }

    getMaxCorrectDigitSpans() {
        return this.participants.map(participant => participant.getMaxCorrectDigitSpans());
    }

    getNoInputTrials() {
        return this.participants.map(participant => participant.getNoInputTrials());
    }
}