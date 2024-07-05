import GamesParticipantReport from "./gamesparticipantreport"

export default function GameFullReport({participantList, activeIds}) {
    const participants = participantList !== null && participantList.participants.map(
        participant => {
            if(activeIds.includes(participant.id)) {
                return <GamesParticipantReport key={participant.id} participant={participant}/>
            }
        })
    return (
        <div>
            {participants}
        </div>
    )
}