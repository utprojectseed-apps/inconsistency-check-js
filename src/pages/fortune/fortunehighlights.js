import CSVReader from "../../components/csvread";
import React, { useEffect, useRef, useReducer } from "react";
import * as dfd from 'danfojs';
import ParticipantList from "../../game_data/participants";
import CheckboxesTags from "../../components/checkboxestags";
import RadioHighlightReport from "../../components/radiohighlightreport";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import DomToImage from "dom-to-image";
import fileDownload from "js-file-download";
import { Button } from "@mui/material";
import GraphDeckProportion from "../../components/graph/graphdeckproportion";

export default function FortuneHighlights() {
    const [data, setData] = React.useState(undefined)
    const [, forceUpdate] = useReducer(x => x + 1, 0);
    const participantList = useRef(null)
    const [errorMessage, setErrorMessage] = React.useState(undefined)   
    const [selectedIds, setSelectedIds] = React.useState([])
    const [allParticipantsIds, setAllParticipantsIds] = React.useState(undefined)
    const [selectedReport, setSelectedReport] = React.useState("first-week")
    const handleUpload = d => {
        setData(d)
    }
    const handleSelected = d => {
        setSelectedIds(d)
    }
    const selectReport = report => {
        setSelectedReport(report)
    }
    useEffect(() => {
        if(data !== undefined) {
            const subjects = data['subject_id']
            if(subjects === undefined) {
                setErrorMessage("No 'subject_id' column found in data, please make sure you have a fortune deck dataset.")
            } else {
                let participants = new dfd.Series(data['subject_id'].values).unique()
                participantList.current = new ParticipantList(participants, data)
                setAllParticipantsIds(participantList.current.getIds())
                setErrorMessage(undefined)
            }
            forceUpdate()
        }
    }, [data])

    return (
        <div>
            <div className="no-print">
                <h1>Cognitive Highlights</h1>
                <CSVReader parentCallback={handleUpload} gameId="fortune" key="fortune"/>
                
                <div className='no-print' style={{display: 'flex'}}>
                    <CheckboxesTags ids={allParticipantsIds || []} parentCallback={handleSelected}/>
                    <div style={{marginLeft:'10px'}}>
                        <RadioHighlightReport parentCallback={selectReport} value={selectedReport}/>
                        <Button variant="contained" onClick={() => printPlease(selectedIds)} disableElevation>Print</Button>
                    </div>
                </div>
            </div>
            {errorMessage && <h2>{errorMessage}</h2>}
            <div id="cognitivehighlights">
                {!errorMessage && <ParticipantListHighlights selectedReport={selectedReport} participantList={participantList.current} activeIds={selectedIds}/>}
            </div>
        </div>
    )
}

function printPlease() {
    //TODO: print
    return;
}

function ParticipantListHighlights(props) {
    let participantList = props.participantList
    let participantIds = participantList ? participantList.getIds() : []
    const filteredParticipants = participantIds.filter(participant => {
        return props.activeIds.includes(participant)
    })
    const participants = filteredParticipants.map(participant => 
        <ParticipantHighlights key={participant}
        participant={participant}
        fortune={participantList && participantList.getParticipant(participant)}
        selectedReport={props.selectedReport}/>
    )
    return (
        participants
    )
}

function ParticipantHighlights(props) {
    let noData = <p>No data</p>
    let reportSelected = props.selectedReport === "first-week" ? 0 : 1
    let lastReport = reportSelected === 1
    let fortuneHighlight = props.fortune !== null ? props.fortune.game.getHighlights(reportSelected).map((highlight, index) => <p key={index}>{highlight}</p>) : noData
    return (
        <div>
            <h3>{props.participant} - Fortune Deck Highlights</h3>
            {fortuneHighlight}
            {lastReport && props.fortune !== null && <FortunePointsGraph participant={props.participant} game={props.fortune.game}/>}
            {lastReport && props.fortune !== null && <GraphDeckProportion key={props.participant} participant={props.fortune}/>}
        </div>
    )
}

const DAYSOFWEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
function FortunePointsGraph(props) {
    const rawData = props.game.getEndPoints()
    const data = []
    for (let i = 0; i < rawData.length; i++) {
        data.push({day: i + 1, y: rawData[i], weekday: i % 7})
    }
    const yMax = 5000
    const yMin = -500
    const yTicks = []
    for (let i = yMin; i <= yMax; i += 500) {
        yTicks.push(i)
    }
    //TODO: get start points from df
    const referenceValue = 2000
    return (
        <div>
            <h3>Fortune Deck Points</h3>
            <ResponsiveContainer width="95%" height={600}>
                <LineChart 
                    data={data}
                    width={500}
                    height={500}
                    margin={{
                        top: 10,
                        right: 30,
                        left: 30,
                        bottom: 5
                    }}>
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
                    <YAxis label={{ value: 'Points Earned', angle: -90, position: 'left', style: {textAnchor: 'middle'}, offset: 20}} 
                        type="number" 
                        domain={[-500, yMax]} 
                        ticks={yTicks}
                        />
                    <ReferenceLine y={referenceValue} stroke="red" strokeDasharray="3 3" />
                    <Tooltip />
                    <Legend />
                    <Line name="Points Earned" type="monotone" dataKey="y" stroke="#8884d8" activeDot={{ r: 8 }} 
                        strokeWidth={2.5}
                        dot={{ stroke:"#8884d8", strokeWidth: 4, r: 2, strokeDasharray:''}}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}