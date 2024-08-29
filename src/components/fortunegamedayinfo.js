export default function FortuneGameDayInfo({day, participant}) {
    const completion = participant.getCompletions()[day - 1]
    const header_color = (completion) => {
        if (completion >= 100) { return "lightgreen" };
        if (completion === 0) { return "lightcoral"};
        return "plum";
    }
    return (
        <div className='dayinformation'>
            <div className='day-bar' style={{width: `${completion}%`}}></div>
            <h2 className={`day-header ${header_color(completion)}`} style={{backgroundColor: `${header_color(completion)}`}}>Day: {day}</h2>
            <div className="day-details">
                <p>Completion: {completion}%</p>
                <ReportFortuneScore score={participant.game.getScore(day)}/>
            </div>
        </div>
    )
}

function ReportFortuneScore({score}) {
    return(
        <p>Score: {score}</p>
    )
}