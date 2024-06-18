import FortuneGameDayInfo from "./fortunegamedayinfo";
import BDSGameDayInfo from "./bdstaskinfo";

export default function GamesParticipantReport({participant}) {
    if(participant === null) { return null }
    const days = participant.getCompletions().map(
        (c, i) => {
            if (participant.getGameName() === "Fortune Decks") {
                return <FortuneGameDayInfo key={i} day={i + 1} participant={participant} game={participant.game} score={c}/>
            } else if (participant.getGameName() === "BDS Task") {
                    return <BDSGameDayInfo key={i} day={i + 1} participant={participant} game={participant.game}/> //TODO: BDSGameDayInfo</>
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
    return (
        <div className='participant-header'>
            <h1 className='participant-id'>Participant ID: {participant.id}</h1>
            <h2>Game: {participant.getGameName()}</h2>
            <h3>Cycle start date: {participant.game.getCycleStartDate()}</h3>
        </div>)
}
