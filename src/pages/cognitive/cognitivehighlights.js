import CSVReader from "../../components/csvread";
import React, { useEffect, useRef, useReducer } from "react";
import * as dfd from 'danfojs';
import ParticipantList from "../../game_data/participants";

export default function CognitiveHighlights() {
    const [bdsData, setBdsData] = React.useState(undefined)
    const [simonData, setSimonData] = React.useState(undefined)
    const [csData, setCsData] = React.useState(undefined)
    const [, forceUpdate] = useReducer(x => x + 1, 0);
    const bdsList = useRef(null)
    const simonList = useRef(null)
    const csList = useRef(null)
    const [errorMessage, setErrorMessage] = React.useState(undefined)   
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
                setErrorMessage(undefined)
            }
            forceUpdate()
        }
    }, [bdsData, simonData, csData])

    return (
        <div>
            <h1>Cognitive Highlights</h1>
            <CSVReader parentCallback={handleUpload} gameId="bds" key="bds"/>
            <CSVReader parentCallback={handleUpload} gameId="simon" key="simon"/>
            <CSVReader parentCallback={handleUpload} gameId="cs" key="cs"/>
            {errorMessage && <h2>{errorMessage}</h2>}
            {!errorMessage && <h2>{"No error"}</h2>}
            {!errorMessage && bdsList.current !== undefined && <ParticipantListHighlights participantList={bdsList.current} game="Digit Span"/>}
            {!errorMessage && simonList.current !== undefined && <ParticipantListHighlights participantList={simonList.current} game="Simon"/>}
        </div>
    )
}

function ParticipantListHighlights(props) {
    let participantList = props.participantList
    const participants = (participantList !== null && participantList !== undefined) && participantList.participants.map(
        participant => <ParticipantHighlights key={participant.id} participant={participant} game={props.game}/>)
    return (
        participants
    )
}

function ParticipantHighlights(props) {
    let participant = props.participant
    let game = props.game
    let message = participant.game.getHighlights().map((highlight, index) => <p key={index}>{highlight}</p>)
    return (
        <div>
            <h3>{participant.id} - {game}</h3>
            {message}
        </div>
    )
}