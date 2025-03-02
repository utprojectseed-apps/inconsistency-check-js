import GamesParticipantReport from "./gamesparticipantreport"

export default function GameFullReport({participantList, activeIds}) {
    const participants = participantList !== null && activeIds !== undefined && participantList.participants.filter(participant => {
        return activeIds.includes(participant.id)
    }).map( participant => {
        return <GamesParticipantReport key={participant.id} participant={participant}/>
    })
    return (
        <div>
            {participants}
        </div>
    )
}