import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function GraphDeckProportion( {participant} ) {
    if(participant.getId() !== "77897798" ) { return null }
    // suppress error from defaultProps and Recharts
    const error = console.error;
    console.error = (...args) => {
    if (/defaultProps/.test(args[0])) return;
    error(...args);
    };
    const rawData = participant.game.getBlockProportions()
    const data = [] 
    for (let i = 0; i < rawData.length; i++) {
        let day = []
        for (let j = 0; j < rawData[i].length; j++) {
            let curr = {
                day: i,
                block: j,
                deckA: rawData[i][j]["A"]/rawData[i][j]["total"] * 100,
                deckB: rawData[i][j]["B"]/rawData[i][j]["total"] * 100,
                deckC: rawData[i][j]["C"]/rawData[i][j]["total"] * 100,
                deckD: rawData[i][j]["D"]/rawData[i][j]["total"] * 100
            }
            day.push(curr)
        }
        data.push(day)
    }
    console.log(rawData.length, rawData[0].length)
    const daysGraphs = data.map((day, index) => <GraphSingleDay key={index} data={day} day={index} id={participant.getId()}/>)
    return (
        <div className="proportion-graph">
            {daysGraphs}
        </div>
    )
}

const GraphSingleDay = ({data, day, id}) => {
    return (
        <div >
            <h3 style={{marginLeft: 20}}>Deck Choice Day: {day + 1}</h3>
            <ResponsiveContainer width={500} height={400}>
                <LineChart           
                    width={400}
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
                    <YAxis domain={[0, 100]}/>    
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="deckA" name="Deck A" stroke="#1b9e77" strokeWidth={2.5}
                        dot={{ stroke:"#1b9e77", strokeWidth: 4, r: 2, strokeDasharray:''}}
                    />
                    <Line type="monotone" dataKey="deckB" name="Deck B" stroke="#d95f02" strokeWidth={2.5}
                        dot={{ stroke:"#d95f02", strokeWidth: 4, r: 2, strokeDasharray:''}}
                    />
                    <Line type="monotone" dataKey="deckC" name="Deck C" stroke="#7570b3" strokeWidth={2.5}
                        dot={{ stroke:"#7570b3", strokeWidth: 4, r: 2, strokeDasharray:''}}
                    />
                    <Line type="monotone" dataKey="deckD" name="Deck D" stroke="#e7298a" strokeWidth={2.5}
                        dot={{ stroke:"#e7298a", strokeWidth: 4, r: 2, strokeDasharray:''}}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}