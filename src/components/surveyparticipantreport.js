import SurveyDayInfo from "./surveydayinfo";

export default function SurveyParticipantReport({participant}) {
    if(participant === null) { return null }
    const days = participant.getPercentComplete().map((p, i) => {
        return <SurveyDayInfo key={i} day={i + 1} participant={participant}/>
    })
    return (
        <div>
            <ParticipantHeader participant={participant}/>
            {days}
        </div>
    )
}

function ParticipantHeader({participant}) {
    if(participant === null) { return null }
    const CYCLE_FINISHED = participant.getCurrentCycle() >= 13
    const CYCLE_DAY = participant.getCurrentCycle()
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

            <div style={{display: "flex", justifyContent: "space-evenly"}}>
                {CYCLE_FINISHED ? 
                    <p className="survey-header-element">Total compensation earned:<br/>$ {participant.getCumulativeComp(CYCLE_DAY)}</p> :
                     
                    <div style={{display: "flex", justifyContent: "space-evenly", width: "100%"}}>
                        <p className="survey-header-element">Compensation so far:<br/>$ {participant.getCumulativeComp(CYCLE_DAY)}</p>
                        <p className="survey-header-element">On track to earn (tonight):<br/>$ {participant.getPotentialCumulativeComp(CYCLE_DAY)}<br/></p>
                        <p className="survey-header-element">On track to earn (14 days):<br/>$ {participant.getPotentialCumulativeComp(13)}</p>
                    </div>
                    }
            </div>
        </div>)
}