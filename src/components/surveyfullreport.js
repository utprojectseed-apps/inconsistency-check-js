import SurveyParticipantReport from "./surveyparticipantreport"

export default function SurveyFullReport({participantList, activeIds}) {
    const participants = participantList !== undefined && activeIds !== undefined && participantList.getParticipants().filter(participant => {
        return activeIds.includes(participant.getParticipantId())
    }).map(participant => {
        return <SurveyParticipantReport key={participant.id} participant={participant}/>
    })

    return (
        <div>
            {participants}
        </div>
    )
}