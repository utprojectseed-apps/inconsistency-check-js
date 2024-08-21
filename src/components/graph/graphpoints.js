import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

export default function GraphPoints( {participant} ) {
    // suppress error from defaultProps and Recharts
    const error = console.error;
    console.error = (...args) => {
    if (/defaultProps/.test(args[0])) return;
    error(...args);
    };
    const rawData = participant.game.getGraphPoints()
    const data = [] 
    for (let i = 0; i < rawData.length; i++) {
        let day = []
        if(rawData[i] === undefined) { 
            data.push(day)
            continue; 
        }
        for (let j = 0; j < rawData[i].length; j++) {
            let curr = {
                x: rawData[i][j]["x"],
                y: rawData[i][j]["y"]
            }
            day.push(curr)
        }
        data.push(day)
    }
    const daysGraphs = data.map((day, index) => <GraphSingleDay key={index} data={day} day={index} id={participant.getId()}/>)
    return (
        <div className="proportion-graph">
            {daysGraphs}
        </div>
    )
}

const GraphSingleDay = ({data, day, id}) => {
    const xTicks = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
    return (
        <div>
            <h3 style={{marginLeft: 20}}>Day {day + 1} Score</h3>
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
                    <XAxis xAxisId={0} dataKey="x" hide={true}/>
                    <XAxis xAxisId={1} label={{value: `Today's Points`}} tick={false}/>
                    <YAxis domain={[0, 5000]}/>    
                    <Tooltip />
                    <Legend />
                    <ReferenceLine y={2500} stroke="red"/>
                    <Line type="monotone" dataKey="y" name="Points" stroke="#1b9e77" strokeWidth={2.5}
                        dot={{ stroke:"#1b9e77", strokeWidth: 0, r: 0, strokeDasharray:''}}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}