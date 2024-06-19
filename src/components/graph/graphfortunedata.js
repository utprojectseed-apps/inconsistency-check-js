import GraphDayScore from "./graphdayscore";
export default function GraphFortuneData( {participantList}) {
    const participants = participantList !== null && participantList.participants.map(
        participant => <GraphDayScore key={participant.id} participant={participant}/>)

    return (
        <div>
            {participants}
        </div>
      );
}