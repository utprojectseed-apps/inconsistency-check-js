import participantStats7Day from "./participantstats"

export default function FortuneMiniReport({participantList}) {
    const participants = participantList !== null && participantList.participants.map(
        participant => <participantStats7Day key={participant.id} participant={participant}/>)

    return (
        <div>
            {participants}
        </div>
    )
}