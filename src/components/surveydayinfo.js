import Strikes from "../survey/surveystrikes.js";

export default function SurveyDayInfo({day, participant}) {
    const completionRate = (participant.getPercentComplete()[day - 1] * 100).toFixed(2)
    const header_color = (completion) => {
        let completionNum = parseFloat(completion)
        if (!participant.cyclePassed(day - 1)) { return "orange" };
        if (completionNum >= 90) { return "lightgreen" };
        if (completionNum === 0) { return "lightcoral" };
        return "plum";
    };
    const completionText = () => {
        if (participant.getDay(day - 1) === 2) { return "SURVEY COMPLETED" };
        if (participant.getDay(day - 1) === 1) { return "PARTIALLY COMPLETED" };
        return "NOT COMPLETED"
    };
    const strikes = participant.getStrikesForDay(day - 1);
    const isMissingSurvey = participant.cyclePassed(day - 1) && participant.getPercentComplete()[day - 1] === 0 && participant.getDay(day - 1) === 0;
    return (
        <div className='dayinformation'>
            <div className={`day-header ${header_color(completionRate)}`} style={{backgroundColor: `${header_color(completionRate)}`}}>
                <h4>Day {day} - W{Math.floor((day - 1) / 7) + 1} ({participant.getDate(day - 1)})</h4>
                <h4>{(completionText())} ({completionRate}%)</h4>
                <h4>Survey Duration: {participant.getDuration(day - 1)}</h4>
                <h4>Submission Time: {participant.getSubmitTime(day - 1)}</h4>
            </div>
            <DayReportedIssues day={day} participant={participant} />
            <ParticipantCompensationTable day={day} participant={participant}/>
            <div className="day-details">
                <p>Completion: {completionRate}%</p>
            </div>
            <div className="day-strikes">
                <h4>Strikes:</h4>
                {isMissingSurvey ? (
                    <p style={{color: 'red'}}>Missing Survey</p>
                ) : (
                    strikes.length > 0 ? (
                        <ul>
                            {strikes.map((strike, index) => (
                                <li key={index} style={{color: "red"}}>{strike}</li>
                            ))}
                        </ul>
                    ) : (
                        <p>No strikes for this day.</p>
                    )
                )}
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

                <p>Daily Compensation: <br/>{participant.getCompRate(day - 1)}</p>
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

function DayReportedIssues({day, participant}) {

    if (!participant || !participant.data) return null;
    const colName = `t${day}qintc`;
    if (!participant.data.columns.includes(colName)) return null;
    const rawVal = participant.data[colName].values[0];
    if (rawVal === undefined || rawVal === null) return null;
    if (typeof rawVal === 'string' && rawVal.trim() === '') return null;
    if (rawVal === '[not completed]') return null;

    let displayVal = rawVal;
    if (participant.dataDict) {
        try {
            const answersMap = participant.dataDict.getAnswers(colName);
            if (answersMap && typeof answersMap === 'object') {
                const mapped = answersMap[rawVal];
                if (mapped !== undefined) displayVal = mapped;
            }
        } catch (e) {

        }
    }

    return (
        <div className="day-reported-issues">
            <h4>Issue:</h4>
            <textarea readOnly rows={3} style={{width: '100%'}} value={displayVal}></textarea>
        </div>
    )
}