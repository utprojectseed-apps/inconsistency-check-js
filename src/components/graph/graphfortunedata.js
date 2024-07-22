import GraphDayScore from "./graphdayscore";
import GraphDeckProportion from "./graphdeckproportion";
export default function GraphFortuneData( {participantList}) {
    const participants = participantList !== null && participantList.participants.map(
        participant => <GraphDayScore key={participant.id} participant={participant}/>)
    const proportions = participantList !== null && participantList.participants.map(
        participant => <GraphDeckProportion key={participant.id} participant={participant}/>)

    return (
        <div>
            {participants}
            {proportions}
        </div>
      );
}