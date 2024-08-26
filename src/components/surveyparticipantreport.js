import SurveyDayInfo from "./surveydayinfo";

export default function SurveyParticipantReport({participant}) {
    if(participant === null) { return null }
    const days = participant.getPercentComplete().map((p, i) => {
        return <SurveyDayInfo key={i} day={i + 1} participant={participant}/>
    })
    return (
        <div>
            <ParticipantHeader participant={participant}/>
            <h2>{days}</h2>
        </div>
    )
}

function ParticipantHeader({participant}) {
    if(participant === null) { return null }
    const CYCLE_FINISHED = participant.getCurrentCycle() >= 13
    return (
        <div className='participant-header'>
            <h2 className='participant-id'>{participant.getName()} ({participant.getParticipantId()})</h2>
            <div style={{display: "flex", justifyContent: "space-evenly"}}>
                <p className="survey-header-element">Checked:<br/>Day 1-14</p>
                <p className="survey-header-element">Last Completed: <br/>Day {participant.getLastFilledDay() + 1}</p>
                {CYCLE_FINISHED ? 
                    <p className="survey-header-element">Cycle Finished<br/>(14 days)</p> : 
                    <p className="survey-header-element">Upcoming/Current Day:<br/>Day {participant.getCurrentCycle() + 1}</p>}
            </div>
        </div>)
}