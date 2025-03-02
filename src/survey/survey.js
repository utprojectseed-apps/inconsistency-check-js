import SurveyParticipant from './surveyparticipant'

/**
 * Represents a survey with participants and their data.
 * Provides methods to manipulate the data and access participants.
 * This class is abstract and cannot be instantiated.
 */
export default class Survey {

    /**
     * Creates a new Survey object.
     * Throws an error if the Survey class is instantiated directly.
     */
    constructor() {
        if(this.constructor === Survey) {
            throw new Error('Abstract class "Survey" cannot be instantiated')
        }
        this.data = undefined
        this.participants = []
        this.selectedIds = []
        this.loadedIds = []
    }

    /**
     * Removes HTML tags from a given text.
     * @param {string} text - The text to remove HTML tags from.
     * @return {string} The text without HTML tags.
     */
    static stripTags(text) {
        return text.replace(/<[^>]*>/g, '')
    }

    /**
     * Sets the survey data.
     * @param {Object} data - The survey data.
     */
    setData(data) {
        this.data = data
    }

    /**
     * Sets the selected participant IDs and creates corresponding SurveyParticipant objects.
     * @param {Array} ids - The array of participant IDs.
     */
    setSelectedIds(ids) {
        this.selectedIds = ids
        for(let i = 0; i < ids.length; ++i) {
            if(!this.loadedIds.includes(ids[i])) {
                this.loadedIds.push(ids[i])
                this.participants.push(new SurveyParticipant(this.data.loc({ rows: this.data["participant_id"].eq(ids[i])}), this.dataDict))
            }
        }
    }

    /**
     * Returns an array of participant IDs from the survey data.
     * @return {Array} The array of participant IDs.
     */
    getParticipantIds() {
        if (this.data === undefined) {
            return []
        }
        return this.data['participant_id'].values
    }

    /**
     * Returns an array of SurveyParticipant objects representing the survey participants.
     * @return {Array} The array of SurveyParticipant objects.
     */
    getParticipants() {
        return this.participants
    }

    /**
     * Asynchronously reads the survey data from a CSV file.
     * Throws an error if the function is called on the Survey class directly.
     * @throws {Error} If the function is called on the Survey class directly.
     */
    async readFortuneCSV() {
        throw new Error('abstract method')
    }
}