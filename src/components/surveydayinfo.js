export default function SurveyDayInfo({day, participant}) {
    const completionRate = (participant.getPercentComplete()[day - 1] * 100).toFixed(2)
    const header_color = (completion) => {
        if (completion >= 90) { return "lightgreen" };
        if (completion === 0) { return "lightcoral"};
        return "plum";
    }
    return (
        <div className='dayinformation'>
            <div className={`day-header ${header_color}`} style={{backgroundColor: `${header_color(completionRate)}`}}>
                <h5>Day {day} - W{Math.floor((day - 1) / 7) + 1} ({participant.getDate(day - 1)})</h5>
            </div>
            <div className="day-details">
                <p>Completion: {completionRate}%</p>
            </div>
        </div>)
}