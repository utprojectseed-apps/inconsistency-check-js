// this might become the file for all of the 3-games
// TODO: possibly add Simon and CS into here?

export default function BDSGameDayInfo({day, participant}) {
    const completion = participant.getCompletions()[day - 1]
    const averageDigitSpan = participant.getAverageDigitSpans()[day -1]
    const maxDigitSpanLength = participant.getMaxDigitSpans()[day -1]
    const maxCorrectDigitSpanLength = participant.getMaxCorrectDigitSpans()[day -1]
    const header_color = (completion) => {
        if (completion >= 100) { return "lightgreen" };
        if (completion === 0) { return "lightcoral"};
        return "plum";
    }
    return (
        <div className='dayinformation'>
            <div className='day-bar' style={{width: `${completion}%`}}></div>
            <h2 className={`day-header ${header_color}`} style={{backgroundColor: `${header_color(completion)}`}}>Day: {day}</h2>
            <div className="day-details">
                <p>BDS Completion: {completion}%</p>
                <p>Average digit span length: {averageDigitSpan}</p>
                <p>Max correct digit span length: {maxCorrectDigitSpanLength}</p>
                <p>Max digit span length: {maxDigitSpanLength}</p>
            </div>
        </div>
    )
}