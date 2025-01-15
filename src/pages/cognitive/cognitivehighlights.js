import CSVReader from "../../components/csvread";
import React, { useEffect, useRef, useReducer } from "react";
import * as dfd from 'danfojs';
import ParticipantList from "../../game_data/participants";
import CheckboxesTags from "../../components/checkboxestags";
import RadioHighlightReport from "../../components/radiohighlightreport";
import RadioHighlightLanguage from "../../components/radiohighlightlanguage";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Button } from "@mui/material";
import Lang from "../../locales/lang";
import html2pdf from 'html2pdf.js';

var lang = new Lang("eng", "cognitiveHighlight")
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
    const [selectedLang, setSelectedLang] = React.useState("eng")
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
    const selectLang = d => {
        setSelectedLang(d)
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
    useEffect(() => {
        lang.setLang(selectedLang)
        forceUpdate()
    }, [selectedLang])

    return (
        <div>
            <div className="no-print">
                <h1>Cognitive Highlights</h1>
                <h3>* Need to insert the files in order of BDS, Simon, and Color-shape (top to bottom)!</h3>
                <CSVReader parentCallback={handleUpload} gameId="bds" key="bds"/>
                <CSVReader parentCallback={handleUpload} gameId="simon" key="simon"/>
                <CSVReader parentCallback={handleUpload} gameId="cs" key="cs"/>
                
                <div className='no-print' style={{display: 'flex'}}>
                    <CheckboxesTags ids={allParticipantsIds || []} parentCallback={handleSelected}/>
                    <div style={{marginLeft:'10px'}}>
                        <RadioHighlightReport parentCallback={selectReport} value={selectedReport}/>
                        <RadioHighlightLanguage parentCallback={selectLang} value={selectedLang}/>
                        <Button variant="contained" onClick={() => printPlease(selectedIds)} disableElevation>Print</Button>
                    </div>
                </div>
            </div>
            {errorMessage && <h2>{errorMessage}</h2>}
            <div id="cognitivehighlights">
                {!errorMessage && <ParticipantListHighlights selectedReport={selectedReport} bdsList={bdsList.current} simonList={simonList.current} csList={csList.current} activeIds={selectedIds}/>}
            </div>
        </div>
    )
}

async function printPlease(selectedIds) {
    var idString = selectedIds[0]
    var element = document.getElementById("cognitivehighlights");
    var opt = {
        filename: "cognitivehighlights-" + idString + ".pdf",
        image: { type: "png" },
        html2canvas: { scale: 1 },
        jsPDF: { unit: "in", format: "letter", orientation: "landscape" },
        pagebreak: { before: ".print-together"}
    }
    html2pdf().set(opt).from(element).save();
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
    let bdsHighlight = props.bds !== null ? props.bds.game.getHighlights(reportSelected) : []
    let simonHighlight = props.simon !== null ? props.simon.game.getHighlights(reportSelected) : []
    let csHighlight = props.cs !== null ? props.cs.game.getHighlights(reportSelected) : []
    return (
        <div>
            <h3>{props.participant} - {lang.getString("digitTitle")}</h3>
            <p>{lang.getString("digitLongest", {x: bdsHighlight[0]})}</p>
            <p>{lang.getString("digitAverage", {x: bdsHighlight[1]})}</p>
            {props.bds !== null && <BdsAverageScoreGraph game={props.bds.game} lang={lang} lastReport={lastReport}/>}
            <div className="print-together">
                <h3>{props.participant} - {lang.getString("simonTitle")}</h3>
                <p>{lang.getString("simonAccuracyBest", {x: simonHighlight[0]})}</p>
                <p>{lang.getString("simonAccuracyAverage", {x: simonHighlight[1]})}</p>
                <p>{lang.getString("simonReactionTimeFirst", {x: simonHighlight[2]})}</p>
                <p>{lang.getString("simonReactionTimeAverage", {x: simonHighlight[3]})}</p>
                {lastReport && <p>{lang.getString("simonReactionTimeImprovement", {x: simonHighlight[4], y: simonHighlight[5]})}</p>}
                {props.simon !== null && <AccuracyScoreGraph game={props.simon.game} gameName={lang.getString("graphSimonAccuracyTitle")} lang={lang} lastReport={lastReport}/>}
                {props.simon !== null && <ReactionTimeGraph game={props.simon.game} gameName={lang.getString("graphSimonReactionTitle")} lang={lang} lastReport={lastReport}/>}
            </div>
            <div className="print-together">
                <h3>{props.participant} - {lang.getString("csTitle")}</h3>
                <p>{lang.getString("csAccuracyBest", {x: csHighlight[0]})}</p>
                <p>{lang.getString("csAccuracyAverage", {x: csHighlight[1]})}</p>
                <p>{lang.getString("csReactionTimeFirst", {x: csHighlight[2]})}</p>
                <p>{lang.getString("csReactionTimeAverage", {x: csHighlight[3]})}</p>
                {lastReport && <p>{lang.getString("csReactionTimeImprovement", {x: csHighlight[4], y: csHighlight[5]})}</p>}
                {props.cs !== null && <AccuracyScoreGraph game={props.cs.game} gameName={lang.getString("graphCsAccuracyTitle")} lang={lang} lastReport={lastReport}/>}
                {props.cs !== null && <ReactionTimeGraph game={props.cs.game} gameName={lang.getString("graphCsReactionTitle")} lang={lang} lastReport={lastReport}/>}
            </div>
        </div>
    )
}

function BdsAverageScoreGraph(props) {
    const rawData = props.game.getMaxCorrectDigitSpanDays()
    const lang = props.lang
    const lastReport = props.lastReport
    const DAYSOFWEEK = lang.getString("graphDaysOfWeek")
    const data = []
    const TOTALDAYS = lastReport ? 14 : 7
    for (let i = 0; i < TOTALDAYS; ++i) {
        if(rawData[i] === 0) continue;
        data.push({day: i + 1, weekday: i % 7, digitSpanLength: rawData[i]});
    }
    const yMax = Math.max(...rawData, 8)
    const yTicks = Array.from({length: yMax + 1}, (_, i) => i);
    return (
        <div className='print-together'>
            <h3>{lang.getString("graphDigitTitle")}</h3>
            <ResponsiveContainer width="100%" height={600}>
                <LineChart
                    width={500}
                    height={500}
                    data={data}
                    margin={{
                        top: 10,
                        right: 30,
                        left: 20,
                        bottom: 5
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis xAxisId="0" dataKey="day" type="number" domain={[1, 14]} tickCount={14}/>
                    <XAxis xAxisId="1" label={{value: lang.getString("graphDay"), position: 'insideBottom'}} 
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

                    <YAxis label={{ value: lang.getString("graphDigitMax"), angle: -90, position: 'left', style: {textAnchor: 'middle'}}} 
                        type="number" domain={[0, yMax]} 
                        ticks={yTicks} 
                        interval={1}/>
                    <Tooltip />
                    <Legend />
                    <Line name={lang.getString("graphDigitLength")} type="monotone" dataKey="digitSpanLength" stroke="#8884d8" activeDot={{ r: 8 }} 
                        strokeWidth={2.5} isAnimationActive={false}
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
    const lang = props.lang
    const DAYSOFWEEK = lang.getString("graphDaysOfWeek")
    const lastReport = props.lastReport
    const TOTALDAYS = lastReport ? 14 : 7
    const data = []
    for (let i = 0; i < TOTALDAYS; ++i) {
        if(rawData[i] === 0) continue;
        data.push({day: i + 1, weekday: i % 7, accuracy: rawData[i]});
    }
    
    return (
        <div className="print-together">
            <h3>{gameName}</h3>
            <ResponsiveContainer width="100%" height={600}>
                <LineChart
                    width={500}
                    height={500}
                    data={data}
                    margin={{
                        top: 10,
                        right: 30,
                        left: 20,
                        bottom: 5
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis xAxisId="0" dataKey="day" type="number" domain={[1, 14]} tickCount={14}/>
                    <XAxis xAxisId="1" label={{value: lang.getString("graphDay"), position: 'insideBottom'}} 
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
                    <YAxis label={{ value: lang.getString("graphSimonAccuracy"), angle: -90, position: 'left', style: {textAnchor: 'middle'}}} 
                        type="number" 
                        domain={[0, 100]} 
                        tickCount={11}
                        interval={0}
                        />
                    <Tooltip />
                    <Legend />
                    <Line name={lang.getString("graphSimonSessionAccuracy")} type="monotone" dataKey="accuracy" stroke="#8884d8" activeDot={{ r: 8 }} 
                        strokeWidth={2.5} isAnimationActive={false}
                        dot={{ stroke:"#8884d8", strokeWidth: 4, r: 2, strokeDasharray:''}}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}

function ReactionTimeGraph(props) {
    const gameName = props.gameName
    const rawData = props.game.getMeanCorrectReactionTime()
    const lang = props.lang
    const DAYSOFWEEK = lang.getString("graphDaysOfWeek")
    const lastReport = props.lastReport
    const TOTALDAYS = lastReport ? 14 : 7
    const data = []
    for (let i = 0; i < TOTALDAYS; ++i) {
        if(rawData[i] === 0) continue;
        data.push({day: i + 1, weekday: i % 7, reactionTime: parseFloat(rawData[i])});
    }

    return (
        <div className="print-together">
            <h3>{gameName}</h3>
            <ResponsiveContainer width="100%" height={600}>
                <LineChart
                    width={500}
                    height={500}
                    data={data}
                    margin={{
                        top: 10,
                        right: 30,
                        left: 30,
                        bottom: 5
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis xAxisId="0" dataKey="day" type="number" domain={[1, 14]} tickCount={14}/>
                    <XAxis xAxisId="1" label={{value: lang.getString("graphDay"), position: 'insideBottom'}} 
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
                    <YAxis label={{ value: lang.getString("graphSimonReactionAverage"), angle: -90, position: 'left', style: {textAnchor: 'middle'}}} 
                        type="number" 
                        tickCount={10}
                        allowDataOverflow={false}
                        />
                    <Tooltip />
                    <Legend />
                    <Line name={lang.getString("graphSimonReactionAverage")} type="monotone" dataKey="reactionTime" stroke="#8884d8" activeDot={{ r: 8 }} 
                        strokeWidth={2.5} isAnimationActive={false}
                        dot={{ stroke:"#8884d8", strokeWidth: 4, r: 2, strokeDasharray:''}}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}