import CSVReader from "../../components/csvread";
import React, { useEffect, useRef, useReducer } from "react";
import * as dfd from 'danfojs';
import ParticipantList from "../../game_data/participants";
import CheckboxesTags from "../../components/checkboxestags";
import RadioHighlightReport from "../../components/radiohighlightreport";
import RadioHighlightLanguage from "../../components/radiohighlightlanguage";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Button } from "@mui/material";
import GraphPoints from "../../components/graph/graphpoints";
import Lang from "../../locales/lang";
import html2pdf from 'html2pdf.js';

var lang = new Lang("eng", "cognitiveHighlight")
var fortune_lang = new Lang("eng", "fortuneHighlight")
export default function CognitiveHighlights() { // should rename this 
    const [bdsData, setBdsData] = React.useState(undefined)
    const [simonData, setSimonData] = React.useState(undefined)
    const [csData, setCsData] = React.useState(undefined)
    const [fortuneData, setFortuneData] = React.useState(undefined)
    const [, forceUpdate] = useReducer(x => x + 1, 0);
    const bdsList = useRef(null)
    const simonList = useRef(null)
    const csList = useRef(null)
    const fortuneList = useRef(null)
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
            case "fortune":
                setFortuneData(d)
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
                fortuneList.current = fortuneData !== undefined ? new ParticipantList(participants, fortuneData) : null
                let allList = []
                allList.push(...[bdsList.current, simonList.current, csList.current, fortuneList.current].filter(list => list !== null && list !== undefined))
                let participantIds = new Set(...allList.map(participantList => participantList.participants.map(participant => participant.id)))
                setAllParticipantsIds([...participantIds])
                setErrorMessage(undefined)
            }
            forceUpdate()
        }
    }, [bdsData, simonData, csData, fortuneData])
    useEffect(() => {
        lang.setLang(selectedLang)
        fortune_lang.setLang(selectedLang)
        forceUpdate()
    }, [selectedLang])

    return (
        <div>
            <div className="no-print">
                <h1>Mind Mix 1 Games Highlights</h1>
                <h3>* Need to insert the files in order of BDS, Simon, Color-shape and Fortune (top to bottom)!</h3>
                <CSVReader parentCallback={handleUpload} gameId="bds" key="bds"/>
                <CSVReader parentCallback={handleUpload} gameId="simon" key="simon"/>
                <CSVReader parentCallback={handleUpload} gameId="cs" key="cs"/>
                <CSVReader parentCallback={handleUpload} gameId="fortune" key="fortune"/>
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
            <div id="mindmixhighlights">
                {!errorMessage && <ParticipantListHighlights selectedReport={selectedReport} bdsList={bdsList.current} simonList={simonList.current} csList={csList.current} fortuneList={fortuneList.current} activeIds={selectedIds}/>}
            </div>
        </div>
    )
}

async function printPlease(selectedIds) {
    var idString = selectedIds[0]
    var element = document.getElementById("cognitivehighlights");
    var opt = {
        filename: "mix1highlights-" + idString + ".pdf",
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
    let fortuneList = props.fortuneList
    let allList = []
    allList.push(...[bdsList, simonList, csList, fortuneList].filter(list => list !== null && list !== undefined))
    let participantIds = new Set(...allList.map(participantList => participantList.participants.map(participant => participant.id)))
    const filteredParticipants = Array.from(participantIds).filter(participant => {
        return props.activeIds.includes(participant)})
    const participants = filteredParticipants.map(
        participant => <ParticipantHighlights key={participant} 
        participant={participant} 
        bds={bdsList && bdsList.getParticipant(participant)} 
        simon={simonList && simonList.getParticipant(participant)} 
        cs={csList && csList.getParticipant(participant)} 
        fortune={fortuneList && fortuneList.getParticipant(participant)}
        selectedReport={props.selectedReport}/>)
    return <div>
        {props.selectedReport && <GameExplanation selectedReport={props.selectedReport}/>}
        {participants}
    </div>
}

function GameExplanation(props) {
    if (props.selectedReport === "first-week") {
        return (
            <div className="print-together print-page-after">
                <h1>{lang.getString("thank")}</h1>
                <div dangerouslySetInnerHTML={{__html: lang.getString("intro")}}/>
            </div>
        )
    } else {
        return (
            <div className="print-together print-page-after">
                <h1>{fortune_lang.getString("thank")}</h1>
                <div dangerouslySetInnerHTML={{__html: fortune_lang.getString("intro")}}/>
            </div>
        )
    }
}

function ParticipantHighlights(props) {
    let reportSelected = props.selectedReport === "first-week" ? 0 : 1 // if its the first week that is cog, 2nd week is fortune
    let lastReport = reportSelected === 1

    // will check the selected report and return the correct highlight
    if (reportSelected === 0) {
        let bdsHighlight = props.bds !== null ? props.bds.game.getHighlights(reportSelected) : []
        let simonHighlight = props.simon !== null ? props.simon.game.getHighlights(reportSelected) : []
        let csHighlight = props.cs !== null ? props.cs.game.getHighlights(reportSelected) : []

        return (
            <div>
                <div className="print-together print-page-after">
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
        </div>
        )
    } else if (reportSelected === 1) {
        let fortuneHighlight = props.fortune !== null ? props.fortune.game.getHighlights(reportSelected) : []
        return (
            <div>
                <div className='print-together print-page-after'>
                    <h3>{props.participant} - {fortune_lang.getString("title")}</h3>
                    <p>{fortune_lang.getString("bestPoints")} {fortuneHighlight[0]}</p>
                    <p>{fortune_lang.getString("averagePoints")} {fortuneHighlight[1]}</p>
                    <p>{fortune_lang.getString("accumulatedScore")} {fortuneHighlight[2]}</p>
                    <p>{fortune_lang.getString("bestBonus")} {fortuneHighlight[3]}</p>
                    <p>{fortune_lang.getString("accumulatedBonus")} {fortuneHighlight[4]}</p>
                </div>
                {lastReport && props.fortune !== null && <FortunePointsGraph participant={props.participant} game={props.fortune.game} lang={fortune_lang} lastReport={lastReport}/>}
                {lastReport && <p>{fortune_lang.getString("dailyScores")}</p>}
                {lastReport && props.fortune !== null && <GraphPoints key={props.participant} participant={props.fortune} lang={fortune_lang} daysToShow={7}/>}
            </div>
        )   
    }
}

/**
 * Component that renders a line graph of the average score of a participant
 * in the Digit Span task for the last week. The x-axis represents the days
 * of the week, and the y-axis represents the maximum digit span.
 *
 * @param {Object} props - The component props
 * @param {Object} props.game - The game data
 * @param {Object} props.lang - The language data
 * @param {boolean} props.lastReport - Whether this is the last report
 */
function BdsAverageScoreGraph(props) {
    const rawData = props.game.getMaxCorrectDigitSpanDays()
    const lang = props.lang
    const DAYSOFWEEK = lang.getString("graphDaysOfWeek")
    const data = []
    const TOTALDAYS = 7
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
                    }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis xAxisId="0" dataKey="day" type="number" domain={[1, 7]} tickCount={7}/>
                    <XAxis xAxisId="1" label={{value: lang.getString("graphDay"), position: 'insideBottom',  dy: 15}} 
                        height={30}
                        dy={-10}
                        dataKey="day" 
                        type="number" 
                        domain={[1, 7]} 
                        tickCount={7} 
                        tickFormatter={(day) => DAYSOFWEEK[(day - 1) % 7]}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis label={{ value: lang.getString("graphDigitMax"), angle: -90, position: 'left', style: {textAnchor: 'middle'}}} 
                        type="number" domain={[0, yMax]} 
                        ticks={yTicks} 
                        interval={1}/>
                    <Tooltip />
                    <Legend
                        verticalAlign="bottom" 
                        align="center" 
                        wrapperStyle={{ paddingTop: 20, marginTop: 80 }} 
                    />
                    <Line name={lang.getString("graphDigitLength")} type="monotone" dataKey="digitSpanLength" stroke="#8884d8" activeDot={{ r: 8 }} 
                        strokeWidth={2.5} isAnimationActive={false}
                        dot={{ stroke:"#8884d8", strokeWidth: 4, r: 2, strokeDasharray:''}}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}

/**
 * Component that renders a line graph of the mean accuracy of a player in the given game for the last week. The x-axis represents the days of the week,
 * and the y-axis represents the accuracy in percentage.
 *
 * @param {Object} props - The component props
 * @param {String} props.gameName - The name of the game
 * @param {Object} props.game - The game data
 * @param {Object} props.lang - The language data
 * @param {Boolean} props.lastReport - Whether the last report is being displayed
 */
function AccuracyScoreGraph(props) {
    const gameName = props.gameName
    const rawData = props.game.getMeanSessionsAccuracys()
    const lang = props.lang
    const DAYSOFWEEK = lang.getString("graphDaysOfWeek")
    const TOTALDAYS = 7
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
                    <XAxis xAxisId="0" dataKey="day" type="number" domain={[1, 7]} tickCount={7}/>
                    <XAxis xAxisId="1" label={{value: lang.getString("graphDay"), position: 'insideBottom', dy: 15}} 
                        height={30}
                        dy={-10}
                        dataKey="day" 
                        type="number" 
                        domain={[1, 7]} 
                        tickCount={7} 
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
                    <Legend
                        verticalAlign="bottom" 
                        align="center" 
                        wrapperStyle={{ paddingTop: 20, marginTop: 80 }}
                    />
                    <Line name={lang.getString("graphSimonSessionAccuracy")} type="monotone" dataKey="accuracy" stroke="#8884d8" activeDot={{ r: 8 }} 
                        strokeWidth={2.5} isAnimationActive={false}
                        dot={{ stroke:"#8884d8", strokeWidth: 4, r: 2, strokeDasharray:''}}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}

/**
 * Component that renders a line graph of the mean correct reaction time by day for
 * a given game.
 *
 * @param {Object} props - The component props
 * @param {String} props.gameName - The name of the game
 * @param {Object} props.game - The game data
 * @param {Object} props.lang - The language data
 * @param {Boolean} props.lastReport - Whether the last report is being displayed
 */
function ReactionTimeGraph(props) {
    const gameName = props.gameName
    const rawData = props.game.getMeanCorrectReactionTime()
    const lang = props.lang
    const DAYSOFWEEK = lang.getString("graphDaysOfWeek")
    const TOTALDAYS = 7
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
                    }} >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis xAxisId="0" dataKey="day" type="number" domain={[1, 7]} tickCount={7}/>
                    <XAxis xAxisId="1" label={{value: lang.getString("graphDay"), position: 'insideBottom', dy: 15}} 
                        height={30}
                        dy={-10}
                        dataKey="day" 
                        type="number" 
                        domain={[1, 7]} 
                        tickCount={7} 
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
                    <Legend
                        verticalAlign="bottom" 
                        align="center" 
                        wrapperStyle={{ paddingTop: 20, marginTop: 80 }}
                    />
                    <Line name={lang.getString("graphSimonReactionAverage")} type="monotone" dataKey="reactionTime" stroke="#8884d8" activeDot={{ r: 8 }} 
                        strokeWidth={2.5} isAnimationActive={false}
                        dot={{ stroke:"#8884d8", strokeWidth: 4, r: 2, strokeDasharray:''}}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}

/**
 * Component that renders a line graph of the points earned by a player in the
 * Fortune game for the last week. The x-axis represents the days of the week,
 * and the y-axis represents the points earned.
 *
 * @param {Object} props - The component props
 * @param {Object} props.game - The game data
 * @param {Object} props.lang - The language data
 */
function FortunePointsGraph(props) {
    const rawData = props.game.getEndPoints()
    //need to use lang here again to make sure graph will update on refresh
    const lang = props.lang
    const DAYSOFWEEK = lang.getString("graphDaysOfWeek")
    const data = []
    const TOTALDAYS = 14
    for (let i = 7; i < TOTALDAYS; i++) {
        data.push({day: i + 1, y: rawData[i], weekday: i % 7})
    }
    const yMax = 5000
    const yMin = 0
    const yTicks = []
    for (let i = yMin; i <= yMax; i += 500) {
        yTicks.push(i)
    }
    const referenceValue = 2500
    return (
        <div className="print-before">
            <h3>{lang.getString("graphPointsTitle")}</h3>
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
                    <XAxis xAxisId="0" dataKey="day" type="number" domain={[8, 14]} tickCount={7}/>
                    <XAxis xAxisId="1" label={{value: lang.getString("graphDay"), position: 'insideBottom', dy: 15}} 
                        height={30}
                        dy={-10}
                        dataKey="day" 
                        type="number" 
                        domain={[8, 14]} 
                        tickCount={7} 
                        tickFormatter={(day) => DAYSOFWEEK[(day - 1) % 7]}
                        axisLine={false}
                        tickLine={false}
                        />
                    <YAxis label={{ value: lang.getString("graphPointsEarned"), angle: -90, position: 'left', style: {textAnchor: 'middle'}, offset: 20}} 
                        type="number" 
                        domain={[yMin, yMax]} 
                        ticks={yTicks}
                        />
                    <ReferenceLine y={referenceValue} stroke="red" />
                    <Tooltip />
                    <Legend 
                        verticalAlign="bottom" 
                        align="center" 
                        wrapperStyle={{ paddingTop: 20, marginTop: 80 }}
                    />
                    <Line name={lang.getString("graphPointsEarned")} type="monotone" dataKey="y" stroke="#8884d8" activeDot={{ r: 8 }} 
                        strokeWidth={2.5} isAnimationActive={false}
                        dot={{ stroke:"#8884d8", strokeWidth: 4, r: 2, strokeDasharray:''}}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}