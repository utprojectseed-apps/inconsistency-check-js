// will most likely delete later and merge the 3 - game 
// just need to see if it works 

export default function SimonGameDayInfo({day, participant}) {
    const completion = participant.getCompletions()[day - 1]
    const numberSessions = participant.getNumberSessions()[day -1]
    const meanSessionAccuracy = participant.getMeanSessionAccuracy()[day -1]

    const practiceTrialsAmount = participant.getPracticeTrialsAmount()[day -1]
    const practiceTrialsAccuracy = participant.getPracticeTrialsAccuracy()[day -1]
    const noInputTrialsAmount = participant.getNoInputTrials()[day -1]

    // const noInputCount = participant.getNoInputCount()[day -1]
    const languageOfSession = participant.getLanguages()[day -1]

    const header_color = (completion) => {
        if (completion >= 100) { return "lightgreen"};
        if (completion === 0) { return "lightcoral"};
        return "plum";
    }
    return (
        <div className='dayinformation'>
            <div className='day-bar' style={{width: `${completion}%`}}></div>
            <h2 className={`day-header ${header_color}`} style={{backgroundColor: `${header_color(completion)}`}}>Day: {day}</h2>
            <div className="day-details">
                <p>Sessions started: {numberSessions}</p>
                <p>Session completion: {completion} %</p>
                <p>Mean session accuracy: {meanSessionAccuracy} %</p>
                <p>Practice trials accuracy: {practiceTrialsAccuracy} %</p>
                <p>Practice trials amount: {practiceTrialsAmount}</p>
                <p>No input count: {noInputTrialsAmount}</p>
                <p>Language: {languageOfSession}</p>
            </div>
        </div>
    )
}