export default function GamesDayInformation({day, completion}) {
    return (
        <div className='dayinformation'>
            <h2>Day: {day}</h2>
            <div><p>Completion: {completion}%</p></div>
        </div>
    )
}