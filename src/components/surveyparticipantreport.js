import SurveyDayInfo from "./surveydayinfo";

export default function SurveyParticipantReport({participant}) {
    if(participant === null) { return null }
    const days = participant.getPercentComplete().map((p, i) => {
        return <SurveyDayInfo key={i} day={i + 1} participant={participant}/>
    })
    return (
        <div>
            <h1><ParticipantHeader participant={participant}/></h1>
            <h2>{days}</h2>
        </div>
    )
}

function ParticipantHeader({participant}) {
    if(participant === null) { return null }
    return (
        <div className='participant-header'>
            <h2 className='participant-id'>Participant ID: {participant.getParticipantId()}</h2>
            <h3>Name: {participant.getName()}</h3>
        </div>)
}