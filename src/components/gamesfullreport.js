import GamesParticipantReport from "./gamesparticipantreport"

export default function GameFullReport({participantList}) {
    const participants = participantList !== null && participantList.participants.map(
        participant => <GamesParticipantReport key={participant.id} participant={participant}/>)
    return (
        <div>
            {participants}
        </div>
    )
}