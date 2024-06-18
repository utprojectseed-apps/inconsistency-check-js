// this might become the file for all of the 3-games
// TODO: possibly add Simon and CS into here?

export default function BDSGameDayInfo({day, participant}) {
    const completion = participant.getCompletions()[day - 1]
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
            </div>
        </div>
    )
}