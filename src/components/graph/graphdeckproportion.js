import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function GraphDeckProportion( {participant} ) {
    if(participant.getId() <= 7789) { return null }
    // suppress error from defaultProps and Recharts
    const error = console.error;
    console.error = (...args) => {
    if (/defaultProps/.test(args[0])) return;
    error(...args);
    };
    const rawData = participant.game.getBlockProportions()
    const data = [] 
    for (let i = 0; i < rawData.length; i++) {
        for (let j = 0; j < rawData[i].length; j++) {
            let curr = {
                day: i,
                block: i * rawData[i].length + j,
                deckA: rawData[i][j]["A"]/rawData[i][j]["total"],
                deckB: rawData[i][j]["B"]/rawData[i][j]["total"],
                deckC: rawData[i][j]["C"]/rawData[i][j]["total"],
                deckD: rawData[i][j]["D"]/rawData[i][j]["total"]
            }
            data.push(curr)
        }
    }
    console.log(rawData.length, rawData[0].length)

    return (
        <div>
            <h3>{participant.getId()} Deck Proportion</h3>
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
                    <XAxis dataKey="block" />
                    <YAxis domain={[0, 1]}/>    
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="deckA" stroke="steelblue" />
                    <Line type="monotone" dataKey="deckB" stroke="green" />
                    <Line type="monotone" dataKey="deckC" stroke="pink" />
                    <Line type="monotone" dataKey="deckD" stroke="orange" />
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}