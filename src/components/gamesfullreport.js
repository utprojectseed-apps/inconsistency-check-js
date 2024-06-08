export default function GameFullReport({participantList}) {
    return (
        <div>
            <h1>TODO</h1>
            <p>{participantList !== null && participantList.getIds()}</p>
            <div>{participantList !== null && participantList.getCompletions().map((c, i) => <p key={i}>{c + " "}</p>)}</div>
        </div>
    )
}