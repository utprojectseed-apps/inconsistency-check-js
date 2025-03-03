import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

export default function GraphPoints( {participant, lang, daysToShow = 14} ) {
    // suppress error from defaultProps and Recharts
    const error = console.error;
    console.error = (...args) => {
    if (/defaultProps/.test(args[0])) return;
    error(...args);
    };
    const rawData = participant.game.getGraphPoints()
    const startDay = Math.max(0, rawData.length - daysToShow)

    const data = [] 
    for (let i = startDay; i < rawData.length; i++) {
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
    const daysGraphs = data.map((day, index) => <GraphSingleDay key={index} data={day} day={startDay + index} id={participant.getId()} lang={lang}/>)
    return (
        <div className="proportion-graph">
            {daysGraphs}
        </div>
    )
}

const GraphSingleDay = ({data, day, id, lang}) => {

    return (
        <div>
            <h3 style={{marginLeft: 20}}>{lang.getString("graphDayScore", {day: day + 1})}</h3>
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
                    <CartesianGrid strokeDasharray="3 3"/>
                    <XAxis xAxisId="0" dataKey="x" type="number" domain={[0, 80]} tickCount={11} hide={true}/>
                    <XAxis xAxisId="1" label={{value: lang.getString("graphToday"), position: 'insideBottom', dy: 35}}
                        height={30}
                        dy={5}
                        dataKey="x"
                        type="number"
                        domain={[0, 80]}
                        tickCount={11}
                        tickLine={true}
                        axisLine={true}/>
                    <YAxis domain={[0, 5000]} ticks={[0, 1250, 2500, 3750, 5000]}/>    
                    <Tooltip />
                    <Legend 
                        verticalAlign="bottom" 
                        align="center" 
                        wrapperStyle={{ paddingTop: 40, marginTop: 90 }}
                    />
                    <ReferenceLine y={2500} stroke="red"/>
                    <Line type="monotone" dataKey="y" name={lang.getString("graphPoints")} stroke="#1b9e77" strokeWidth={2.5}
                        dot={{ stroke:"#1b9e77", strokeWidth: 0, r: 0, strokeDasharray:''}} isAnimationActive={false}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}