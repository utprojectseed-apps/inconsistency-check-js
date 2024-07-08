import CSVReader from "../../components/csvread";
import React, { useEffect, useRef, useReducer } from "react";
import * as dfd from 'danfojs';
import ParticipantList from "../../game_data/participants";
import CheckboxesTags from "../../components/checkboxestags";
import RadioHighlightReport from "../../components/radiohighlightreport";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ResponsiveContainer } from 'recharts';

export default function CognitiveHighlights() {
    const [bdsData, setBdsData] = React.useState(undefined)
    const [simonData, setSimonData] = React.useState(undefined)
    const [csData, setCsData] = React.useState(undefined)
    const [, forceUpdate] = useReducer(x => x + 1, 0);
    const bdsList = useRef(null)
    const simonList = useRef(null)
    const csList = useRef(null)
    const [errorMessage, setErrorMessage] = React.useState(undefined)   
    const [selectedIds, setSelectedIds] = React.useState([])
    const [allParticipantsIds, setAllParticipantsIds] = React.useState(undefined)
    const [selectedReport, setSelectedReport] = React.useState("first-week")
    const handleUpload = (d, game) => {
        switch(game) {
            case "bds":
                setBdsData(d)
                break
            case "simon":
                setSimonData(d)
                break
            case "cs":
                setCsData(d)
                break
            default:
                throw new Error("Unknown game: " + game);
        }
    }
    const handleSelected = d => {
        setSelectedIds(d)
    }
    const selectReport = report => {
        setSelectedReport(report)
    }
    useEffect(() => {
        if(bdsData !== undefined) {
            const subjects = bdsData['Subject']
            if(subjects === undefined) {
                setErrorMessage("No 'subject_id' column found in data, please make sure you have a fortune deck dataset.")
            } else {
                let participants = new dfd.Series(bdsData['Subject'].values).unique()
                // a bit jank so it will have to do for now
                // eventually should probably be one list but current class infrastructure doesn't support that due to poor planning :(
                bdsList.current = bdsData !== undefined ? new ParticipantList(participants, bdsData) : null
                simonList.current = simonData !== undefined ? new ParticipantList(participants, simonData) : null
                csList.current = csData !== undefined ? new ParticipantList(participants, csData) : null
                let allList = []
                allList.push(...[bdsList.current, simonList.current, csList.current].filter(list => list !== null && list !== undefined))
                let participantIds = new Set(...allList.map(participantList => participantList.participants.map(participant => participant.id)))
                setAllParticipantsIds([...participantIds])
                setErrorMessage(undefined)
            }
            forceUpdate()
        }
    }, [bdsData, simonData, csData])

    return (
        <div>
            <div className="no-print">
                <h1>Cognitive Highlights</h1>
                <CSVReader parentCallback={handleUpload} gameId="bds" key="bds"/>
                <CSVReader parentCallback={handleUpload} gameId="simon" key="simon"/>
                <CSVReader parentCallback={handleUpload} gameId="cs" key="cs"/>
                
                <div className='no-print' style={{display: 'flex'}}>
                    <CheckboxesTags ids={allParticipantsIds || []} parentCallback={handleSelected}/>
                    <div style={{marginLeft:'10px'}}>
                        <RadioHighlightReport parentCallback={selectReport} value={selectedReport}/>
                    </div>
                </div>
            </div>
            {errorMessage && <h2>{errorMessage}</h2>}
            {!errorMessage && <ParticipantListHighlights selectedReport={selectedReport} bdsList={bdsList.current} simonList={simonList.current} csList={csList.current} activeIds={selectedIds}/>}
        </div>
    )
}
function ParticipantListHighlights(props) {
    let bdsList = props.bdsList
    let simonList = props.simonList
    let csList = props.csList
    let allList = []
    allList.push(...[bdsList, simonList, csList].filter(list => list !== null && list !== undefined))
    let participantIds = new Set(...allList.map(participantList => participantList.participants.map(participant => participant.id)))
    const filteredParticipants = Array.from(participantIds).filter(participant => {
        return props.activeIds.includes(participant)})
    const participants = filteredParticipants.map(
        participant => <ParticipantHighlights key={participant} 
        participant={participant} 
        bds={bdsList && bdsList.getParticipant(participant)} 
        simon={simonList && simonList.getParticipant(participant)} 
        cs={csList && csList.getParticipant(participant)}
        selectedReport={props.selectedReport}/>)
    return (
        participants
    )
}

function ParticipantHighlights(props) {
    let noData = <p>No data</p>
    let reportSelected = props.selectedReport === "first-week" ? 0 : 1
    let lastReport = reportSelected === 1
    let bdsHighlight = props.bds !== null ? props.bds.game.getHighlights(reportSelected).map((highlight, index) => <p key={index}>{highlight}</p>) : noData
    let simonHighlight = props.simon !== null ? props.simon.game.getHighlights(reportSelected).map((highlight, index) => <p key={index}>{highlight}</p>) : noData
    let csHighlight = props.cs !== null ? props.cs.game.getHighlights(reportSelected).map((highlight, index) => <p key={index}>{highlight}</p>) : noData
    return (
        <div>
            <h3>{props.participant} - Digit Span</h3>
            {bdsHighlight}
            {lastReport && props.bds !== null && <BdsAverageScoreGraph game={props.bds.game}/>}
            <div className="print-together">
                <h3>{props.participant} - Simon</h3>
                {simonHighlight}
                {lastReport && props.simon !== null && <AccuracyScoreGraph game={props.simon.game} gameName={"Simon"}/>}
                {lastReport && props.simon !== null && <ReactionTimeGraph game={props.simon.game} gameName={"Simon"}/>}
            </div>
            <div className="print-together">
                <h3>{props.participant} - Color Shape</h3>
                {csHighlight}
                {lastReport && props.cs !== null && <AccuracyScoreGraph game={props.cs.game} gameName={"Color Shape"}/>}
                {lastReport && props.cs !== null && <ReactionTimeGraph game={props.cs.game} gameName={"Color Shape"}/>}
            </div>
        </div>
    )
}

const DAYSOFWEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
function BdsAverageScoreGraph(props) {
    const rawData = props.game.getMaxDigitSpanDays()
    const data = []
    for (let i = 0; i < rawData.length; ++i) {
        if(rawData[i] === 0) continue;
        data.push({day: i + 1, weekday: i % 7, digitSpanLength: rawData[i]});
    }
    const yMax = Math.max(...rawData, 8)
    const yTicks = Array.from({length: yMax + 1}, (_, i) => i);
    return (
        <div className='print-together'>
            <h3>Digit Span Scores</h3>
            <ResponsiveContainer width="100%" height={600}>
                <LineChart
                    width={500}
                    height={500}
                    data={data}
                    margin={{
                        top: 0,
                        right: 30,
                        left: 20,
                        bottom: 5
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis xAxisId="0" dataKey="day" type="number" domain={[1, 14]} tickCount={14}/>
                    <XAxis xAxisId="1" label={{value: "Day", position: 'insideBottom'}} 
                        height={30}
                        dy={-10}
                        dataKey="day" 
                        type="number" 
                        domain={[1, 14]} 
                        tickCount={14} 
                        tickFormatter={(day) => DAYSOFWEEK[(day - 1) % 7]}
                        axisLine={false}
                        tickLine={false}
                        />

                    <YAxis label={{ value: 'Max Digit Length', angle: -90, position: 'left', style: {textAnchor: 'middle'}}} 
                        type="number" domain={[0, yMax]} 
                        ticks={yTicks} 
                        interval={1}/>
                    <Tooltip />
                    <Legend />
                    <Line name="Digit Span Length" type="monotone" dataKey="digitSpanLength" stroke="#8884d8" activeDot={{ r: 8 }} 
                        strokeWidth={2.5}
                        dot={{ stroke:"#8884d8", strokeWidth: 4, r: 2, strokeDasharray:''}}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}

function AccuracyScoreGraph(props) {
    const gameName = props.gameName
    const rawData = props.game.getMeanSessionsAccuracys()
    const data = []
    for (let i = 0; i < rawData.length; ++i) {
        if(rawData[i] === 0) continue;
        data.push({day: i + 1, weekday: i % 7, accuracy: rawData[i]});
    }
    const yTicks = Array.from({length: 11}, (_, i) => i * 10)
        .filter((_, i) => i <= 10) // don't want to exceed 100
        .map(n => n.toFixed(0));
    
    return (
        <div className="print-together">
            <h3>{gameName} Accuracy</h3>
            <ResponsiveContainer width="100%" height={600}>
                <LineChart
                    width={500}
                    height={500}
                    data={data}
                    margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis xAxisId="0" dataKey="day" type="number" domain={[1, 14]} tickCount={14}/>
                    <XAxis xAxisId="1" label={{value: "Day", position: 'insideBottom'}} 
                        height={30}
                        dy={-10}
                        dataKey="day" 
                        type="number" 
                        domain={[1, 14]} 
                        tickCount={14} 
                        tickFormatter={(day) => DAYSOFWEEK[(day - 1) % 7]}
                        axisLine={false}
                        tickLine={false}
                        />
                    <YAxis label={{ value: 'Accuracy', angle: -90, position: 'left', style: {textAnchor: 'middle'}}} 
                        type="number" 
                        domain={[0, 100]} 
                        tickCount={11}
                        interval={0}
                        />
                    <Tooltip />
                    <Legend />
                    <Line name="Session Accuracy" type="monotone" dataKey="accuracy" stroke="#8884d8" activeDot={{ r: 8 }} 
                        strokeWidth={2.5}
                        dot={{ stroke:"#8884d8", strokeWidth: 4, r: 2, strokeDasharray:''}}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}

function ReactionTimeGraph(props) {
    const gameName = props.gameName
    const rawData = props.game.getMeanReactionTime()
    const data = []
    for (let i = 0; i < rawData.length; ++i) {
        if(rawData[i] === 0) continue;
        data.push({day: i + 1, weekday: i % 7, reactionTime: rawData[i]});
    }

    return (
        <div className="print-together">
            <h3>{gameName} Reaction Time</h3>
            <ResponsiveContainer width="100%" height={600}>
                <LineChart
                    width={500}
                    height={500}
                    data={data}
                    margin={{
                        top: 50,
                        right: 30,
                        left: 30,
                        bottom: 5
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis xAxisId="0" dataKey="day" type="number" domain={[1, 14]} tickCount={14}/>
                    <XAxis xAxisId="1" label={{value: "Day", position: 'insideBottom'}} 
                        height={30}
                        dy={-10}
                        dataKey="day" 
                        type="number" 
                        domain={[1, 14]} 
                        tickCount={14} 
                        tickFormatter={(day) => DAYSOFWEEK[(day - 1) % 7]}
                        axisLine={false}
                        tickLine={false}
                        />
                    <YAxis label={{ value: 'Average Reaction Time', angle: -90, position: 'left', style: {textAnchor: 'middle'}}} 
                        type="number" 
                        tickCount={10}
                        
                        />
                    <Tooltip />
                    <Legend />
                    <Line name="Average Reaction Time" type="monotone" dataKey="reactionTime" stroke="#8884d8" activeDot={{ r: 8 }} 
                        strokeWidth={2.5}
                        dot={{ stroke:"#8884d8", strokeWidth: 4, r: 2, strokeDasharray:''}}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}