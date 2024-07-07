import CSVReader from "../../components/csvread";
import React, { useEffect, useRef, useReducer } from "react";
import * as dfd from 'danfojs';
import ParticipantList from "../../game_data/participants";
import CheckboxesTags from "../../components/checkboxestags";
import RadioHighlightReport from "../../components/radiohighlightreport";

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
    let bdsHighlight = props.bds !== null ? props.bds.game.getHighlights(reportSelected).map((highlight, index) => <p key={index}>{highlight}</p>) : noData
    let simonHighlight = props.simon !== null ? props.simon.game.getHighlights(reportSelected).map((highlight, index) => <p key={index}>{highlight}</p>) : noData
    let csHighlight = props.cs !== null ? props.cs.game.getHighlights(reportSelected).map((highlight, index) => <p key={index}>{highlight}</p>) : noData
    return (
        <div>
            <h3>{props.participant} - Digit Span</h3>
            {bdsHighlight}
            <h3>{props.participant} - Simon</h3>
            {simonHighlight}
            <h3>{props.participant} - Color Shape</h3>
            {csHighlight}
        </div>
    )
}