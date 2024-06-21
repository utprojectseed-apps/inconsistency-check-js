// this might become the file for all of the 3-games
// TODO: possibly add Simon and CS into here?
// hm maybe need to think this through more

// need to get information for specific games 
// i can either add condiditon here or seperate files for each game 

export default function BDSGameDayInfo({day, participant}) {
    const completion = participant.getCompletions()[day - 1]
    const averageDigitSpan = participant.getAverageDigitSpans()[day -1]
    const maxDigitSpanLength = participant.getMaxDigitSpans()[day -1]
    const maxCorrectDigitSpanLength = participant.getMaxCorrectDigitSpans()[day -1]
    const numberSessions = participant.getNumberSessions()[day -1]
    const header_color = (completion) => {
        if (completion >= 100) { return "lightgreen" };
        if (completion === 0) { return "lightcoral"};
        return "plum";
    }
    return ( // TODO fix the style so we have seperate sections for each game per day
        <div className='dayinformation'>
            <div className='day-bar' style={{width: `${completion}%`}}></div>
            <h2 className={`day-header ${header_color}`} style={{backgroundColor: `${header_color(completion)}`}}>Day: {day}</h2>
            <div className="day-details">
                <p>Sessions started: {numberSessions}</p>
                <p>Mean Session accuracy:</p>

                <div className="bds-specific-details">
                    <p>(BDS) session completion: {completion} %</p>
                    <p>Average digit span length: {averageDigitSpan}</p>
                    <p>Max correct digit span length: {maxCorrectDigitSpanLength}</p>
                    <p>Max digit span length: {maxDigitSpanLength}</p>
                </div> 
            </div>
        </div>
    )
}