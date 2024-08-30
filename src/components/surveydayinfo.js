export default function SurveyDayInfo({day, participant}) {
    const completionRate = (participant.getPercentComplete()[day - 1] * 100).toFixed(2)
    const header_color = (completion) => {
        let completionNum = parseFloat(completion)
        if (!participant.cyclePassed(day - 1)) { return "orange" };
        if (completionNum >= 90) { return "lightgreen" };
        if (completionNum === 0) { return "lightcoral"};
        return "plum";
    }
    const completionText = () => {
        if (participant.getDay(day - 1) === 2) { return "SURVEY COMPLETED" };
        if (participant.getDay(day - 1) === 1) { return "PARTIALLY COMPLETED" };
        return "NOT COMPLETED"
    }
    return (
        <div className='dayinformation'>
            <div className={`day-header ${header_color(completionRate)}`} style={{backgroundColor: `${header_color(completionRate)}`}}>
                <h4>Day {day} - W{Math.floor((day - 1) / 7) + 1} ({participant.getDate(day - 1)})</h4>
                <h4>{(completionText())} ({completionRate}%)</h4>
                <h4>Survey Duration: {participant.getDuration(day - 1)}</h4>
                <h4>Submission Time: {participant.getSubmitTime(day - 1)}</h4>
            </div>
            <ParticipantCompensationTable day={day} participant={participant}/>
            <div className="day-details">
                <p>Completion: {completionRate}%</p>
            </div>
        </div>)
}

function ParticipantCompensationTable({day, participant}) {
    const COMP_PERCENTAGE = participant.getPercentComplete()[day - 1]
    return (
        <div>
            <div className="survey-compensation-table">
                {
                    (() => {
                        if(COMP_PERCENTAGE > 0.35) {
                            let BONUS_TYPE = participant.getBonusType(day - 1)
                            if (BONUS_TYPE !== '') {
                                return <p>Bonus: {BONUS_TYPE}</p>
                            } else {
                                return <p>BASE DAY COMPENSATION</p>
                            }
                        } else if (COMP_PERCENTAGE > 0) {
                            return <p>No bonus given</p>
                        } else {
                            return <p>No compensation earned</p>
                        }
                    })()
                }

                <p>Daily Compensation: <br/>$ {participant.getCumulativeComp(day - 1).toFixed(2)}</p>
                <p></p>
                {
                    participant.cyclePassed(day - 1) ? 
                        <p>Cumulative compensation<br/>$ {participant.getCumulativeComp(day - 1).toFixed(2)}</p> : 
                        <p>Compensation if completed:<br/>$ {participant.getPotentialCumulativeComp(day - 1).toFixed(2)}</p>
                }
            </div>
        </div>
    )
}