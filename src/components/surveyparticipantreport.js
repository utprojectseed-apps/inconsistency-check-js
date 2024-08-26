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
            <h3 className='participant-id'>{participant.getName()} ({participant.getParticipantId()})</h3>
        </div>)
}