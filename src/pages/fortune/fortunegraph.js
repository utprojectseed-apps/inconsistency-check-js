import CSVReader from "../../components/csvread";
import React, { useEffect, useRef, useReducer } from "react";
import * as dfd from 'danfojs';
import ParticipantList from "../../game_data/participants";
import GraphFortuneData from "../../components/graph/graphfortunedata";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';


export default function FortuneGraph() {
    const [data, setData] = React.useState(undefined)
    const [, forceUpdate] = useReducer(x => x + 1, 0);
    const participantList = useRef(null)
    const [errorMessage, setErrorMessage] = React.useState(undefined)   
    const handleUpload = d => {
        setData(d)
    }
    useEffect(() => {
        if(data !== undefined) {
            const subjects = data['subject_id']
            if(subjects === undefined) {
                setErrorMessage("No 'subject_id' column found in data, please make sure you have a fortune deck dataset.")
            } else {
                let participants = new dfd.Series(data['subject_id'].values).unique()
                participantList.current = new ParticipantList(participants, data)
                setErrorMessage(undefined)
            }
            forceUpdate()
        }
    }, [data])
    return (
        <div className='games'>
            <h1>Enter data</h1>
            <CSVReader parentCallback={handleUpload} gameId = "fortune"/>
            {errorMessage && <h2>{errorMessage}</h2>}
            {!errorMessage && <FortuneAllGraph participantList={participantList.current}/>}
            {!errorMessage && <GraphFortuneData participantList={participantList.current}/>}
        </div>
    )
}

function FortuneAllGraph(props) {
    const participantList = props.participantList
    if(participantList === null) {
        return null
    }
    const data = Array(14).fill({}).map((_, i) => ({ index: i + 1 }))
    const allParticipants = participantList.participants;
    for(let i = 0; i < allParticipants.length; i++) {
        let participant = allParticipants[i]
        let score = participant.game.getScores()
        for(let day = 1; day <= 14; day++) {
            data[day - 1][participant.getId()] = score[day - 1]
        }
    }
    // const lines = participantList.getIds().map(id => <Line type="monotone" datakey={id+""} name={id} activeDot={{ r: 8 }} />)
    console.log(data)
    const hexColors = ["#519DE9", "#7CC674", "#8481DD", "#F6D173", "#EF9234", "#A30000", "#6A6E73", "#73C5C5"]

    return (
        <div>
            <h3>All Scores</h3>
            <ResponsiveContainer key={1} width="100%" height={400}>
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
                    <XAxis dataKey="index" />
                    <YAxis domain={[-1, 1]}/>
                    <ReferenceLine y={0} stroke="red" strokeDasharray="3 3" />
                    <Tooltip />
                    <Legend />
                     {
                        participantList.getIds().map((id, i) => {
                            return (<Line key={id} type="monotone" dataKey={id+""} name={id} dot={false} activeDot={{ r: 8 }} stroke={hexColors[i % hexColors.length]} strokeWidth={2} />)
                        })
                     }
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}