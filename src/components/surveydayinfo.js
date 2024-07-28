export default function SurveyDayInfo({day, participant}) {
    const completionRate = (participant.getPercentComplete()[day - 1] * 100).toFixed(2)
    return (
        <div>
            <h3>Day Info</h3>
            <p>Day: {day}</p>
            <p>Completion: {completionRate}%</p>
        </div>)
}