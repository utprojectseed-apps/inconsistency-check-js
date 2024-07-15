import ParticipantStats from "../../components/7DayReport/participantstats";
export default function FortuneMiniReport({participantList}) {
    const participants = participantList !== null && participantList.participants.map(
        participant => <ParticipantStats key={participant.id} participant={participant}/>)
    return (
        <div>
            {participants}
        </div>
    )
}