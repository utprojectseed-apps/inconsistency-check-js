import GamesDayInformation from "./gamesdayinformation";

export default function GamesParticipantReport({participant}) {
    const days = participant !== null && participant.getCompletions().map(
        (c, i) => <GamesDayInformation key={i} day={i+1} completion={c}/>)
    if(participant === null) { return null }
    return (
        <div className='gameparticipantreport'>
            <h1>Participant ID: {participant !== null && participant.id}</h1>
            {days}
        </div>
    )
}