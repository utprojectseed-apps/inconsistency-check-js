import CSVReader from "../../components/csvread";
import React, { useEffect, useRef, useReducer } from "react";
import * as dfd from 'danfojs';
import ParticipantList from "../../game_data/participants";
import CheckboxesTags from "../../components/checkboxestags";
import RadioHighlightReport from "../../components/radiohighlightreport";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import DomToImage from "dom-to-image";
import fileDownload from "js-file-download";
import { Button } from "@mui/material";

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
            <h3>{props.participant} - Fortune Highlights</h3>
            {fortuneHighlight}
        </div>
    )
}