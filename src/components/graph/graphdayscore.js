import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ResponsiveContainer } from 'recharts';
export default function GraphDayScore( {participant} ) {
    if(participant.getId() <= 7789) { return null }
    const rawData = participant.game.getScores()
    const data = [] 
    for (let i = 0; i < rawData.length; i++) {
        let curr = {
            name: i + 1,
            score: rawData[i]
        }
        data.push(curr)
    }

    return (
        <div>
            <h3>{participant.getId()} Scores</h3>
            <ResponsiveContainer width="100%" height={400}>
                <LineChart
                    width={500}
                    height={300}
                    data={data}
                    margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[-1, 1]}/>
                    <ReferenceLine y={0} stroke="red" strokeDasharray="3 3" />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="score" stroke="#8884d8" activeDot={{ r: 8 }} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}