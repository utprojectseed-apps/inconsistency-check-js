import FortuneGameDayInfo from "./fortunegamedayinfo";
import BDSGameDayInfo from "./bdstaskdayinfo";
import SimonGameDayInfo from "./simontaskdayinfo";
import CSGameDayInfo from "./cstaskdayinfo";

export default function GamesParticipantReport({participant}) {
    if(participant === null) { return null }
    const days = participant.getCompletions().map(
        (c, i) => {
            if (participant.getGameName() === "Fortune Decks") {
                return <FortuneGameDayInfo key={i} day={i + 1} participant={participant} game={participant.game} score={c}/>
            } else if (participant.getGameName() === "BDS Task") {
                    return <BDSGameDayInfo key={i} day={i + 1} participant={participant} game={participant.game}/>
            } else if (participant.getGameName() === "Simon Task") {
                return <SimonGameDayInfo key={i} day={i + 1} participant={participant} game={participant.game}/>
            }  else if (participant.getGameName() === "CS Task") {
                return <CSGameDayInfo key={i} day={i + 1} participant={participant} game={participant.game}/>
            }
            return null
        })
    return (
        <div className='gameparticipantreport'>
            <ParticipantHeader participant={participant}/>
            {days}
        </div>
    )
}

function ParticipantHeader({participant}) {
    if(participant === null) { return null }
    // determine the most recent day that this game shows activity (1-based)
    let lastPlayed = 0
    const totalDays = 14
    for (let i = totalDays - 1; i >= 0; --i) {
        const sessions = participant.game?.getNumberSessionsDays()?.[i] ?? 0
        const comp = participant.game?.getCompletedDays()?.[i] ?? 0
        if ((Array.isArray(sessions) && sessions.length > 0) || (typeof sessions === 'number' && sessions > 0) || comp > 0) {
            lastPlayed = i + 1
            break
        }
    }
    const dayToCheck = lastPlayed > 0 ? lastPlayed : 1

    const strikes = participant.game?.strikes ? participant.game.strikes.getStrikesForDay(dayToCheck) : []
    const maxSeverity = (strikes || []).reduce((max, s) => Math.max(max, s && typeof s.severity !== 'undefined' ? s.severity : 0), 0)
    let contactText = '--'
    if (maxSeverity === 2) contactText = 'PHONE CALL'
    else if (maxSeverity === 1) contactText = 'TEXT MESSAGE'

    return (
        <div className='participant-header'>
            <h1 className='participant-id'>Participant ID: {participant.id}</h1>
            <h2>Game: {participant.getGameName()}</h2>
            <h3>Contact Needed: {contactText}</h3>
            <h3>Cycle start date: {participant.game.getCycleStartDate()}</h3>
        </div>)
}
