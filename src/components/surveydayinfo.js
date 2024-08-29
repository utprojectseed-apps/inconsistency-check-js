export default function SurveyDayInfo({day, participant}) {
    const completionRate = (participant.getPercentComplete()[day - 1] * 100).toFixed(2)
    const header_color = (completion) => {
        let completionNum = parseFloat(completion)
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
                <h5>Day {day} - W{Math.floor((day - 1) / 7) + 1} ({participant.getDate(day - 1)})</h5>
                <h5>{(completionText())} ({completionRate}%)</h5>
                <h5>Survey Duration: {participant.getDuration(day - 1)}</h5>
                <h5>Submission Time: {participant.getSubmitTime(day - 1)}</h5>
            </div>
            <div className="day-details">
                <p>Completion: {completionRate}%</p>
            </div>
        </div>)
}