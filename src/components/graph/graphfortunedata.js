import GraphDayScore from "./graphdayscore";
import GraphDeckProportion from "./graphdeckproportion";
import GraphReactionTime from "./graphreactiontime";
export default function GraphFortuneData( {participantList}) {
    const participants = participantList !== null && participantList.participants.map(
        participant => <GraphDayScore key={participant.id} participant={participant}/>)
    const proportions = participantList !== null && participantList.participants.map(
        participant => <GraphDeckProportion key={participant.id} participant={participant}/>)
    const reactionTimes = participantList !== null && participantList.participants.map(
        participant => <GraphReactionTime key={participant.id} participant={participant}/>)

    return (
        <div>
            {participants}
            {proportions}
            {reactionTimes}
        </div>
      );
}