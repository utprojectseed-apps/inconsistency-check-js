import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function GraphReactionTime( {participant} ) {
    if(participant.getId() <= 7789) { return null }
    // suppress error from defaultProps and Recharts
    const error = console.error;
    console.error = (...args) => {
    if (/defaultProps/.test(args[0])) return;
    error(...args);
    };

    console.log('WHAT IS HAPP')
    const rawData = participant.game.getBlockReactTimes()
    const data = [] 
    for (let i = 0; i < rawData.length; i++) {
        let day = []
        for (let j = 0; j < rawData[i].length; j++) {
            let curr = {
                day: i,
                block: j,
                avgReactionTime: rawData[i][j]["rt"],
            }
            day.push(curr)
        }
        data.push(day)
    }
    console.log(rawData.length, rawData[0].length)

    const daysGraphs = data.map((day, index) => <GraphSingleDay key={index} data={day} day={index} id={participant.getId()}/>)
    return (
        <div className='proportion-graph'>
            {daysGraphs}
        </div>
    )
}

const GraphSingleDay = ({data, day, id}) => { 
        
    // Calculate the maximum value in the 'avgReactionTime' data
    let maxYValue = Math.max(...data.map(d => d.avgReactionTime));
    const tickIncrement = 100;
    let yAxisTicks = Array.from({ length: Math.ceil(maxYValue / tickIncrement) + 1 }, (_, i) => i * tickIncrement);
    let yDomain =  Math.ceil(maxYValue / tickIncrement) * tickIncrement

    if (isNaN(yDomain)) {
        maxYValue = 2000
        yAxisTicks = Array.from({ length: Math.ceil(maxYValue / tickIncrement) + 1 }, (_, i) => i * tickIncrement);
    }
  
    return (
        <div>
            <h3 style={{marginLeft: 20}}>{id} Deck Average Reaction Time Day: {day + 1}</h3>
            <ResponsiveContainer width={400} height={400}>
                <LineChart           
                    width={600}
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
                    <YAxis domain={[0, Math.ceil(maxYValue / tickIncrement) * tickIncrement]} ticks={yAxisTicks}/>    
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="avgReactionTime" stroke="#8884d8" activeDot={{ r: 8 }} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}