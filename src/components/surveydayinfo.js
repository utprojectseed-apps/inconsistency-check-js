export default function SurveyDayInfo({day, participant}) {
    const completionRate = (participant.getPercentComplete()[day - 1] * 100).toFixed(2)
    const header_color = (completion) => {
        if (completion >= 90) { return "lightgreen" };
        if (completion === 0) { return "lightcoral"};
        return "plum";
    }
    return (
        <div className='dayinformation'>
            <h2 className={`day-header ${header_color}`} style={{backgroundColor: `${header_color(completionRate)}`}}>Day: {day}</h2>
            <div className="day-details">
                <p>Completion: {completionRate}%</p>
            </div>
        </div>)
}