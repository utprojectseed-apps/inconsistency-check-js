export default function participantStats7Day( {participant} ) {
    if(participant.getId() <= 7789) { return null }
    const rawData = participant.game.getScores()
    let maxScore = 0

    for (let i = 0; i < rawData.length; i++) {
        if (rawData[i] > maxScore) {
            maxScore = rawData[i]
        }
    }

    return (
        <div>
            <h2>Participant Stats</h2>
            <h3>Participant ID: {participant.getId()}</h3>
            <p>Best Score: {maxScore}</p>
            <p>Overall Perferred Deck: </p>
            <p></p>
        </div>
    )
}